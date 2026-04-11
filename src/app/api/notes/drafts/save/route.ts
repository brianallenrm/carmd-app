import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";
import { GOOGLE_SHEETS_CONFIG } from "@/lib/constants";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { draftId, client, vehicle, folio, timestamp } = body;

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
        let sheet = doc.sheetsByTitle[tabName];
        
        // 2. Auto-Create Tab if missing
        if (!sheet) {
            sheet = await doc.addSheet({
                title: tabName,
                headerValues: ['DraftID', 'Fecha', 'Placas', 'Cliente', 'Metadatos']
            });
        }

        // 3. Find if Draft exists
        const rows = await sheet.getRows();
        const existingRowIndex = rows.findIndex(r => r.get("DraftID") === draftId);

        // 4. Prepare Row Data
        const today = new Date();
        const rowData = {
            "DraftID": draftId,
            "Fecha": `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`,
            "Placas": vehicle?.plates || "(Sin Placas)",
            "Cliente": client?.name || "(Sin Nombre)",
            "Metadatos": JSON.stringify(body)
        };

        if (existingRowIndex >= 0) {
            // Update
            const row = rows[existingRowIndex];
            row.assign(rowData);
            await row.save();
        } else {
            // Insert
            await sheet.addRow(rowData);
        }

        return NextResponse.json({ success: true, message: "Draft saved to cloud" });

    } catch (error) {
        console.error("Error saving draft to cloud:", error);
        return NextResponse.json({ success: false, error: "Failed to save draft" }, { status: 500 });
    }
}
