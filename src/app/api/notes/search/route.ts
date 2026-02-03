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
                // Determine if it has JSON data (Col O -> Index 14)
                const jsonCellValue = sheet.getCell(i, 14).value;
                let rawData = null;

                // Robust Parsing
                if (jsonCellValue) {
                    const jsonString = String(jsonCellValue).trim();
                    if (jsonString.startsWith('{')) {
                        try {
                            rawData = JSON.parse(jsonString);
                        } catch (e) {
                            console.error(`Failed to parse JSON for folio ${folio}:`, e);
                        }
                    }
                }

                // If no JSON, construct basic fallback data from columns
                // This handles "Legacy" notes or if JSON parsing failed
                if (!rawData) {
                    // console.log(`Legacy fallback for ${folio}`);
                    rawData = {
                        client: {
                            name: String(sheet.getCell(i, 1).value || ""), // Col B: Cliente
                            phone: String(sheet.getCell(i, 4).value || ""), // Col E: Phone usually here in legacy? Or maybe logic is: E=Placas
                        },
                        vehicle: {
                            // In legacy sheet:
                            // A: Folio, B: Cliente, C: Vehiculo (Marca), D: Modelo, E: Placas, F: Km
                            brand: String(sheet.getCell(i, 2).value || ""),
                            model: String(sheet.getCell(i, 3).value || ""),
                            plates: String(sheet.getCell(i, 4).value || ""), // Col E seems to be Placas based on code, but user screenshot showed phone?
                            odometer: Number(String(sheet.getCell(i, 5).value || "0").replace(/[^0-9]/g, ''))
                        },
                        services: [
                            {
                                id: `legacy-${Date.now()}`,
                                description: String(sheet.getCell(i, 6).value || "Detalles de servicio no estructurados"), // Col G
                                laborCost: 0,
                                partsCost: 0
                            }
                        ],
                        parts: [],
                        notes: "Nota importada de formato antiguo (Sin metadatos JSON).",
                        date: sheet.getCell(i, 8).value // Col I
                    };

                    // Try to put total in labor cost for visibility
                    const totalVal = sheet.getCell(i, 23).value; // Col X
                    if (totalVal) rawData.services[0].laborCost = Number(totalVal);
                }

                results.push({
                    folio: sheet.getCell(i, 0).value,
                    client: sheet.getCell(i, 1).value,
                    vehicle: `${sheet.getCell(i, 2).value} ${sheet.getCell(i, 3).value}`,
                    date: sheet.getCell(i, 8).value,
                    total: sheet.getCell(i, 23).value,
                    data: rawData, // This is what the UI will load
                    // DEBUG INFO - REMOVE LATER
                    _debug: {
                        jsonCellType: typeof jsonCellValue,
                        jsonCellPreview: String(jsonCellValue).substring(0, 50),
                        hasJson: !!rawData,
                        rowIndex: i
                    }
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
