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

let cachedInventoryDoc: GoogleSpreadsheet | null = null;
export const getInventoryDoc = async () => {
    if (!cachedInventoryDoc) {
        cachedInventoryDoc = new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.INVENTORY.ID, serviceAccountAuth);
        await cachedInventoryDoc.loadInfo();
    }
    return cachedInventoryDoc;
};

let cachedMasterDoc: GoogleSpreadsheet | null = null;
export const getMasterDoc = async () => {
    if (!cachedMasterDoc) {
        cachedMasterDoc = new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.MASTER.ID, serviceAccountAuth);
        await cachedMasterDoc.loadInfo();
    }
    return cachedMasterDoc;
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

    // --- Search only the modern tab (Inventarios_app) ---
    const tabName = GOOGLE_SHEETS_CONFIG.INVENTORY.TAB_NAME;
    const targetSheet = doc.sheetsByTitle[tabName];
    
    if (!targetSheet) return null;

    const sheetIndex = targetSheet.index;
    const rowIndices = await findRowIndicesByColumn(doc, sheetIndex, 'N', plate);

    if (rowIndices.length === 0) return null;

    const sheet = doc.sheetsByIndex[sheetIndex];

    // Default to the FIRST match (since new entries are inserted at the top / Row 2)
    let bestRowIndex = rowIndices[0]; 

    // If multiple matches, find the one with the most recent date (Column A)
    if (rowIndices.length > 1) {
        await sheet.loadCells(`A2:A${sheet.rowCount}`);

        // Helper to parse dates in DD/MM/YYYY or similar formats
        const parseSpanishDate = (val: any) => {
            if (!val) return 0;
            if (typeof val === 'number') return (val - 25569) * 86400 * 1000;
            
            const str = String(val);
            // Try to handle DD/MM/YYYY HH:MM:SS
            const parts = str.split(/[\/\s:]/);
            if (parts.length >= 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // 0-based
                const year = parseInt(parts[2]);
                const d = new Date(year, month, day);
                return isNaN(d.getTime()) ? 0 : d.getTime();
            }
            
            const fallback = new Date(str);
            return isNaN(fallback.getTime()) ? 0 : fallback.getTime();
        };

        // Sort indices by Date descending
        rowIndices.sort((a, b) => parseSpanishDate(sheet.getCell(b, 0).value) - parseSpanishDate(sheet.getCell(a, 0).value));

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
        // Check for ANY company placeholder email (case insensitive)
        if (email.toLowerCase().includes("car.md.mx")) return "";
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

/**
 * Searches the MASTER spreadsheet ("TODOS" tab) from newest (bottom) to oldest (top)
 * to find a client's vehicle & name by license plate with fuzzy plate normalization.
 */
export const lookupVehicleInMasterByPlate = async (plateInput: string) => {
    try {
        const doc = await getMasterDoc();
        const sheet = doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.MASTER.TAB_NAME];
        if (!sheet) return null;

        const rows = await sheet.getRows();
        if (!rows || rows.length === 0) return null;

        const normalizePlate = (str: string) => String(str || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const targetPlate = normalizePlate(plateInput);
        if (!targetPlate || targetPlate.length < 3) return null;

        const toTitleCase = (str: string) => {
            if (!str) return "";
            return str.toLowerCase().replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
        };

        // Iterate backwards from newest (last row) to oldest (first row)
        for (let i = rows.length - 1; i >= 0; i--) {
            const row = rows[i];
            const rawPlate = String(row.get('Placa') || row.get('Placas') || '');
            const normalizedRowPlate = normalizePlate(rawPlate);

            let jsonMatch = false;
            let jsonObj: any = null;
            const metaStr = row.get('Metadatos');
            if (metaStr && typeof metaStr === 'string' && metaStr.trim().startsWith('{')) {
                try {
                    jsonObj = JSON.parse(metaStr.trim());
                    if (jsonObj?.vehicle?.plates && normalizePlate(jsonObj.vehicle.plates) === targetPlate) {
                        jsonMatch = true;
                    }
                } catch (e) {}
            }

            if (normalizedRowPlate === targetPlate || jsonMatch) {
                let name = String(row.get('Cliente') || '').trim();
                let vehicle = String(row.get('Vehiculo') || '').trim();
                let year = String(row.get('Anio') || row.get('Año') || '').trim();

                if (jsonObj?.client?.name) name = jsonObj.client.name;
                if (jsonObj?.vehicle?.brand) {
                    vehicle = `${jsonObj.vehicle.brand} ${jsonObj.vehicle.model || ''}`.trim();
                    if (jsonObj.vehicle.year) year = jsonObj.vehicle.year;
                }

                // Clean year string (e.g. "Mod. 2023" -> "2023")
                const cleanYear = year.replace(/mod\.\s*/gi, '').trim();
                const cleanName = toTitleCase(name);
                const cleanVehicle = toTitleCase(vehicle);
                const fullVehicle = cleanYear ? `${cleanVehicle} ${cleanYear}` : cleanVehicle;

                console.log(`[Master Lookup] Placa "${plateInput}" (normalizada: "${targetPlate}") encontrada en la nota folio ${row.get('Folio')}: Cliente="${cleanName}", Vehículo="${fullVehicle}"`);

                return {
                    name: cleanName,
                    vehicle: fullVehicle,
                    brand: cleanVehicle,
                    model: cleanYear,
                    plate: targetPlate,
                    rawPlate: rawPlate,
                    folio: row.get('Folio'),
                    date: row.get('Fecha'),
                    found: true
                };
            }
        }
    } catch (err) {
        console.error("Error in lookupVehicleInMasterByPlate:", err);
    }
    return null;
};

/**
 * Securely checks if a plate exists without returning data.
 */
export const checkVehiclePlate = async (plate: string) => {
    const doc = await getInventoryDoc();
    const tabName = GOOGLE_SHEETS_CONFIG.INVENTORY.TAB_NAME;
    const targetSheet = doc.sheetsByTitle[tabName];
    if (!targetSheet) return { exists: false };

    const rowIndices = await findRowIndicesByColumn(doc, targetSheet.index, 'N', plate);
    return { exists: rowIndices.length > 0 };
};

/**
 * Unlocks vehicle data only if the last 4 digits of the phone match.
 */
export const unlockVehicleData = async (plate: string, last4: string) => {
    const data = await lookupVehicleByPlate(plate);
    if (!data) return { success: false };

    const cleanPhone = data.client.phone.replace(/[^0-9]/g, '');
    const actualLast4 = cleanPhone.slice(-4);

    if (actualLast4 === last4) {
        return { 
            success: true, 
            userData: {
                name: data.client.name,
                phone: data.client.phone,
                email: data.client.email,
                vehicle: `${data.vehicle.brand} ${data.vehicle.model}`,
                year: data.vehicle.year,
                vin: data.vehicle.vin,
                km: data.vehicle.odometer
            } 
        };
    }
    return { success: false };
};

/**
 * Retrieves all appointments from the CITAS_2025 tab.
 */
export const getCitas = async () => {
    const doc = await getInventoryDoc();
    const sheet = doc.sheetsByTitle["CITAS_2025"];
    if (!sheet) return [];

    const rows = await sheet.getRows();
    return rows.map(r => ({
        timestamp: r.get("Fecha_Registro"),
        plate: r.get("Placa"),
        name: r.get("Nombre"),
        phone: r.get("WhatsApp"),
        email: r.get("Email"),
        vehicle: r.get("Vehiculo"),
        year: r.get("Año"),
        km: r.get("KM"),
        date: r.get("Fecha_Cita"),
        time: r.get("Hora_Cita"),
        problem: r.get("Problema"),
        status: r.get("Estatus") || "Pendiente",
        id: r.rowNumber
    }));
};

/**
 * Retrieves the current chat state for a phone number.
 */
export const getChatState = async (phone: string) => {
    const doc = await getInventoryDoc();
    const sheet = doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.INVENTORY.CHAT_SESSIONS_TAB!];
    if (!sheet) {
        console.warn("CHAT_SESSIONS sheet not found. Bot state will not persist.");
        return null;
    }

    const rows = await sheet.getRows();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10); // Last 10 digits
    const row = rows.find(r => {
        const val = r.get("phone");
        if (!val || typeof val !== 'string') return false;
        return val.replace(/\D/g, '').endsWith(cleanPhone);
    });
    
    if (!row) return null;

    return {
        phone: row.get("phone"),
        state: row.get("state"),
        lastUpdate: row.get("last_update"),
        vehicleProblem: row.get("vehicle_problem"),
        chatHistory: row.get("chat_history") || '[]',
        id: row.rowNumber
    };
};

/**
 * Updates or creates a chat session state.
 */
export const updateChatState = async (phone: string, state: string, vehicleProblem?: string, chatHistory?: string) => {
    const doc = await getInventoryDoc();
    const sheet = doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.INVENTORY.CHAT_SESSIONS_TAB!];
    if (!sheet) return;

    const rows = await sheet.getRows();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const existingRow = rows.find(r => r.get("phone").replace(/\D/g, '').endsWith(cleanPhone));

    const now = new Date().toISOString();

    if (existingRow) {
        existingRow.set("state", state);
        existingRow.set("last_update", now);
        if (vehicleProblem !== undefined) existingRow.set("vehicle_problem", vehicleProblem);
        if (chatHistory !== undefined) existingRow.set("chat_history", chatHistory);
        await existingRow.save();
    } else {
        await sheet.addRow({
            phone,
            state,
            last_update: now,
            vehicle_problem: vehicleProblem || '',
            chat_history: chatHistory || '[]'
        });
    }
};

/**
 * Retrieves the message history for a given phone number (reads from the chat_history cell).
 */
export const getChatMessages = async (phone: string) => {
    try {
        const chatState = await getChatState(phone);
        if (!chatState || !chatState.chatHistory) return [];
        const messages = JSON.parse(chatState.chatHistory);
        if (Array.isArray(messages)) {
            return messages.slice(-50); // Keep last 50
        }
    } catch (e) {
        console.error("Error parsing chat history cell:", e);
    }
    return [];
};

/**
 * Saves a new chat message into the chat_history cell of CHAT_SESSIONS.
 */
export const saveChatMessage = async (phone: string, sender: 'client' | 'assistant' | 'admin', text: string) => {
    try {
        const doc = await getInventoryDoc();
        const sheet = doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.INVENTORY.CHAT_SESSIONS_TAB!];
        if (!sheet) return;

        const rows = await sheet.getRows();
        const cleanPhone = phone.replace(/\D/g, '').slice(-10);
        const existingRow = rows.find(r => r.get("phone").replace(/\D/g, '').endsWith(cleanPhone));

        const now = new Date().toISOString();
        const newMsg = { phone, sender, text, timestamp: now };

        if (existingRow) {
            let historyList: any[] = [];
            try {
                const rawHistory = existingRow.get("chat_history");
                if (rawHistory && rawHistory.startsWith('[')) {
                    historyList = JSON.parse(rawHistory);
                }
            } catch (e) {}

            historyList.push(newMsg);
            existingRow.set("chat_history", JSON.stringify(historyList));
            existingRow.set("last_update", now);
            await existingRow.save();
        } else {
            // Si es un número totalmente nuevo, creamos la fila de sesión con el primer mensaje
            await sheet.addRow({
                phone,
                state: 'START',
                last_update: now,
                vehicle_problem: '',
                chat_history: JSON.stringify([newMsg])
            });
        }
        console.log(`[Google Sheets] Guardado mensaje en celda 'chat_history' para ${phone} de ${sender}`);
    } catch (error) {
        console.error("Error saving chat message to session cell:", error);
    }
};
