import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function debugHeadersRaw() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const spreadsheetId = "1Y3w26f6EVar5Tl6YfFolv3571PjjT8dbUV4ffGolO4c";

    if (!email || !key) {
        console.error("Missing credentials");
        return;
    }

    const auth = new JWT({
        email,
        key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const doc = new GoogleSpreadsheet(spreadsheetId, auth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle["Respuestas de formulario 1"];
    if (!sheet) {
        console.error("Sheet not found");
        return;
    }

    // Load first row (Dynamic bounds)
    await sheet.loadCells({ startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: sheet.columnCount });

    const headers = [];
    for (let i = 0; i < sheet.columnCount; i++) {
        const cell = sheet.getCell(0, i);
        if (cell.value) {
            headers.push({ index: i, value: cell.value });
        } else {
            // Include empty headers for analysis
            headers.push({ index: i, value: '[EMPTY]' });
        }
    }

    console.log(`Raw Headers in A1 to Index ${sheet.columnCount - 1}:`);
    headers.forEach(h => console.log(`${h.index}: ${h.value}`));

    // Check for duplicates
    const counts: Record<string, number> = {};
    headers.forEach(h => {
        const val = h.value.toString().trim();
        counts[val] = (counts[val] || 0) + 1;
    });

    console.log("\nDuplicates found (trimmed):");
    Object.entries(counts).forEach(([val, count]) => {
        if (count > 1 && val !== '[EMPTY]') {
            console.log(`'${val}': ${count} times`);
        }
    });

    // Check for "empty" but existing headers
    const emptyCount = headers.filter(h => h.value === '[EMPTY]').length;
    console.log(`\nFound ${emptyCount} empty/blank header slots.`);
}

debugHeadersRaw().catch(console.error);
