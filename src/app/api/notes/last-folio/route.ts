import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";
import { GOOGLE_SHEETS_CONFIG } from "@/lib/constants";

export const dynamic = 'force-dynamic';

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
        const sheet = doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.MASTER.TAB_NAME];

        if (!sheet) {
            return NextResponse.json({ lastFolio: "00000" });
        }

        const rows = await sheet.getRows();

        if (rows.length === 0) {
            return NextResponse.json({ lastFolio: "00000" });
        }

        const lastRow = rows[rows.length - 1];
        const lastFolio = lastRow.get("Folio") || "00000";

        return NextResponse.json({ lastFolio });

    } catch (error) {
        console.error("Error fetching last folio:", error);
        return NextResponse.json({ lastFolio: "Error" }, { status: 500 });
    }
}
