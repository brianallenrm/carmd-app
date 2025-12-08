
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { NextResponse } from "next/server";
import { GOOGLE_SHEETS_CONFIG } from "@/lib/constants";

export const dynamic = 'force-dynamic'; // Disable caching to get latest data

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
        if (!sheet) throw new Error("Master sheet not found");

        const rows = await sheet.getRows();

        // Extract services from "Servicio" column (assuming it's named "Servicio")
        // Based on user feedback, it might be Column J. GoogleSpreadsheet usually allows access by header key.
        // User provided: J1: Servicio

        const allServices = new Set<string>();

        rows.forEach(row => {
            const rawValue = row.get("Servicio");
            if (rawValue && typeof rawValue === 'string') {
                // Split by '|' as we joined them that way, or just take the whole string if it's a single item
                const parts = rawValue.split('|').map(s => s.trim());
                parts.forEach(p => {
                    if (p.length > 2) { // Filter out empty or very short junk
                        // Capitalize first letter properly? Or leave as is.
                        // Let's standardise to uppercase first letter
                        allServices.add(p);
                    }
                });
            }
        });

        const sortedServices = Array.from(allServices).sort();

        return NextResponse.json({ services: sortedServices });

    } catch (error) {
        console.error("Error fetching service history:", error);
        return NextResponse.json({ error: "Failed to fetch history", services: [] }, { status: 500 });
    }
}
