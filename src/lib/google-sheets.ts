import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Config variables
import { GOOGLE_SHEETS_CONFIG } from './constants';

// Config variables
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    console.error("Missing Google Service Account credentials.");
}

const serviceAccountAuth = new JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});

export const getInventoryDoc = async () => {
    const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.INVENTORY.ID, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
};

export const getMasterDoc = async () => {
    const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.MASTER.ID, serviceAccountAuth);
    await doc.loadInfo();
    return doc;
};

// Helper to find a row index by column letter and value
export const findRowIndexByColumn = async (doc: GoogleSpreadsheet, sheetIndex: number, columnLetter: string, value: string): Promise<number | null> => {
    const sheet = doc.sheetsByIndex[sheetIndex];
    // Load the column.
    // Use the actual row count from the sheet metadata
    const rowCount = sheet.rowCount;
    // Load all rows in this column to ensure we find the very last entry
    await sheet.loadCells(`${columnLetter}2:${columnLetter}${rowCount}`);

    // Search from newest (bottom) to oldest (top) implies finding the LAST occurrence or iterating reverse?
    // Inventory usually adds to bottom.
    // Google Sheets API loads cells. We can iterate rows.

    // Normalize search
    // Normalize search
    const normalizedSearch = String(value).toUpperCase().replace(/\s/g, '');

    // Search backwards from the last row
    for (let i = rowCount - 1; i >= 1; i--) { // i=1 because row 0 is header
        const cell = sheet.getCellByA1(`${columnLetter}${i + 1}`); // 0-indexed row, but A1 uses 1-based
        const cellValue = cell.value;
        if (!cellValue) continue;

        const normalizedCell = String(cellValue).toUpperCase().replace(/\s/g, '');
        if (normalizedCell === normalizedSearch || normalizedCell.includes(normalizedSearch)) { // Allowing include for robustness
            return i; // Return 0-indexed row number
        }
    }
    return null;
};

export const lookupVehicleByPlate = async (plate: string) => {
    const doc = await getInventoryDoc();
    const sheetIndex = doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.INVENTORY.TAB_NAME]
        ? doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.INVENTORY.TAB_NAME].index
        : 0;

    const sheet = doc.sheetsByIndex[sheetIndex];

    // 1. Find the Row Index searching in Column N (Placas)
    // N is the 14th letter.
    const rowIndex = await findRowIndexByColumn(doc, sheetIndex, 'N', plate);

    if (rowIndex === null) return null;

    // 2. Load the specific row data (Cols A to Q is enough)
    // A=0, Q=16.
    await sheet.loadCells(`A${rowIndex + 1}:Q${rowIndex + 1}`);

    const getVal = (colIndex: number) => {
        const val = sheet.getCell(rowIndex, colIndex).value;
        return val ? String(val) : '';
    };

    // 3. Map by Column Index (0-based) based on Debug Analysis
    // Col 0 (A): "Fecha de Ingreso:"
    // Col 1 (B): "Hora de ingreso:"
    // Col 2 (C): "Nombre COMPLETO o Empresa:"
    // Col 3 (D): "Teléfono casa / oficina: "
    // Col 4 (E): "Teléfono (whatsapp):"
    // Col 5 (F): "Dirección de correo electrónico"
    // Col 6 (G): "Domicilio Calle y NUMERO:"
    // Col 7 (H): "Colonia:"
    // Col 8 (I): "Deleg. o Municipio:"
    // Col 9 (J): "Estado:"
    // Col 10 (K): "Marca: "
    // Col 11 (L): "Sub marca:"
    // Col 12 (M): "Modelo (año):"
    // Col 13 (N): "Placas:"
    // Col 14 (O): "Número de serie:"
    // Col 15 (P): "Tipo de Motor:"
    // Col 16 (Q): "Kilometraje:"

    const client = {
        name: getVal(2), // C
        phone: getVal(4) || getVal(3), // E (Whatsapp) or D (Oficina)
        email: getVal(5), // F
        address: [
            getVal(6), // G
            getVal(7), // H
            getVal(8), // I
            getVal(9)  // J
        ].filter(Boolean).join(', '),
    };

    const vehicle = {
        brand: getVal(10), // K
        model: getVal(11), // L
        year: getVal(12), // M
        plates: getVal(13) || plate, // N
        vin: getVal(14), // O
        engine: getVal(15), // P
        odometer: parseInt(getVal(16).replace(/[^0-9]/g, '')) || 0, // Q
    };

    return { client, vehicle };
};
