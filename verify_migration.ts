import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function debugFlow() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const spreadsheetId = "1Y3w26f6EVar5Tl6YfFolv3571PjjT8dbUV4ffGolO4c";

    if (!email || !key) { console.error("Missing credentials"); return; }

    const auth = new JWT({ email, key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
    const doc = new GoogleSpreadsheet(spreadsheetId, auth);
    await doc.loadInfo();

    const sourceSheet = doc.sheetsByTitle["Respuestas de formulario 1"];
    if (!sourceSheet) { console.error("Not found"); return; }

    await sourceSheet.loadCells({ startRowIndex: 1, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 2 });

    const mapping = [
        { index: 0, header: 'FECHA', useFormatted: true },
        { index: 1, header: 'Hora de ingreso:', useFormatted: true },
    ];

    // Simulate what the migration script does
    for (let r = 1; r < 4; r++) {
        const rowData: any = {};
        mapping.forEach(m => {
            const cell = sourceSheet.getCell(r, m.index);
            let value: string = '';
            if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
                if (m.useFormatted && cell.formattedValue) {
                    value = cell.formattedValue;
                } else {
                    value = String(cell.value);
                }
            }
            rowData[m.header] = value;
        });
        console.log(`Row ${r} data object:`, JSON.stringify(rowData));
    }

    // Now test writing a single row to destSheet
    const destSheet = doc.sheetsByTitle["Inventarios_app"];
    if (!destSheet) { console.error("Dest not found"); return; }

    // Clear and set headers
    await destSheet.clear();
    await destSheet.setHeaderRow(['FECHA', 'Hora de ingreso:']);

    // Write a test row with explicit string values
    await destSheet.addRow({ 'FECHA': '14/2/2026', 'Hora de ingreso:': '7:45 a.m.' });

    // Wait a moment, then verify
    await destSheet.loadCells({ startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 2 });
    const c0 = destSheet.getCell(1, 0);
    const c1 = destSheet.getCell(1, 1);
    console.log(`\nVerification after write:`);
    console.log(`  FECHA: value=${c0.value}, type=${typeof c0.value}, formatted=${c0.formattedValue}`);
    console.log(`  Hora:  value=${c1.value}, type=${typeof c1.value}, formatted=${c1.formattedValue}`);
}

debugFlow().catch(console.error);
