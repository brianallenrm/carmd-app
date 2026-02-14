import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function migrateDataRaw() {
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

    // Essential columns mapping (Index based from debug_raw_headers.ts)
    const mapping = [
        { index: 0, header: 'FECHA' },
        { index: 1, header: 'Hora de ingreso:' },
        { index: 2, header: 'Nombre COMPLETO o Empresa:' },
        { index: 3, header: 'Teléfono casa / oficina:' },
        { index: 4, header: 'Teléfono (whatsapp):' },
        { index: 5, header: 'Dirección de correo electrónico' },
        { index: 6, header: 'Domicilio Calle y NUMERO:' },
        { index: 7, header: 'Colonia:' },
        { index: 8, header: 'Deleg. o Municipio:' },
        { index: 9, header: 'Estado:' },
        { index: 10, header: 'Marca:' },
        { index: 11, header: 'Sub marca:' },
        { index: 12, header: 'Modelo (año):' },
        { index: 13, header: 'Placas:' },
        { index: 14, header: 'Número de serie:' },
        { index: 15, header: 'Tipo de Motor:' },
        { index: 16, header: 'Kilometraje:' },
        { index: 17, header: 'Presupuesto Solicitado:' },
        { index: 18, header: '¿El vehículo cuenta con la siguiente herramienta/objetos?' },
        { index: 19, header: '¿Quién elaboró el inventario?' },
        { index: 20, header: 'Adjuntar fotos de daños físicos del vehículo' },
        { index: 21, header: '¿Cuál es el nivel de gasolina?' },
        { index: 22, header: '¿Deja algún objeto de valor?' },
        { index: 23, header: 'Correo Electronico' },
        { index: 25, header: 'Detalles de daños' }
    ];

    const destHeaders = mapping.map(m => m.header);

    // Prepare destination sheet
    try {
        await destSheet.setHeaderRow(destHeaders);
        console.log("Headers set successfully for Inventarios_app.");
    } catch (err) {
        console.log("Could not set headers (maybe already exist):", err.message);
    }

    // Load ALL cells from source (Row 2 to 1000, Column 1 to 26)
    const rowCount = sourceSheet.rowCount > 500 ? 500 : sourceSheet.rowCount;
    console.log(`Loading cells for ${rowCount} rows...`);
    await sourceSheet.loadCells({
        startRowIndex: 1,
        endRowIndex: rowCount,
        startColumnIndex: 0,
        endColumnIndex: 26
    });

    const rowsToMigrate = [];
    for (let r = 1; r < rowCount; r++) {
        const rowData: any = {};
        let hasData = false;
        mapping.forEach(m => {
            const cell = sourceSheet.getCell(r, m.index);
            rowData[m.header] = cell.value || '';
            if (cell.value) hasData = true;
        });
        if (hasData) {
            rowsToMigrate.push(rowData);
        }
    }

    console.log(`Migrating ${rowsToMigrate.length} rows...`);
    if (rowsToMigrate.length > 0) {
        await destSheet.addRows(rowsToMigrate);
    }
    console.log("Migration complete!");
}

migrateDataRaw().catch(console.error);
