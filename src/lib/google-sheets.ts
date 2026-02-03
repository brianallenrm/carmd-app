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

    // --- Sanitization Helpers ---
    const toTitleCase = (str: string) => {
        if (!str) return "";
        return str.toLowerCase().replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
    };

    const cleanEmail = (email: string) => {
        if (!email) return "";
        // Check for company placeholder email (case insensitive)
        if (email.toLowerCase().includes("car.md.mx@hotmail.com")) return "";
        return email.toLowerCase();
    };

    const rawState = getVal(9); // Column J: Estado
    const isCdmx = /cdmx|ciudad de m|d\.f\./i.test(rawState);

    const formatStreet = (street: string) => {
        if (!street) return "";
        let clean = toTitleCase(street);
        // Standardize "no." -> "No."
        clean = clean.replace(/\bno\.\s*/gi, "No. ");
        // Standardize "num." -> "No."
        clean = clean.replace(/\bnum\.\s*/gi, "No. ");
        return clean.trim();
    };

    const formatColonia = (col: string) => {
        if (!col) return "";
        let clean = toTitleCase(col);
        // Prefix with Col. if missing
        if (!/^col\./i.test(clean) && !/^colonia/i.test(clean)) {
            clean = `Col. ${clean}`;
        }
        return clean.trim();
    };

    const formatMunDel = (val: string) => {
        if (!val) return "";
        let clean = toTitleCase(val);
        // Determine prefix based on State
        const prefix = isCdmx ? "Del." : "Mun.";

        // Add prefix if missing
        if (!clean.startsWith(prefix) && !clean.startsWith("Del") && !clean.startsWith("Mun")) {
            clean = `${prefix} ${clean}`;
        }
        return clean.trim();
    };

    const formatState = (state: string) => {
        if (!state) return "";
        // Standardize common states
        if (/cdmx|ciudad de/i.test(state)) return "CDMX";
        if (/estado de m|mex|edo/i.test(state)) return "Edo. Méx.";
        return toTitleCase(state);
    };

    const client = {
        name: toTitleCase(getVal(2)), // C
        phone: getVal(4) || getVal(3), // E (Whatsapp) or D (Oficina)
        email: cleanEmail(getVal(5)), // F
        address: [
            formatStreet(getVal(6)),      // G: Domicilio Calle
            formatColonia(getVal(7)),     // H: Colonia
            formatMunDel(getVal(8)),      // I: Deleg. o Mun
            formatState(getVal(9))        // J: Estado
        ].filter(Boolean).join(', '),
    };

    const vehicle = {
        brand: toTitleCase(getVal(10)), // K
        model: toTitleCase(getVal(11)), // L
        year: getVal(12), // M
        plates: (getVal(13) || plate).toUpperCase(), // N - Always uppercase plates
        vin: getVal(14).toUpperCase(), // O
        engine: getVal(15).toUpperCase(), // P
        odometer: parseInt(getVal(16).replace(/[^0-9]/g, '')) || 0, // Q
    };

    return { client, vehicle };
};
