import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';

const getAuth = () => new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const normalize = (str: string) =>
    String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const isAfinacion = (text: string) => {
    const n = normalize(text);
    return n.includes('afinacion') || n.includes('tune up') || n.includes('tuneup') || n.includes('afin');
};

const isPreventivo = (text: string) => {
    const n = normalize(text);
    return (n.includes('preventivo') || n.includes('preventiva') || n.includes('mantenimiento')) && !isAfinacion(text);
};

const parseDate = (val: any): number => {
    if (!val) return 0;
    // Google Sheets serial number
    if (typeof val === 'number') return (val - 25569) * 86400 * 1000;
    const str = String(val).trim();
    // 1. Try ISO YYYY-MM-DD first (saved by our app)
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const d = new Date(str);
        return isNaN(d.getTime()) ? 0 : d.getTime();
    }
    // 2. Try D/M/YYYY or DD/MM/YYYY (Mexican format, typical in Sheets)
    const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dmy) {
        const day = parseInt(dmy[1]);
        const month = parseInt(dmy[2]) - 1;
        const year = parseInt(dmy[3]);
        // Sanity: month must be 0-11, day must be 1-31
        if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
            const d = new Date(year, month, day);
            return isNaN(d.getTime()) ? 0 : d.getTime();
        }
    }
    // 3. Fallback: let JS try to parse it
    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? 0 : fallback.getTime();
};

// Parse numbers that may come formatted as "$3,500.00" or "3,500" from Google Sheets
const parseMXNumber = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    // Remove currency symbols, spaces, and thousand separators (commas), keep decimals
    const cleaned = String(val).replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
};

const formatDateDisplay = (val: any): string => {
    const ts = parseDate(val);
    if (!ts) return String(val || '');
    return new Date(ts).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City'
    });
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const currentKm = parseInt(searchParams.get('km') || '0');

    if (!query || query.length < 3) {
        return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
    }

    try {
        const auth = getAuth();
        const [masterDoc, inventoryDoc] = await Promise.all([
            new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.MASTER.ID, auth),
            new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.INVENTORY.ID, auth),
        ]);

        await Promise.all([masterDoc.loadInfo(), inventoryDoc.loadInfo()]);

        const masterSheet = masterDoc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.MASTER.TAB_NAME];
        const inventorySheet = inventoryDoc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.INVENTORY.TAB_NAME];

        const [masterRows, inventoryRows] = await Promise.all([
            masterSheet?.getRows() ?? [],
            inventorySheet?.getRows() ?? [],
        ]);

        const nq = normalize(query);
        // Detect search type: plate if it looks like letters+numbers combo (min 5 chars, no spaces)
        const isPlateSearch = /^[a-zA-Z0-9\-]{5,}$/.test(query.replace(/\s/g, ''));
        // Normalize query for plate matching: keep only alphanumeric uppercase
        const nqAlpha = query.toUpperCase().replace(/[^A-Z0-9]/g, '');

        // --- Search MASTER (Service Notes) ---
        const matchedNotes: any[] = [];
        for (const row of masterRows) {
            const plate = normalize(row.get('Placa') || '');
            const plateAlpha = (row.get('Placa') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
            const clientName = normalize(row.get('Cliente') || '');
            // Exact alphanumeric plate match to avoid false positives from digit-only substring
            const matchesPlate = isPlateSearch && !!plateAlpha && plateAlpha === nqAlpha;
            const matchesName = !isPlateSearch && clientName.includes(nq);
            const matchesPlateFallback = !isPlateSearch && plate.includes(nq);

            if (matchesPlate || matchesName || matchesPlateFallback) {
                const folio = row.get('Folio') || '';
                const dateRaw = row.get('Fecha') || '';
                const servicio = row.get('Servicio') || '';
                // Use parseMXNumber to handle "3,500" → 3500 correctly (parseFloat alone gives 3)
                const mo = parseMXNumber(row.get('MO'));
                const refacciones = parseMXNumber(row.get('Refacciones'));
                const total = parseMXNumber(row.get('Total'));
                const hasFactura = String(row.get('Factura') || '').toLowerCase() === 'factura';
                const kmRaw = parseInt(String(row.get('KM') || '0').replace(/[^0-9]/g, '')) || 0;
                const estatus = row.get('Estatus') || 'Pagado';

                let metadatos: any = null;
                try { metadatos = JSON.parse(row.get('Metadatos') || '{}'); } catch {}

                const notes: string[] = [];
                if (metadatos?.services) {
                    metadatos.services.forEach((s: any) => { if (s.description) notes.push(s.description); });
                }
                if (metadatos?.parts) {
                    metadatos.parts.forEach((p: any) => { if (p.description) notes.push(`(Ref) ${p.description}`); });
                }

                const hasAfinacion = isAfinacion(servicio) || notes.some(isAfinacion);
                const hasPreventivo = isPreventivo(servicio) || notes.some(isPreventivo);

                matchedNotes.push({
                    type: 'note',
                    folio,
                    dateRaw,
                    dateDisplay: formatDateDisplay(dateRaw),
                    dateTs: parseDate(dateRaw),
                    client: {
                        name: row.get('Cliente') || '',
                        email: row.get('Correo') || '',
                        phone: row.get('Telefono') || '',
                    },
                    vehicle: {
                        brand: (row.get('Vehiculo') || '').split(' ')[0],
                        fullName: row.get('Vehiculo') || '',
                        year: row.get('Anio') || '',
                        plates: row.get('Placa') || '',
                        km: kmRaw,
                    },
                    pricing: { mo, refacciones, total, hasFactura, estatus },
                    services: notes.length > 0 ? notes : servicio.split('|').map((s: string) => s.trim()).filter(Boolean),
                    hasAfinacion,
                    hasPreventivo,
                });
            }
        }

        // --- Search INVENTORY (Receptions) ---
        const matchedInventory: any[] = [];
        for (const row of inventoryRows) {
            const plate = normalize(row.get('Placas:') || '');
            const plateAlpha = (row.get('Placas:') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
            const clientName = normalize(row.get('Nombre COMPLETO o Empresa:') || '');
            const matchesPlate = isPlateSearch && !!plateAlpha && plateAlpha === nqAlpha;
            const matchesName = !isPlateSearch && clientName.includes(nq);
            const matchesPlateFallback = !isPlateSearch && plate.includes(nq);

            if (matchesPlate || matchesName || matchesPlateFallback) {
                const dateRaw = row.get('FECHA') || '';
                const kmRaw = parseInt(String(row.get('Kilometraje:') || '0').replace(/\D/g, '')) || 0;

                matchedInventory.push({
                    type: 'inventory',
                    dateRaw,
                    dateDisplay: formatDateDisplay(dateRaw),
                    dateTs: parseDate(dateRaw),
                    client: {
                        name: row.get('Nombre COMPLETO o Empresa:') || '',
                        phone: row.get('Teléfono (whatsapp):') || row.get('Teléfono casa / oficina:') || '',
                        email: row.get('Dirección de correo electrónico') || '',
                    },
                    vehicle: {
                        brand: row.get('Marca:') || '',
                        model: row.get('Sub marca:') || '',
                        year: row.get('Modelo (año):') || '',
                        plates: row.get('Placas:') || '',
                        km: kmRaw,
                        gas: row.get('¿Cuál es el nivel de gasolina?') || '',
                        vin: row.get('Número de serie:') || '',
                        engine: row.get('Tipo de Motor:') || '',
                    },
                    motivoIngreso: row.get('Motivo de Ingreso') || row.get('Presupuesto Solicitado:') || '',
                    advisor: row.get('¿Quién elaboró el inventario?') || '',
                });
            }
        }

        // --- Merge & Sort by date DESC ---
        const allEntries = [...matchedNotes, ...matchedInventory].sort((a, b) => b.dateTs - a.dateTs);

        if (allEntries.length === 0) {
            return NextResponse.json({ found: false, total: 0, entries: [] });
        }

        // --- Use latest client/vehicle info ---
        const latestEntry = allEntries[0];
        const latestNote = matchedNotes[0] ?? null;
        const latestInventory = matchedInventory[0] ?? null;

        // Pick the richest data for the summary card
        const clientInfo = latestInventory?.client || latestNote?.client || latestEntry.client;
        const vehicleInfo = latestInventory?.vehicle || latestNote?.vehicle || latestEntry.vehicle;

        // --- Maintenance Calculation ---
        // Find the last afinacion note
        const lastAfinacion = matchedNotes.find(n => n.hasAfinacion);
        const lastAfinacionKm = lastAfinacion?.vehicle?.km ?? 0;
        const lastVisitKm = latestNote?.vehicle?.km ?? 0;

        // Use currentKm from params if provided (manually input), or from same-day inventory, or from latest inventory
        // Use date-only comparison in Mexico City timezone to avoid format mismatch issues
        const todayMx = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }); // YYYY-MM-DD
        const toDateOnlyMx = (ts: number) =>
            ts > 0 ? new Date(ts).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }) : '';

        // Sort inventory by date descending so [0] is the most recent
        const sortedInventory = [...matchedInventory].sort((a, b) => b.dateTs - a.dateTs);
        const todayInventory = sortedInventory.find(i => i.vehicle.km > 0 && toDateOnlyMx(i.dateTs) === todayMx);
        const latestInventoryWithKm = sortedInventory.find(i => i.vehicle.km > 0);

        // Priority: manual param > today inventory > most recent inventory > last note > vehicleInfo (always non-zero if any km exists)
        const effectiveCurrentKm =
            currentKm ||
            todayInventory?.vehicle?.km ||
            latestInventoryWithKm?.vehicle?.km ||
            lastVisitKm ||
            (vehicleInfo as any)?.km ||
            0;
        const hasTodayInventory = !!todayInventory;
        const isFirstVisit = matchedNotes.length === 0; // Only inventories, no service notes yet

        const effectiveReferenceKm = lastAfinacionKm || lastVisitKm;
        // Meaningful delta only when we have two distinct reference points
        const kmSinceLastAfinacion =
            effectiveReferenceKm > 0 && effectiveCurrentKm > 0 && effectiveCurrentKm !== effectiveReferenceKm
                ? effectiveCurrentKm - effectiveReferenceKm
                : null;

        // Count preventivos since last afinacion
        const notesSinceAfinacion = lastAfinacion
            ? matchedNotes.filter(n => n.dateTs > lastAfinacion.dateTs)
            : matchedNotes;
        const preventivosSinceAfinacion = notesSinceAfinacion.filter(n => n.hasPreventivo).length;
        const preventivosDisponibles = Math.max(0, 2 - preventivosSinceAfinacion);

        // --- Price References (last price per service type) ---
        const priceRef: Record<string, { mo: number; refacciones: number; total: number; date: string; hasFactura: boolean }> = {};
        for (const note of matchedNotes) {
            for (const svc of note.services) {
                const key = normalize(svc).slice(0, 40);
                if (key && !priceRef[key]) {
                    priceRef[key] = {
                        mo: note.pricing.mo,
                        refacciones: note.pricing.refacciones,
                        total: note.pricing.total,
                        date: note.dateDisplay,
                        hasFactura: note.pricing.hasFactura,
                    };
                }
            }
        }

        // --- Maintenance Alerts ---
        const maintenanceAlerts: { level: 'ok' | 'warn' | 'danger' | 'info'; type: string; message: string }[] = [];
        if (isFirstVisit) {
            // First-time client or no service notes yet — no comparison possible
            const kmStr = effectiveCurrentKm > 0 ? `${effectiveCurrentKm.toLocaleString('es-MX')} km registrados` : 'sin km registrado';
            maintenanceAlerts.push({
                level: 'info',
                type: 'new_client',
                message: `Parece ser la primera visita al taller. ${kmStr}. No hay historial previo de servicios para comparar.`,
            });
        } else if (kmSinceLastAfinacion !== null) {
            if (kmSinceLastAfinacion >= 10000) {
                maintenanceAlerts.push({ level: 'danger', type: 'afinacion', message: `+${kmSinceLastAfinacion.toLocaleString('es-MX')} km desde la última afinación. ¡Afinación requerida!` });
            } else if (kmSinceLastAfinacion >= 5000) {
                maintenanceAlerts.push({ level: 'warn', type: 'preventivo', message: `+${kmSinceLastAfinacion.toLocaleString('es-MX')} km desde la última afinación. Mantenimiento preventivo disponible.` });
            } else {
                maintenanceAlerts.push({ level: 'ok', type: 'ok', message: `+${kmSinceLastAfinacion.toLocaleString('es-MX')} km desde la última afinación. Todo en orden.` });
            }
        }

        return NextResponse.json({
            found: true,
            total: allEntries.length,
            client: clientInfo,
            vehicle: vehicleInfo,
            maintenance: {
                lastAfinacionDate: lastAfinacion?.dateDisplay ?? null,
                lastAfinacionKm,
                effectiveCurrentKm,
                hasTodayInventory,
                kmSinceLastAfinacion,
                preventivosSinceAfinacion,
                preventivosDisponibles,
                alerts: maintenanceAlerts,
            },
            priceRef,
            entries: allEntries,
        });

    } catch (error) {
        console.error('[History Search API Error]', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
