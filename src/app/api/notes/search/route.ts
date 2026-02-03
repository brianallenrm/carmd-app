import { NextResponse } from 'next/server';
import { getMasterDoc } from '@/lib/google-sheets';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase();

    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
    }

    try {
        const doc = await getMasterDoc();
        const sheet = doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.MASTER.TAB_NAME];

        // Load sufficient columns to search (A=Folio, B=Client, E=Plates, Z=JSON)
        // We load all rows because search needs to be comprehensive
        // Optimization: In a massive scale DB we'd use a real query, but for <5000 rows this is fine.
        await sheet.loadCells(`A2:Z${sheet.rowCount}`);

        const results = [];
        // Iterate backwards (newest first)
        // Limit to 50 matches to avoid payload size issues
        let matchCount = 0;

        for (let i = sheet.rowCount - 1; i >= 1; i--) { // 1-indexed (row 2 start)
            if (matchCount >= 50) break;

            const folio = String(sheet.getCell(i, 0).value || "").toLowerCase(); // Col A
            const client = String(sheet.getCell(i, 1).value || "").toLowerCase(); // Col B
            const plates = String(sheet.getCell(i, 4).value || "").toLowerCase(); // Col E (Index 4)

            if (folio.includes(query) || client.includes(query) || plates.includes(query)) {
                // Determine if it has JSON data (Col Z -> Index 25)
                const jsonCell = sheet.getCell(i, 25).value;
                let rawData = null;

                if (typeof jsonCell === 'string' && jsonCell.startsWith('{')) {
                    try {
                        rawData = JSON.parse(jsonCell);
                    } catch (e) {
                        // Ignore bad JSON
                    }
                }

                // If no JSON, construct basic fallback data from columns
                // This handles "Legacy" notes
                if (!rawData) {
                    rawData = {
                        client: { name: sheet.getCell(i, 1).value },
                        vehicle: {
                            plates: sheet.getCell(i, 4).value,
                            brand: sheet.getCell(i, 2).value, // Col C
                            model: sheet.getCell(i, 3).value, // Col D
                            odometer: sheet.getCell(i, 5).value // Col F
                        },
                        services: [
                            {
                                id: "legacy-1",
                                description: String(sheet.getCell(i, 6).value || "Nota Antigua - Detalles no estructurados"), // Col G
                                laborCost: Number(sheet.getCell(i, 23).value || 0), // Col X (Total)
                                partsCost: 0
                            }
                        ],
                        parts: [],
                        notes: "Nota importada de formato antiguo. Verifique los detalles.",
                        date: sheet.getCell(i, 8).value // Col I
                    };
                }

                results.push({
                    folio: sheet.getCell(i, 0).value,
                    client: sheet.getCell(i, 1).value,
                    vehicle: `${sheet.getCell(i, 2).value} ${sheet.getCell(i, 3).value}`,
                    date: sheet.getCell(i, 8).value,
                    total: sheet.getCell(i, 23).value,
                    data: rawData // This is what the UI will load
                });

                matchCount++;
            }
        }

        return NextResponse.json({ results });

    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
