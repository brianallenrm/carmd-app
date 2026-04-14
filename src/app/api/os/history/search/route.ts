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
    if (typeof val === 'number') return (val - 25569) * 86400 * 1000;
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const d = new Date(str);
        return isNaN(d.getTime()) ? 0 : d.getTime();
    }
    const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (dmy) {
        const a = parseInt(dmy[1]);
        const b = parseInt(dmy[2]);
        let year = parseInt(dmy[3]);
        if (year < 100) year += 2000;
        const now = Date.now();
        if (a > 12) {
            const d = new Date(year, b - 1, a);
            return isNaN(d.getTime()) ? 0 : d.getTime();
        }
        const asDDMM = new Date(year, b - 1, a).getTime();
        if (asDDMM > now) {
            const asMDDD = new Date(year, a - 1, b).getTime();
            return isNaN(asMDDD) ? asDDMM : asMDDD;
        }
        return isNaN(asDDMM) ? 0 : asDDMM;
    }
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
        const isPlateSearch = /^[a-zA-Z0-9\-]{5,}$/.test(query.replace(/\s/g, ''));
        const nqAlpha = query.toUpperCase().replace(/[^A-Z0-9]/g, '');

        // --- Search MASTER (Service Notes) ---
        const matchedNotes: any[] = [];
        for (const row of masterRows) {
            const plate = normalize(row.get('Placa') || '');
            const plateAlpha = (row.get('Placa') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
            const clientName = normalize(row.get('Cliente') || '');
            const matchesPlate = isPlateSearch && !!plateAlpha && plateAlpha === nqAlpha;
            const matchesName = !isPlateSearch && clientName.includes(nq);
            const matchesPlateFallback = !isPlateSearch && plate.includes(nq);

            if (matchesPlate || matchesName || matchesPlateFallback) {
                const folio = row.get('Folio') || '';
                const dateRaw = row.get('Fecha') || '';
                const servicio = row.get('Servicio') || '';
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

        const clientInfo = latestInventory?.client || latestNote?.client || latestEntry.client;
        const vehicleInfo = latestInventory?.vehicle || latestNote?.vehicle || latestEntry.vehicle;

        // --- Maintenance Calculation ---
        const lastAfinacion = matchedNotes.find(n => n.hasAfinacion);
        const lastAfinacionKm = lastAfinacion?.vehicle?.km ?? 0;
        const lastVisitKm = latestNote?.vehicle?.km ?? 0;

        const todayMx = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
        const toDateOnlyMx = (ts: number) =>
            ts > 0 ? new Date(ts).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }) : '';

        const sortedInventory = [...matchedInventory].sort((a, b) => b.dateTs - a.dateTs);
        const todayInventory = sortedInventory.find(i => i.vehicle.km > 0 && toDateOnlyMx(i.dateTs) === todayMx);
        const latestInventoryWithKm = sortedInventory.find(i => i.vehicle.km > 0);

        const effectiveCurrentKm =
            currentKm ||
            todayInventory?.vehicle?.km ||
            latestInventoryWithKm?.vehicle?.km ||
            lastVisitKm ||
            (vehicleInfo as any)?.km ||
            0;

        const effectiveReferenceKm = lastAfinacionKm || lastVisitKm;
        const kmSinceLastAfinacion =
            effectiveReferenceKm > 0 && effectiveCurrentKm > 0 && effectiveCurrentKm !== effectiveReferenceKm
                ? effectiveCurrentKm - effectiveReferenceKm
                : null;

        // --- NEW METRICS ---
        // 1. Days since last visit
        const daysSinceLastVisit = latestEntry.dateTs > 0 
            ? Math.floor((Date.now() - latestEntry.dateTs) / (1000 * 60 * 60 * 24))
            : null;

        // 2. Average Monthly KM
        let avgMonthlyKm: number | null = null;
        const notesWithKm = matchedNotes.filter(n => n.vehicle.km > 0).sort((a, b) => a.dateTs - b.dateTs);
        if (notesWithKm.length >= 2) {
            const first = notesWithKm[0];
            const last = notesWithKm[notesWithKm.length - 1];
            const monthDiff = (last.dateTs - first.dateTs) / (1000 * 60 * 60 * 24 * 30.41);
            if (monthDiff > 0.5) { // At least 2 weeks of history
                avgMonthlyKm = Math.round((last.vehicle.km - first.vehicle.km) / monthDiff);
            }
        }

        // --- Maintenance Alerts ---
        const maintenanceAlerts: { level: 'ok' | 'warn' | 'danger' | 'info'; type: string; message: string }[] = [];
        if (matchedNotes.length === 0) {
            maintenanceAlerts.push({
                level: 'info',
                type: 'new_client',
                message: `Parece ser la primera visita al taller. No hay historial previo de notas para comparar.`,
            });
        } else if (kmSinceLastAfinacion !== null) {
            if (kmSinceLastAfinacion >= 10000) {
                maintenanceAlerts.push({ level: 'danger', type: 'afinacion', message: `+${kmSinceLastAfinacion.toLocaleString('es-MX')} km desde última afinación. ¡Afinación requerida!` });
            } else if (kmSinceLastAfinacion >= 7000) {
                maintenanceAlerts.push({ level: 'warn', type: 'afinacion_pronto', message: `+${kmSinceLastAfinacion.toLocaleString('es-MX')} km desde última afinación. Próxima afinación en ${Math.max(0, 10000 - kmSinceLastAfinacion).toLocaleString('es-MX')} km.` });
            } else {
                maintenanceAlerts.push({ level: 'ok', type: 'ok', message: `Todo en orden con la afinación (+${kmSinceLastAfinacion.toLocaleString('es-MX')} km).` });
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
                kmSinceLastAfinacion,
                daysSinceLastVisit,
                avgMonthlyKm,
                alerts: maintenanceAlerts,
            },
            entries: allEntries.map(e => ({
                ...e,
                // Clean up entries to avoid huge payloads if not needed
                client: undefined, 
            })),
        });

    } catch (error) {
        console.error('[History Search API Error]', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
