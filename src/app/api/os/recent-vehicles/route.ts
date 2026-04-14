import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';

const LIMIT = 10;

const parseMXNumber = (val: any): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
};

const parseDate = (dateVal: any, timeVal?: any): number => {
    if (!dateVal) return 0;
    
    let baseTs = 0;
    if (typeof dateVal === 'number') {
        baseTs = (dateVal - 25569) * 86400 * 1000;
    } else {
        const str = String(dateVal).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
            baseTs = new Date(str).getTime();
        } else {
            const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
            if (dmy) {
                const a = parseInt(dmy[1]);
                const b = parseInt(dmy[2]);
                let year = parseInt(dmy[3]);
                if (year < 100) year += 2000;
                const now = Date.now();
                if (a > 12) {
                    baseTs = new Date(year, b - 1, a).getTime();
                } else {
                    const asDDMM = new Date(year, b - 1, a).getTime();
                    if (asDDMM > now) {
                        baseTs = new Date(year, a - 1, b).getTime();
                    } else {
                        baseTs = asDDMM;
                    }
                }
            } else {
                baseTs = new Date(str).getTime();
            }
        }
    }

    if (isNaN(baseTs) || baseTs === 0) return 0;

    // Reset clock to 0:00:00 local time for the base date
    const d = new Date(baseTs);
    d.setHours(0, 0, 0, 0);

    // Apply time if provided
    if (timeVal !== undefined && timeVal !== null && timeVal !== '') {
        // Case 1: Time is a number (Excel/Google Sheets serial time: fraction of 1 day)
        if (typeof timeVal === 'number' || (!isNaN(Number(timeVal)) && !String(timeVal).includes(':'))) {
            const fraction = parseFloat(String(timeVal));
            if (fraction >= 0 && fraction < 1) {
                const totalSeconds = Math.round(fraction * 86400);
                const hrs = Math.floor(totalSeconds / 3600);
                const mins = Math.floor((totalSeconds % 3600) / 60);
                const secs = totalSeconds % 60;
                d.setHours(hrs, mins, secs, 0);
                return d.getTime();
            }
        }

        // Case 2: Time is a string (e.g., "9:02 a.m.")
        const timeStr = String(timeVal).trim().toLowerCase();
        // More flexible regex to match various formats: "9:02", "9:02:20", "09:02 am", "9:02 p. m."
        const match = timeStr.match(/(\d{1,2})[:.](\d{1,2})(?::(\d{1,2}))?\s*([ap][\s.]*[m][.]?)?/);
        if (match) {
            let hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const seconds = match[3] ? parseInt(match[3]) : 0;
            const ampm = match[4];

            if (ampm) {
                if (ampm.includes('p') && hours < 12) hours += 12;
                if (ampm.includes('a') && hours === 12) hours = 0;
            }

            d.setHours(hours, minutes, seconds, 0);
            return d.getTime();
        }
    }

    return d.getTime();
};

const formatDateDisplay = (ts: number): string => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    
    const isToday = date.toDateString() === now.toDateString();
    
    const timeStr = date.toLocaleTimeString('es-MX', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Mexico_City'
    });

    if (isToday) {
        return `Hoy, ${timeStr}`;
    }

    const dateStr = date.toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', timeZone: 'America/Mexico_City'
    });
    
    return `${dateStr} · ${timeStr}`;
};

const timeAgo = (ts: number): string => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    // If it's very recent, just show "Hace poco" or minutes
    if (mins < 1) return 'Hace un momento';
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
};

export async function GET() {
    try {
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
        }

        const auth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        // Load both sheets in parallel
        const [inventoryDoc, masterDoc] = await Promise.all([
            new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.INVENTORY.ID, auth),
            new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.MASTER.ID, auth),
        ]);
        await Promise.all([inventoryDoc.loadInfo(), masterDoc.loadInfo()]);

        const inventorySheet = inventoryDoc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.INVENTORY.TAB_NAME];
        const masterSheet = masterDoc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.MASTER.TAB_NAME];

        if (!inventorySheet || !masterSheet) {
            return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
        }

        // Get ALL inventory rows, parse their dates, sort by date DESC, take top LIMIT
        const allInventoryRows = await inventorySheet.getRows();
        const withTs = allInventoryRows.map(row => ({
            row,
            dateTs: parseDate(row.get('FECHA') || '', row.get('Hora de ingreso:') || ''),
        }));
        // Sort newest first — handles sheets that may be sorted either way
        withTs.sort((a, b) => b.dateTs - a.dateTs);
        const recentRows = withTs.slice(0, LIMIT);

        // Get all master rows to cross-reference notes
        const masterRows = await masterSheet.getRows();

        // Build note lookup: plate → latest note (folio + dateTs)
        const noteByPlate: Record<string, { folio: string; total: number; services: string; dateTs: number; dateRaw: string }> = {};
        for (const row of masterRows) {
            const plate = (row.get('Placa') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (!plate) continue;
            const folio = row.get('Folio') || '';
            const services = row.get('Servicio') || '';
            const total = parseMXNumber(row.get('Total'));
            const noteDateRawStr = row.get('Fecha') || '';
            const noteDateTs = parseDate(noteDateRawStr);
            // Keep the note with the latest date (highest folio as tiebreak)
            if (!noteByPlate[plate] || noteDateTs > noteByPlate[plate].dateTs ||
                (noteDateTs === noteByPlate[plate].dateTs && folio > noteByPlate[plate].folio)) {
                noteByPlate[plate] = { folio, total, services, dateTs: noteDateTs, dateRaw: noteDateRawStr };
            }
        }

        const vehicles = recentRows.map(({ row, dateTs }, idx) => {
            const dateRaw = row.get('FECHA') || '';
            const timeRaw = row.get('Hora de ingreso:') || '';
            const plates = (row.get('Placas:') || '').toUpperCase();
            const platesAlpha = plates.replace(/[^A-Z0-9]/g, '');
            const latestNote = noteByPlate[platesAlpha] ?? null;

            // Normalizar a inicio del día para la comparación de estatus (evitar problemas de horas en mismo día)
            const inventoryDayTs = new Date(dateTs).setHours(0, 0, 0, 0);
            const noteDayTs = latestNote ? new Date(latestNote.dateTs).setHours(0, 0, 0, 0) : 0;

            let status: 'con_nota' | 'en_piso_registrado' | 'en_piso_nuevo';
            if (latestNote && noteDayTs >= inventoryDayTs) {
                status = 'con_nota';
            } else if (latestNote) {
                status = 'en_piso_registrado';
            } else {
                status = 'en_piso_nuevo';
            }

            const km = parseMXNumber(row.get('Kilometraje:'));

            return {
                idx: idx + 1,
                inventoryId: row.rowNumber,
                dateRaw,
                timeRaw,
                dateDisplay: formatDateDisplay(dateTs),
                dateTs,
                timeAgo: timeAgo(dateTs),
                client: {
                    name: row.get('Nombre COMPLETO o Empresa:') || '',
                    phone: row.get('Teléfono (whatsapp):') || row.get('Teléfono casa / oficina:') || '',
                },
                vehicle: {
                    brand: row.get('Marca:') || '',
                    model: row.get('Sub marca:') || '',
                    year: row.get('Modelo (año):') || '',
                    plates,
                    km,
                    gas: row.get('¿Cuál es el nivel de gasolina?') || '',
                },
                motivo: row.get('Motivo de Ingreso') || row.get('Presupuesto Solicitado:') || '',
                advisor: row.get('¿Quién elaboró el inventario?') || '',
                status,
                note: latestNote
                    ? { folio: latestNote.folio, total: latestNote.total, services: latestNote.services }
                    : null,
                prefillJson: JSON.stringify({
                    client: {
                        name: row.get('Nombre COMPLETO o Empresa:') || '',
                        phone: row.get('Teléfono (whatsapp):') || row.get('Teléfono casa / oficina:') || '',
                        email: row.get('Dirección de correo electrónico') || '',
                        address: [
                            row.get('Domicilio Calle y NUMERO:') || '',
                            row.get('Colonia:') || '',
                        ].filter(Boolean).join(', ') || '',
                    },
                    vehicle: {
                        brand: row.get('Marca:') || '',
                        model: row.get('Sub marca:') || '',
                        year: row.get('Modelo (año):') || '',
                        plates,
                        vin: row.get('Número de serie:') || '',
                        engine: row.get('Tipo de Motor:') || '',
                        odometer: km,
                    },
                }),
            };
        });

        return NextResponse.json({ vehicles });

    } catch (error) {
        console.error('[Recent Vehicles API Error]', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
