import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";
import { GOOGLE_SHEETS_CONFIG } from "@/lib/constants";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { client, vehicle, services, parts, company, includeIva, date } = body;

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

        const sheet = doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.MASTER.TAB_NAME];
        if (!sheet) throw new Error(`Sheet '${GOOGLE_SHEETS_CONFIG.MASTER.TAB_NAME}' not found`);

        // 2. Calculate New Folio
        const rows = await sheet.getRows();
        let lastFolio = 0;

        if (rows.length > 0) {
            const lastRow = rows[rows.length - 1];
            // Accessing column "Folio" (Header row 1)
            const lastFolioVal = parseInt(lastRow.get("Folio"));
            if (!isNaN(lastFolioVal)) {
                lastFolio = lastFolioVal;
            }
        }

        const newFolio = (lastFolio + 1).toString().padStart(5, '0'); // e.g., 04674

        // 3. Prepare Data
        // Sum costs: Handled separately now
        const laborTotal = services.reduce((sum: number, s: any) => sum + (s.laborCost || 0), 0);
        // Safely handle parts array if missing
        const safeParts = parts || [];
        const partsTotal = safeParts.reduce((sum: number, p: any) => sum + (p.partsCost || 0), 0);

        // Calculate totals logic matches frontend/PDF
        const subtotal = laborTotal + partsTotal;
        const iva = includeIva ? subtotal * 0.16 : 0;
        const total = subtotal + iva;

        // Join service descriptions (Services + Parts)
        const serviceDescs = services.map((s: any) => s.description);
        const partDescs = safeParts.map((p: any) => `(Ref) ${p.description}`); // Prefix parts for clarity? Or just list them. User didn't specify, but joining them makes sense.
        // Actually, just listing them is fine.
        const allDescriptions = [...serviceDescs, ...partDescs].filter(Boolean).join(" | ");

        // "N1: Factura" logic
        const facturaStatus = includeIva ? "factura" : "";

        // Map to columns (Headers must match EXACTLY what is in the sheet for `addRow` to work by header name, 
        // OR we can use an array if we know the order. 
        // User gave A1...N1. 
        // Ideally we use header keys if the sheet has headers in row 1.
        // Let's assume headers are: "Folio", "Fecha", "Cliente", "Correo", "Telefono", "Vehiculo", "Anio", "Placa", "KM", "Servicio", "MO", "Refacciones", "Total", "Factura"

        const rowData = {
            "Folio": newFolio,
            "Fecha": date, // e.g. "4/1/23"
            "Cliente": client.name,
            "Correo": client.email || "*", // Fallback per screenshot
            "Telefono": client.phone,
            "Vehiculo": `${vehicle.brand} ${vehicle.model}`,
            "Anio": vehicle.year,
            "Placa": vehicle.plates,
            "KM": vehicle.odometer,
            "Servicio": allDescriptions,
            "MO": laborTotal,
            "Refacciones": partsTotal,
            "Total": total,
            "Factura": facturaStatus
        };

        // 4. Append Row
        await sheet.addRow(rowData);

        return NextResponse.json({ success: true, folio: newFolio });

    } catch (error) {
        console.error("Error saving service note:", error);
        return NextResponse.json({ success: false, error: "Failed to save note" }, { status: 500 });
    }
}
