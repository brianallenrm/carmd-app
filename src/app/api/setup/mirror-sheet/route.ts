import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";
import { GOOGLE_SHEETS_CONFIG } from "@/lib/constants";

// One-time setup: writes the mirror formula into the CONSULTA tab
export async function GET() {
    try {
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

        const sheet = doc.sheetsByTitle["CONSULTA"];
        if (!sheet) {
            return NextResponse.json({ success: false, error: "La pestaña CONSULTA no existe. Créala primero en Google Sheets." }, { status: 404 });
        }

        // Load cell A1 and write the mirror formula
        await sheet.loadCells("A1");
        const cell = sheet.getCellByA1("A1");
        cell.formula = `=QUERY(TODOS!A:N,"select * where Col1 is not null",1)`;
        await sheet.saveUpdatedCells();

        return NextResponse.json({ 
            success: true, 
            message: "✅ Fórmula escrita en CONSULTA!A1. La pestaña ahora es un espejo de TODOS y se actualizará automáticamente." 
        });

    } catch (error) {
        console.error("Setup mirror sheet error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
