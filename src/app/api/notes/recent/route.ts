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
        if (!sheet) throw new Error("Sheet not found");

        const rows = await sheet.getRows({ limit: 20, offset: Math.max(0, sheet.rowCount - 25) }); // Fetch last 20 rows roughly
        // Actually, getRows with offset is risky if we don't know count.
        // Better: Fetch all rows? Or fetch last N? 
        // sheet.getRows() fetches all by default which might be slow if huge.
        // But for <1000 rows it's fine.
        // Let's use simple getRows() and slice the end.

        // Improve: fetch only specific columns? API doesn't support that easily in wrapper.
        const allRows = await sheet.getRows();

        // Get last 10, reversed
        const recentRows = allRows.slice(-10).reverse();

        const templates = recentRows.map(row => {
            const meta = row.get("Metadatos");
            if (meta) {
                try {
                    const parsed = JSON.parse(meta);
                    return {
                        folio: row.get("Folio"),
                        date: row.get("Fecha"),
                        client: row.get("Cliente"),
                        vehicle: row.get("Vehiculo"),
                        data: parsed
                    };
                } catch (e) {
                    return null;
                }
            }
            return null;
        }).filter(Boolean);

        return NextResponse.json({ templates });

    } catch (error) {
        console.error("Error fetching recent notes:", error);
        return NextResponse.json({ templates: [] }, { status: 500 });
    }
}
