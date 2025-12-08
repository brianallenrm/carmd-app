
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { GOOGLE_SHEETS_CONFIG } from './src/lib/constants';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function debugHeaders() {
    try {
        console.log("Authenticating...");
        const jwt = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.INVENTORY.ID, jwt);
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.INVENTORY.TAB_NAME];

        console.log(`Sheet Title: ${sheet.title}`);
        // Avoid loadHeaderRow due to duplicates
        await sheet.loadCells('A1:Z1');
        console.log("Headers found (A1-Z1):");
        const headers = [];
        for (let col = 0; col < 26; col++) {
            const cell = sheet.getCell(0, col);
            headers.push(cell.value);
            console.log(`Col ${col} (${String.fromCharCode(65 + col)}): "${cell.value}"`);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

debugHeaders();
