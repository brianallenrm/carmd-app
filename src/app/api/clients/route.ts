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
    vehicles: any[];
    version?: string;
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

            // NEW LOGIC: Version 1.3 - Aggressive Client Merging (Fuzzy + Phone)
            const initialMap = new Map<string, Client>();
            let rowIndex = 0;

            // Helper to parse DD/MM/YYYY to timestamp
            const parseDate = (d: string) => {
                if (!d) return 0;
                const parts = d.split('/');
                if (parts.length !== 3) return 0;
                const [day, month, year] = parts.map(Number);
                if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;
                return new Date(year, month - 1, day).getTime();
            };

            // Helper to normalize strings (Alphanumeric only)
            const norm = (s: any) => s?.toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, '') || '';

            // Helper to normalize Names (Simple: Upper, No Accents, No Extra Spaces)
            const normName = (s: any) => s?.toString().trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ') || '';

            // Helper for Title Case (Unicode safe)
            const toTitleCase = (str: string) => {
                if (!str) return str;
                return str.toLowerCase().split(/\s+/).map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
            };

            rows.forEach(row => {
                const rawName = row.get("Nombre COMPLETO o Empresa:")?.trim();
                const rawPhone = row.get("Teléfono (whatsapp):")?.toString().trim();
                const phoneDigits = (rawPhone || "").replace(/\D/g, "");

                if (!rawName && !phoneDigits) return;

                const normalizedName = normName(rawName);

                // Grouping Key selection (Pass 1: Exact Phone or Exact Normalized Name)
                const hasPhone = phoneDigits && phoneDigits.length > 5 && phoneDigits !== "00";
                const clientKey = hasPhone ? `P:${phoneDigits}` : `N:${normalizedName}`;

                // Normalize State
                let state = row.get("Estado:")?.toString().trim() || "";
                if (state === 'Estado de México') state = 'Edomex';

                // Vehicle Info Normalization
                const plates = row.get("Placas:")?.toString().trim().toUpperCase() || '';
                const normPlates = norm(plates);
                const serial = row.get("Número de serie:")?.toString().trim() || '';
                const last8VIN = serial.length >= 8 ? serial.slice(-8).toUpperCase() : norm(serial);

                // FIX: Column for date has NO NAME in header, row.get('') works for the first column
                const visitDateStr = (row as any).get('')?.toString().trim() || "";
                const visitTime = parseDate(visitDateStr);

                const vehicle = plates || serial ? {
                    brand: row.get("Marca:")?.toString().trim() || "",
                    model: row.get("Sub marca:")?.toString().trim() || "",
                    year: row.get("Modelo (año):")?.toString().trim() || "",
                    plates: plates,
                    normPlates: normPlates,
                    serialNumber: serial,
                    last8VIN: last8VIN,
                    motor: row.get("Tipo de Motor:")?.toString().trim() || "",
                    km: row.get("Kilometraje:")?.toString().trim() || "",
                    gas: "",
                    lastServiceDate: visitDateStr,
                    timestamp: visitTime
                } as any : null;

                if (initialMap.has(clientKey)) {
                    const existing = initialMap.get(clientKey) as any;

                    // NEW PRIORITY: If this row is NEWER than what we have, overwrite master profile
                    if (visitTime > (existing.latestVisitTime || 0)) {
                        existing.name = toTitleCase(rawName) || existing.name;
                        existing.address = row.get("Domicilio Calle y NUMERO:")?.toString().trim() || existing.address;
                        existing.colonia = row.get("Colonia:")?.toString().trim() || existing.colonia;
                        existing.municipality = row.get("Deleg. o Municipio:")?.toString().trim() || existing.municipality;
                        existing.state = state || existing.state;
                        existing.email = row.get("Dirección de correo electrónico")?.toString().trim() || existing.email;
                        existing.latestVisitTime = visitTime;
                    } else if (!existing.latestVisitTime) {
                        existing.latestVisitTime = visitTime;
                    }

                    if (vehicle) {
                        const matchIdx = existing.vehicles.findIndex((v: any) =>
                            (last8VIN && v.last8VIN === last8VIN) ||
                            (normPlates && v.normPlates === normPlates)
                        );
                        if (matchIdx === -1) {
                            existing.vehicles.push(vehicle);
                        } else {
                            const existingV = existing.vehicles[matchIdx] as any;
                            if (visitTime >= (existingV.timestamp || 0)) {
                                existing.vehicles[matchIdx] = vehicle;
                            }
                        }
                    }
                } else {
                    initialMap.set(clientKey, {
                        id: `client_${rowIndex++}`,
                        name: toTitleCase(rawName) || "Sin Nombre",
                        phone: rawPhone || "",
                        email: row.get("Dirección de correo electrónico")?.toString().trim() || "",
                        address: row.get("Domicilio Calle y NUMERO:")?.toString().trim() || "",
                        colonia: row.get("Colonia:")?.toString().trim() || "",
                        municipality: row.get("Deleg. o Municipio:")?.toString().trim() || "",
                        state: state,
                        vehicles: vehicle ? [vehicle] : [],
                        latestVisitTime: visitTime
                    } as any);
                }
            });

            // Pass 2: Fuzzy Name Merge (Subset names) - Priority by DATE
            const finalClients: any[] = [];
            const sortedInitial = Array.from(initialMap.values()).sort((a: any, b: any) => (b.latestVisitTime || 0) - (a.latestVisitTime || 0));

            const processed = new Set<string>();

            for (let i = 0; i < sortedInitial.length; i++) {
                if (processed.has(sortedInitial[i].id)) continue;

                const master = sortedInitial[i];
                const masterNorm = normName(master.name);
                const masterPhone = master.phone.replace(/\D/g, "");

                for (let j = i + 1; j < sortedInitial.length; j++) {
                    const candidate = sortedInitial[j];
                    if (processed.has(candidate.id)) continue;

                    const candidateNorm = normName(candidate.name);
                    const candidatePhone = candidate.phone.replace(/\D/g, "");

                    // Criteria for Merge:
                    // 1. One name contains the other (e.g. "Marco Lugo" in "Marco Antonio Lugo")
                    // 2. AND they don't have conflicting valid phones
                    const nameMatch = masterNorm.includes(candidateNorm) || candidateNorm.includes(masterNorm);
                    const phoneConflict = masterPhone && candidatePhone && masterPhone !== candidatePhone && masterPhone !== "00" && candidatePhone !== "00";

                    if (nameMatch && !phoneConflict) {
                        // Merge vehicles into the YOUNGER master
                        candidate.vehicles.forEach((cv: any) => {
                            const vMatch = master.vehicles.find((mv: any) =>
                                (cv.last8VIN && mv.last8VIN === cv.last8VIN) ||
                                (cv.normPlates && mv.normPlates === cv.normPlates)
                            );
                            if (!vMatch) {
                                master.vehicles.push(cv);
                            } else if ((cv.timestamp || 0) > (vMatch.timestamp || 0)) {
                                Object.assign(vMatch, cv);
                            }
                        });
                        processed.add(candidate.id);
                    }
                }
                finalClients.push(master);
            }

            // CLEAN UP and Sort overall results by latest activity
            cachedClients = finalClients
                .sort((a, b) => (b.latestVisitTime || 0) - (a.latestVisitTime || 0))
                .map(client => ({
                    ...client,
                    version: '1.4',
                    vehicles: client.vehicles
                        .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))
                        .map((v: any) => {
                            const { normPlates, last8VIN, timestamp, ...cleanVehicle } = v;
                            return cleanVehicle;
                        })
                }));

            lastFetchTime = now;
            console.log(`✅ Cached ${cachedClients.length} unique clients from ${rows.length} rows`);
        }

        // Filter Logic
        let results = cachedClients;
        console.log(`🔍 SEARCH DEBUG: Query='${query}'`);

        if (query) {
            // Normalize query: strip accents and split into words
            const queryClean = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const queryWords = queryClean.split(/\s+/).filter(w => w.length > 0);

            results = cachedClients.filter(c => {
                // Normalize client name for comparison
                const nameClean = c.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                const nameWords = nameClean.split(/\s+/).filter(w => w.length > 0);

                // Check Name: Word intersection
                // Match if: All query words are in the name OR all name words are in the query
                const allQueryInName = queryWords.every(qw => nameClean.includes(qw));
                const allNameInQuery = nameWords.every(nw => queryClean.includes(nw));
                const nameMatch = allQueryInName || allNameInQuery;

                // Check Phone (Digits Only)
                const phoneDigits = c.phone.replace(/\D/g, '');
                const queryDigits = query.replace(/\D/g, '');
                const phoneMatch = queryDigits.length >= 4 && phoneDigits.includes(queryDigits);

                // Check Plates (Case Insensitive, Normalize for accents just in case)
                const plateMatch = c.vehicles.some(v =>
                    v.plates.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(queryClean)
                );

                return nameMatch || phoneMatch || plateMatch;
            });
            console.log(`✅ FOUND ${results.length} results (v1.5 Search)`);
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
