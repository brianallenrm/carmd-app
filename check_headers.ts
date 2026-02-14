import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function checkHeaders() {
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

    const sheet = doc.sheetsByTitle["Inventario_Vista"];
    if (!sheet) {
        console.error("Sheet not found");
        return;
    }

    await sheet.loadHeaderRow();
    console.log("Headers:", sheet.headerValues);

    const rows = await sheet.getRows();
    if (rows.length > 0) {
        console.log("First row Raw Data Keys:", Object.keys(rows[0].toObject()));
    }
}

checkHeaders().catch(console.error);
