
import { NextRequest, NextResponse } from "next/server";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { GOOGLE_SHEETS_CONFIG } from "@/lib/constants";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, item } = body; // action: 'create' | 'update' | 'delete'

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
        const sheet = doc.sheetsByTitle["CATALOGO"];
        if (!sheet) throw new Error("Catalog sheet not found");

        const rows = await sheet.getRows();

        if (action === 'update') {
            console.log(`Update Request - Searching for ID: "${item.id}"`);
            const row = rows.find(r => String(r.get("ID")).trim() === String(item.id).trim());

            if (!row) {
                console.error(`Update Failed: Item with ID "${item.id}" not found in ${rows.length} rows.`);
                throw new Error("Item not found");
            }

            // Update fields
            if (item.nombre) row.set("Nombre", item.nombre);
            if (item.descripcion) row.set("Descripcion", item.descripcion);
            if (item.costo_sugerido !== undefined) row.set("Costo", item.costo_sugerido);
            if (item.frecuencia !== undefined) row.set("Frecuencia", item.frecuencia);
            if (item.categoria) row.set("Categoria", item.categoria);

            await row.save();
            return NextResponse.json({ success: true, message: "Item updated" });
        }

        if (action === 'create') {
            // Generate ID?
            // Simple ID generation strategy: S-{MaxID+1} for service, P-{MaxID+1} for part
            const prefix = item.tipo === 'Servicio' ? 'S-' : 'P-';
            const maxId = rows.reduce((max, r) => {
                const idStr = r.get("ID") || "";
                if (idStr.startsWith(prefix)) {
                    const num = parseInt(idStr.replace(prefix, ''));
                    return num > max ? num : max;
                }
                return max;
            }, 0);

            const newId = `${prefix}${maxId + 1}`;

            await sheet.addRow({
                "ID": newId,
                "Tipo": item.tipo,
                "Nombre": item.nombre,
                "Descripcion": item.descripcion || item.nombre,
                "Costo": item.costo_sugerido || 0,
                "Frecuencia": 1, // New items start with 1
                "Categoria": item.categoria || "General"
            });

            return NextResponse.json({ success: true, message: "Item created", id: newId });
        }

        if (action === 'delete') {
            console.log(`Delete Request - Searching for ID: "${item.id}"`);
            const row = rows.find(r => String(r.get("ID")).trim() === String(item.id).trim());

            if (!row) {
                console.error(`Delete Failed: Item with ID "${item.id}" not found.`);
                throw new Error("Item not found");
            }
            await row.delete();
            return NextResponse.json({ success: true, message: "Item deleted" });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("Update Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
