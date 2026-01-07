
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";
import { GOOGLE_SHEETS_CONFIG } from "@/lib/constants";
import catalogDataRaw from '../../../../../public/catalog/catalogo_final.json';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '0');
        const limit = parseInt(searchParams.get('limit') || '50');

        // 1. Auth with Google Sheets
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            throw new Error("Missing Google Sheets Credentials");
        }

        const auth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.MASTER.ID, auth);
        await doc.loadInfo();

        // 2. Init Sheet "CATALOGO"
        let sheet = doc.sheetsByTitle["CATALOGO"];
        if (!sheet) {
            sheet = await doc.addSheet({ title: "CATALOGO" });
        }

        // Check headers
        await sheet.loadHeaderRow();
        const headers = ["ID", "Tipo", "Nombre", "Descripcion", "Costo", "Frecuencia", "Categoria"];
        if (sheet.headerValues.length === 0) {
            await sheet.setHeaderRow(headers);
        }

        // 3. Prepare Data
        const services = (catalogDataRaw as any).servicios.map((item: any) => ({
            "ID": `S-${item.id}`,
            "Tipo": "Servicio",
            "Nombre": item.nombre,
            "Descripcion": item.descripcion,
            "Costo": item.costo_sugerido,
            "Frecuencia": item.frecuencia,
            "Categoria": item.categoria || "General"
        }));

        const parts = (catalogDataRaw as any).refacciones.map((item: any) => ({
            "ID": `P-${item.id}`,
            "Tipo": "Refaccion",
            "Nombre": item.nombre,
            "Descripcion": item.descripcion,
            "Costo": item.costo_sugerido,
            "Frecuencia": item.frecuencia,
            "Categoria": item.categoria || "General"
        }));

        const allRows = [...services, ...parts];

        // Slice for pagination
        const start = page * limit;
        const end = start + limit;
        const chunk = allRows.slice(start, end);

        if (chunk.length === 0) {
            return NextResponse.json({ success: true, count: 0, completed: true });
        }

        // 4. Batch Upload
        // Add safeguard: if this is page 0, maybe clear sheet? No, too dangerous.
        // Just append.

        await sheet.addRows(chunk);
        console.log(`Uploaded page ${page} (items ${start} to ${end})`);

        return NextResponse.json({
            success: true,
            count: chunk.length,
            page,
            totalItems: allRows.length,
            totalPages: Math.ceil(allRows.length / limit)
        });

    } catch (error: any) {
        console.error("Migration Error:", error);
        // Important: Return JSON error so client can display it
        return NextResponse.json({
            success: false,
            error: error.message || String(error),
            stack: error.stack
        }, { status: 500 });
    }
}
