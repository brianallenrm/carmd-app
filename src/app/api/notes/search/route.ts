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
                    // Mapeo Legacy Actualizado (2026-02-03):
                    // A(0): Folio, B(1): Fecha, C(2): Cliente, E(4): Telefono
                    // F(5): Marca, G(6): Modelo/Año, H(7): Placas, I(8): Km
                    // J(9): Descripcion, K(10): Mano Obra, L(11): Refacciones, M(12): Total, N(13): Factura

                    const facturaNote = String(sheet.getCell(i, 13).value || "").toLowerCase().includes("factura")
                        ? "REQUIERE FACTURA"
                        : "";

                    rawData = {
                        client: {
                            name: String(sheet.getCell(i, 2).value || ""), // Col C: Cliente
                            phone: String(sheet.getCell(i, 4).value || ""), // Col E: Telefono
                            email: "",
                            address: ""
                        },
                        vehicle: {
                            brand: String(sheet.getCell(i, 5).value || ""), // Col F
                            model: String(sheet.getCell(i, 6).value || ""), // Col G
                            year: "",
                            plates: String(sheet.getCell(i, 7).value || ""), // Col H
                            odometer: Number(String(sheet.getCell(i, 8).value || "0").replace(/[^0-9]/g, '')) || 0 // Col I
                        },
                        services: [
                            {
                                id: `legacy-svc-${Date.now()}`,
                                description: String(sheet.getCell(i, 9).value || "Servicio General"), // Col J
                                laborCost: Number(sheet.getCell(i, 10).value || 0), // Col K
                                partsCost: 0
                            }
                        ],
                        parts: [
                            {
                                id: `legacy-part-${Date.now()}`,
                                description: "Refacciones Varias (Nota Antigua)",
                                quantity: 1,
                                partsCost: Number(sheet.getCell(i, 11).value || 0), // Col L
                                laborCost: 0
                            }
                        ],
                        notes: `Nota importada de formato antiguo. ${facturaNote}`,
                        company: {},
                        includeIva: false,
                        includeIsr: false,
                        date: sheet.getCell(i, 1).value // Col B
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
