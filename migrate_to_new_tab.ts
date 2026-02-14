import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function migrateDataFull() {
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

    const sourceSheet = doc.sheetsByTitle["Respuestas de formulario 1"];
    const destSheet = doc.sheetsByTitle["Inventarios_app"];

    if (!sourceSheet || !destSheet) {
        console.error("Source or Destination sheet not found");
        return;
    }

    // Essential columns mapping (by column index in source sheet)
    const mapping = [
        { index: 0, header: 'FECHA', useFormatted: true },
        { index: 1, header: 'Hora de ingreso:', useFormatted: true },
        { index: 2, header: 'Nombre COMPLETO o Empresa:', useFormatted: false },
        { index: 3, header: 'Teléfono casa / oficina:', useFormatted: false },
        { index: 4, header: 'Teléfono (whatsapp):', useFormatted: false },
        { index: 5, header: 'Dirección de correo electrónico', useFormatted: false },
        { index: 6, header: 'Domicilio Calle y NUMERO:', useFormatted: false },
        { index: 7, header: 'Colonia:', useFormatted: false },
        { index: 8, header: 'Deleg. o Municipio:', useFormatted: false },
        { index: 9, header: 'Estado:', useFormatted: false },
        { index: 10, header: 'Marca:', useFormatted: false },
        { index: 11, header: 'Sub marca:', useFormatted: false },
        { index: 12, header: 'Modelo (año):', useFormatted: false },
        { index: 13, header: 'Placas:', useFormatted: false },
        { index: 14, header: 'Número de serie:', useFormatted: false },
        { index: 15, header: 'Tipo de Motor:', useFormatted: false },
        { index: 16, header: 'Kilometraje:', useFormatted: false },
        { index: 17, header: 'Presupuesto Solicitado:', useFormatted: false },
        { index: 18, header: '¿El vehículo cuenta con la siguiente herramienta/objetos?', useFormatted: false },
        { index: 19, header: '¿Quién elaboró el inventario?', useFormatted: false },
        { index: 20, header: 'Adjuntar fotos de daños físicos del vehículo', useFormatted: false },
        { index: 21, header: '¿Cuál es el nivel de gasolina?', useFormatted: false },
        { index: 22, header: '¿Deja algún objeto de valor?', useFormatted: false },
        { index: 23, header: 'Correo Electronico', useFormatted: false },
        { index: 25, header: 'Detalles de daños', useFormatted: false },
    ];

    const destHeaders = mapping.map(m => m.header);

    // Step 1: CLEAR the destination sheet completely
    console.log("Step 1: Clearing Inventarios_app...");
    await destSheet.clear();
    // Set headers using USER_ENTERED (default) so they look normal
    await destSheet.setHeaderRow(destHeaders);
    console.log("  ✅ Headers set.");

    // Step 2: Read ALL rows from source using raw cell access (in batches)
    const totalRows = sourceSheet.rowCount;
    console.log(`Step 2: Source sheet has ${totalRows} total rows (including empty).`);

    const BATCH_SIZE = 500;
    const allRows: any[] = [];

    for (let startRow = 1; startRow < totalRows; startRow += BATCH_SIZE) {
        const endRow = Math.min(startRow + BATCH_SIZE, totalRows);
        console.log(`  Loading rows ${startRow + 1} to ${endRow}...`);

        await sourceSheet.loadCells({
            startRowIndex: startRow,
            endRowIndex: endRow,
            startColumnIndex: 0,
            endColumnIndex: 26,
        });

        for (let r = startRow; r < endRow; r++) {
            const rowData: any = {};
            let hasData = false;

            mapping.forEach(m => {
                const cell = sourceSheet.getCell(r, m.index);
                let value: string = '';

                if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
                    hasData = true;

                    if (m.useFormatted && cell.formattedValue) {
                        // Use Google's own formatted value for dates/times
                        value = cell.formattedValue;
                    } else {
                        value = String(cell.value);
                    }
                }

                rowData[m.header] = value;
            });

            if (hasData) {
                allRows.push(rowData);
            }
        }
    }

    console.log(`Step 3: Migrating ${allRows.length} rows to Inventarios_app...`);

    // Write in batches of 500, using RAW mode to prevent Google from re-interpreting text as dates
    for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
        const batch = allRows.slice(i, i + BATCH_SIZE);
        console.log(`  Writing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} rows)...`);
        await destSheet.addRows(batch, { raw: true });
    }

    console.log(`\n✅ Migration complete! ${allRows.length} rows transferred successfully.`);

    // Quick verification
    await destSheet.loadCells({ startRowIndex: 1, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 4 });
    console.log("\n--- Sample rows (FECHA | Hora | Nombre | Telefono) ---");
    for (let r = 1; r < 4; r++) {
        const fecha = destSheet.getCell(r, 0).value;
        const hora = destSheet.getCell(r, 1).value;
        const nombre = destSheet.getCell(r, 2).value;
        const tel = destSheet.getCell(r, 3).value;
        console.log(`  ${fecha} | ${hora} | ${nombre} | ${tel}`);
    }
}

migrateDataFull().catch(console.error);
