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

// Helper to find ALL row indices by column letter and value
export const findRowIndicesByColumn = async (doc: GoogleSpreadsheet, sheetIndex: number, columnLetter: string, value: string): Promise<number[]> => {
    const sheet = doc.sheetsByIndex[sheetIndex];
    if (!sheet) return [];

    const rowCount = sheet.rowCount;
    // Load the search column
    await sheet.loadCells(`${columnLetter}2:${columnLetter}${rowCount}`);

    const normalize = (str: string) => String(str).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const normalizedSearch = normalize(value);
    const matches: number[] = [];

    // Search matches
    for (let i = 1; i < rowCount; i++) { // Start at 1 (Row 2)
        const cell = sheet.getCellByA1(`${columnLetter}${i + 1}`);
        const cellValue = cell.value;
        if (!cellValue) continue;

        const normalizedCell = normalize(String(cellValue));
        if (normalizedCell === normalizedSearch || normalizedCell.includes(normalizedSearch)) {
            matches.push(i);
        }
    }
    return matches; // Returns 0-based row indices
};

export const lookupVehicleByPlate = async (plate: string) => {
    const doc = await getInventoryDoc();
    const sheetIndex = doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.INVENTORY.TAB_NAME]
        ? doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.INVENTORY.TAB_NAME].index
        : 0;

    const sheet = doc.sheetsByIndex[sheetIndex];

    // 1. Find ALL Row Indices searching in Column N (Placas)
    const rowIndices = await findRowIndicesByColumn(doc, sheetIndex, 'N', plate);

    if (rowIndices.length === 0) return null;

    let bestRowIndex = rowIndices[rowIndices.length - 1]; // Default to last found (bottom-most)

    // 2. If multiple matches, find the one with the most recent date (Column A)
    if (rowIndices.length > 1) {
        // Load Column A (Date) for the matching rows
        // Optimization: Just load the specific cells we need? 
        // google-spreadsheet loadCells limits are loose, loading specific ranges is better.
        // We'll construct a range list or just load the whole column A if matches are scattered?
        // Loading whole column A is safest/easiest given 1000 rows.
        await sheet.loadCells(`A2:A${sheet.rowCount}`);

        // Sort indices by Date descending
        rowIndices.sort((a, b) => {
            const getJsDate = (rowIndex: number) => {
                const val = sheet.getCell(rowIndex, 0).value; // Col A is 0
                if (!val) return 0;
                // Handle Serial Number (Excel date)
                if (typeof val === 'number') {
                    return (val - 25569) * 86400 * 1000;
                }
                // Handle String
                const d = new Date(String(val));
                return isNaN(d.getTime()) ? 0 : d.getTime();
            };

            return getJsDate(b) - getJsDate(a); // Descending (Newest first)
        });

        bestRowIndex = rowIndices[0];
    }

    const rowIndex = bestRowIndex;

    // 3. Load the specific row data (Cols A to Q is enough)
    await sheet.loadCells(`A${rowIndex + 1}:Q${rowIndex + 1}`);

    const getVal = (colIndex: number) => {
        const val = sheet.getCell(rowIndex, colIndex).value;
        return val ? String(val) : '';
    };

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
