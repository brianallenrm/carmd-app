import { NextRequest, NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';

// Force dynamic to prevent caching at build time
export const dynamic = 'force-dynamic';

interface Vehicle {
    brand: string;
    model: string;
    year: string;
    plates: string;
    serialNumber: string;
    motor: string;
    km: string;
    gas: string;
    lastServiceDate: string;
}

interface Client {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    colonia: string;
    municipality: string;
    state: string;
    vehicles: Vehicle[];
}

// Cache mechanism (simple in-memory for now)
let cachedClients: Client[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds (keep it fresh for now)

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toLowerCase().trim() || '';

    try {
        const now = Date.now();

        // Refresh cache if needed or empty
        if (cachedClients.length === 0 || now - lastFetchTime > CACHE_TTL) {
            console.log("Fetching fresh client data from Google Sheets...");

            if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
                return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
            }

            const auth = new JWT({
                email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
                scopes: ["https://www.googleapis.com/auth/spreadsheets"],
            });

            const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.CLIENTS.ID, auth);
            await doc.loadInfo();

            const sheetTitles = doc.sheetsByIndex.map(s => s.title).join(', ');
            console.log(`✅ Doc Loaded: ${doc.title}`);
            console.log(`📑 Available Sheets: ${sheetTitles}`);

            // Debug: Write available sheets to file so I can read them
            try {
                const fs = require('fs');
                const path = require('path');
                const logPath = path.join(process.cwd(), 'debug_error.log');
                const timestamp = new Date().toISOString();
                fs.appendFileSync(logPath, `[${timestamp}] INFO: Doc '${doc.title}' loaded. Sheets: [${sheetTitles}]\n`);
            } catch (fsError) {
                console.error("Log error", fsError);
            }

            // Read from configured tab
            const sheet = doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.CLIENTS.TAB_NAME];
            if (!sheet) {
                console.error(`❌ Sheet '${GOOGLE_SHEETS_CONFIG.CLIENTS.TAB_NAME}' not found. Available: ${doc.sheetsByIndex.map(s => s.title).join(', ')}`);
                return NextResponse.json({ error: 'Client sheet not found', available: doc.sheetsByIndex.map(s => s.title) }, { status: 404 });
            }

            const rows = await sheet.getRows();
            console.log(`✅ Loaded ${rows.length} rows from sheet`);

            // Structure based on user screenshot:
            // C: Nombre, D: Telefono casa, E: Celular/Whatsapp, F: Email, G: Calle y Numero, H: Colonia, I: Mun, J: Edo
            // K: Marca, L: Submarca, M: Modelo(Ano), N: Placas, O: Serie, P: Motor, Q: Kilometraje

            // NEW LOGIC: Show All History (No Merging)
            // 1. Each row is a unique record of a visit.
            // 2. Search matches against Name or Plate (case-insensitive).
            // 3. Return all matching rows so user can see history.

            const allVisits: Client[] = [];
            let rowIndex = 0;

            rows.forEach(row => {
                const rawName = row.get("Nombre COMPLETO o Empresa:")?.trim();
                const rawPhone = row.get("Teléfono (whatsapp):")?.toString().trim();

                // if (!rawName && !rawPhone) return; 
                // Don't skip yet, debug

                if (!rawName && !rawPhone) {
                    return;
                }

                // Unique ID for every row (visit)
                const visitId = `visit_${rowIndex++}_${Date.now()}`;

                // Normalize State
                let state = row.get("Estado:")?.toString().trim() || "";
                if (state === 'Estado de México') state = 'Edomex';

                // Build Client Object (representing this specific visit)
                const visit: Client = {
                    id: visitId,
                    name: rawName || "Sin Nombre",
                    phone: rawPhone || "",
                    email: row.get("Dirección de correo electrónico") || "",
                    address: row.get("Domicilio Calle y NUMERO:") || "",
                    colonia: row.get("Colonia:") || "",
                    municipality: row.get("Deleg. o Municipio:") || "",
                    state: state,
                    vehicles: []
                };

                // Add Vehicle info for this visit
                const plates = row.get("Placas:")?.toString().trim().toUpperCase();
                if (plates) {
                    let brand = row.get("Marca:")?.toString().trim() || "";
                    if (brand === 'VW') brand = 'Volkswagen';

                    visit.vehicles.push({
                        brand: brand,
                        model: row.get("Sub marca:") || "",
                        year: row.get("Modelo (año):") || "",
                        plates: plates,
                        serialNumber: row.get("Número de serie:") || "",
                        motor: row.get("Tipo de Motor:") || "",
                        km: row.get("Kilometraje:") || "",
                        gas: "",
                        lastServiceDate: row.get("Fecha de Ingreso:") || ""
                    });
                }

                allVisits.push(visit);
            });

            cachedClients = allVisits;
            lastFetchTime = now;
            console.log(`✅ Cached ${cachedClients.length} visits`);
        }

        // Filter Logic
        let results = cachedClients;
        console.log(`🔍 SEARCH DEBUG: Query='${query}'`);

        if (query) {
            results = cachedClients.filter(c => {
                // Check Name (Case Insensitive)
                const nameMatch = c.name.toLowerCase().includes(query);

                // Check Phone (Digits Only) - Simplified for debug
                const phoneDigits = c.phone.replace(/\D/g, '');
                const queryDigits = query.replace(/\D/g, '');
                const phoneMatch = queryDigits.length >= 4 && phoneDigits.includes(queryDigits);

                // Check Plates (Case Insensitive)
                const plateMatch = c.vehicles.some(v => v.plates.toLowerCase().includes(query));

                if (nameMatch || phoneMatch || plateMatch) {
                    return true;
                }
                return false;
            });
            console.log(`✅ FOUND ${results.length} results`);
        } else {
            // If no query, return empty
            results = [];
        }

        // Limit results to 50 max
        const finalResults = results.slice(0, 50);

        return NextResponse.json({
            results: finalResults,
            total: results.length
        });

    } catch (error: any) {
        console.error("Client Search Error:", error);

        // Write error to file for debugging
        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(process.cwd(), 'debug_error.log');
            const timestamp = new Date().toISOString();
            const errorMsg = `[${timestamp}] ERROR: ${error.message}\nSTACK: ${error.stack}\n\n`;
            fs.appendFileSync(logPath, errorMsg);
        } catch (fsError) {
            console.error("Failed to write to log file", fsError);
        }

        return NextResponse.json({ error: 'Failed to search clients', details: error.message }, { status: 500 });
    }
}
