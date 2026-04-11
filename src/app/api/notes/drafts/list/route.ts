import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";
import { GOOGLE_SHEETS_CONFIG } from "@/lib/constants";

// Adding dynamic forces it not to cache
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

        const sheet = doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.MASTER.DRAFTS_TAB_NAME];
        if (!sheet) {
            // If tab doesn't exist, there are no drafts.
            return NextResponse.json({ success: true, drafts: [] });
        }

        const rows = await sheet.getRows();
        
        const drafts = [];
        for (const row of rows) {
            const rawMetadata = row.get("Metadatos");
            if (rawMetadata) {
                try {
                    const parsed = JSON.parse(rawMetadata);
                    // Ensure the ID maps to the row ID so we can use it locally
                    if (!parsed.id) {
                        parsed.id = row.get("DraftID");
                    }
                    if (!parsed.timestamp) {
                        parsed.timestamp = Date.now(); // Fallback
                    }
                    drafts.push(parsed);
                } catch (e) {
                    console.error("Failed to parse metadata for draft row", row.get("DraftID"));
                }
            }
        }

        // Return latest first
        drafts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        return NextResponse.json({ success: true, drafts });

    } catch (error) {
        console.error("Error listing cloud drafts:", error);
        return NextResponse.json({ success: false, error: "Failed to list drafts" }, { status: 500 });
    }
}
