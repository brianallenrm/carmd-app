import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function analyze() {
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

    const rows = await sheet.getRows();
    console.log(`Total rows: ${rows.length}`);

    const clientStats = new Map();

    rows.forEach(row => {
        const name = row.get("Nombre COMPLETO o Empresa:")?.trim() || "Sin Nombre";
        const phone = row.get("Teléfono (whatsapp):")?.toString().trim() || "N/A";
        const plate = row.get("Placas:")?.toString().trim() || "N/A";

        if (!clientStats.has(name)) {
            clientStats.set(name, { visits: 0, plates: new Set(), phone });
        }
        const stats = clientStats.get(name);
        stats.visits++;
        if (plate !== "N/A") stats.plates.add(plate);
    });

    const list = Array.from(clientStats.entries())
        .map(([name, stats]) => ({ name, ...stats, plates: Array.from(stats.plates) }))
        .sort((a, b) => b.visits - a.visits);

    console.log(JSON.stringify(list.slice(0, 10), null, 2));
}

analyze().catch(console.error);
