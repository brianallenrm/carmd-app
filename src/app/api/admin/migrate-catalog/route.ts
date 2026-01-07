
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";
import { GOOGLE_SHEETS_CONFIG } from "@/lib/constants";
import catalogDataRaw from '../../../../../public/catalog/catalogo_final.json';

export async function GET(req: Request) {
    try {
        // 1. Auth
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

        await sheet.loadHeaderRow();
        const headers = ["ID", "Tipo", "Nombre", "Descripcion", "Costo", "Frecuencia", "Categoria"];
        // Only set header if empty
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

        // 4. Batch Upload (Check if already populated to avoid dupes)
        const rows = await sheet.getRows({ limit: 5 });
        if (rows.length > 0) {
            return NextResponse.json({ message: "Catalog sheet already has data. Aborting to avoid duplicates." });
        }

        // Add in chunks to avoid timeout
        const chunkSize = 500;
        for (let i = 0; i < allRows.length; i += chunkSize) {
            const chunk = allRows.slice(i, i + chunkSize);
            await sheet.addRows(chunk);
            console.log(`Uploaded chunk ${i} to ${i + chunkSize}`);
        }

        return NextResponse.json({ success: true, count: allRows.length });

    } catch (error) {
        console.error("Migration Error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
