import { NextRequest, NextResponse } from "next/server";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { GOOGLE_SHEETS_CONFIG } from "@/lib/constants";

export async function GET(req: NextRequest) {
    try {
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            return NextResponse.json({ error: "Missing Google Sheets Credentials" }, { status: 500 });
        }

        const auth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.MASTER.ID, auth);
        console.log("Loading document...");
        await doc.loadInfo();
        console.log("Document loaded:", doc.title);

        const sheets = doc.sheetsByIndex.map(s => s.title);
        console.log("Available sheets:", sheets);

        const sheet = doc.sheetsByTitle["CATALOGO"];
        if (!sheet) {
            return NextResponse.json({
                success: false,
                message: "Catalog sheet not found",
                availableSheets: sheets
            }, { status: 404 });
        }

        console.log("Loading rows...");
        const rows = await sheet.getRows();
        console.log(`Found ${rows.length} rows`);

        // Get header values
        await sheet.loadHeaderRow();
        const headers = sheet.headerValues;

        return NextResponse.json({
            success: true,
            docTitle: doc.title,
            sheetTitle: sheet.title,
            headers: headers,
            rowCount: rows.length,
            sampleRow: rows.length > 0 ? {
                id: rows[0].get('ID'),
                nombre: rows[0].get('Nombre'),
                raw: rows[0].toObject()
            } : null
        });

    } catch (error: any) {
        console.error("Debug Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
