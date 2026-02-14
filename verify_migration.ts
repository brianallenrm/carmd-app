import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function addMissingColumns() {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const spreadsheetId = "1Y3w26f6EVar5Tl6YfFolv3571PjjT8dbUV4ffGolO4c";

    if (!email || !key) { console.error("Missing credentials"); return; }

    const auth = new JWT({ email, key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
    const doc = new GoogleSpreadsheet(spreadsheetId, auth);
    await doc.loadInfo();

    const destSheet = doc.sheetsByTitle["Inventarios_app"];
    if (!destSheet) { console.error("Inventarios_app not found"); return; }

    await destSheet.loadHeaderRow();
    const currentHeaders = destSheet.headerValues;

    console.log("Current headers in Inventarios_app:");
    currentHeaders.forEach((h, i) => console.log(`  ${i}: ${h}`));

    // Columns needed by the save API that are NOT in the current headers:
    const missingColumns = [
        'Datos Inspección Visual',
        'Motivo de Ingreso',
    ].filter(col => !currentHeaders.includes(col));

    if (missingColumns.length === 0) {
        console.log("\n✅ All required columns already exist!");
    } else {
        console.log(`\n⚠️ Missing columns: ${missingColumns.join(', ')}`);
        const newHeaders = [...currentHeaders, ...missingColumns];

        // Check if sheet is wide enough
        if (newHeaders.length > destSheet.columnCount) {
            console.log(`Resizing sheet from ${destSheet.columnCount} to ${newHeaders.length} columns...`);
            await destSheet.resize({ rowCount: destSheet.rowCount, columnCount: newHeaders.length });
        }

        await destSheet.setHeaderRow(newHeaders);
        console.log("✅ Missing columns added!");
    }

    // Verify final state
    await destSheet.loadHeaderRow();
    console.log("\nFinal headers:");
    destSheet.headerValues.forEach((h, i) => console.log(`  ${i}: ${h}`));

    // Also check the test sheet to see its headers for comparison
    const testSheet = doc.sheetsByTitle["Inventario_entorno_prueba"];
    if (testSheet) {
        await testSheet.loadHeaderRow();
        console.log("\nHeaders in Inventario_entorno_prueba:");
        testSheet.headerValues.forEach((h, i) => console.log(`  ${i}: ${h}`));
    }
}

addMissingColumns().catch(console.error);
