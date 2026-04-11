import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";
import { GOOGLE_SHEETS_CONFIG } from "@/lib/constants";

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const draftId = searchParams.get('draftId');

        if (!draftId) {
            return NextResponse.json({ success: false, error: "Draft ID is required" }, { status: 400 });
        }

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

        const tabName = GOOGLE_SHEETS_CONFIG.MASTER.DRAFTS_TAB_NAME;
        const sheet = doc.sheetsByTitle[tabName];
        
        if (!sheet) {
             return NextResponse.json({ success: true }); // Already gone essentially
        }

        const rows = await sheet.getRows();
        const existingRowIndex = rows.findIndex(r => r.get("DraftID") === draftId);

        if (existingRowIndex >= 0) {
            const row = rows[existingRowIndex];
            await row.delete();
        }

        return NextResponse.json({ success: true, message: "Draft deleted from cloud" });

    } catch (error) {
        console.error("Error deleting draft from cloud:", error);
        return NextResponse.json({ success: false, error: "Failed to delete draft" }, { status: 500 });
    }
}
