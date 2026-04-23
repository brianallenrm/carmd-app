import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';

const getAuth = () => new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

/**
 * GET /api/os/note-by-folio?folio=7078
 * Returns the full note data for a given folio, ready to be used by the note-preview page.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const folio = searchParams.get('folio')?.trim();

    if (!folio) {
        return NextResponse.json({ error: 'Folio is required' }, { status: 400 });
    }

    try {
        const auth = getAuth();
        const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.MASTER.ID, auth);
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.MASTER.TAB_NAME];

        if (!sheet) {
            return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
        }

        const rows = await sheet.getRows();
        const row = rows.find(r => String(r.get('Folio') || '').trim() === String(folio).trim());

        if (!row) {
            return NextResponse.json({ error: `Note with folio ${folio} not found` }, { status: 404 });
        }

        // Parse metadatos (services, parts, vehicle details, etc.)
        let metadatos: any = null;
        try { metadatos = JSON.parse(row.get('Metadatos') || '{}'); } catch {}

        // Build services array: prefer rich metadatos, fallback to plain text
        let services: any[] = [];
        let parts: any[] = [];
        if (metadatos?.services?.length > 0) {
            services = metadatos.services;
        } else {
            const servicioText = row.get('Servicio') || '';
            services = servicioText
                .split('|')
                .map((s: string) => s.trim())
                .filter(Boolean)
                .map((desc: string, i: number) => ({
                    id: String(i + 1),
                    description: desc,
                    laborCost: i === 0 ? parseFloat(String(row.get('MO') || '0').replace(/[^0-9.]/g, '')) || 0 : 0,
                }));
        }
        if (metadatos?.parts?.length > 0) {
            parts = metadatos.parts;
        }

        // Build client
        const client = metadatos?.client || {
            name: row.get('Cliente') || '',
            email: row.get('Correo') || '',
            phone: row.get('Telefono') || '',
            address: '',
        };

        // Build vehicle
        const vehiculoText = row.get('Vehiculo') || '';
        const vehicle = metadatos?.vehicle || {
            brand: vehiculoText.split(' ')[0] || '',
            model: vehiculoText.split(' ').slice(1).join(' ') || '',
            year: row.get('Anio') || '',
            plates: row.get('Placa') || '',
            vin: '',
            engine: '',
            odometer: parseInt(String(row.get('KM') || '0').replace(/[^0-9]/g, '')) || 0,
        };

        // Date
        const dateRaw = row.get('Fecha') || '';
        let dateDisplay = '';
        if (dateRaw) {
            const ts = new Date(dateRaw).getTime();
            if (!isNaN(ts)) {
                dateDisplay = new Date(ts).toLocaleDateString('es-MX');
            } else {
                dateDisplay = dateRaw;
            }
        }

        return NextResponse.json({
            folio,
            date: dateDisplay || dateRaw,
            client,
            vehicle,
            services,
            parts,
            includeIva: metadatos?.includeIva ?? false,
            includeIsr: metadatos?.includeIsr ?? false,
            hideParts: metadatos?.hideParts ?? false,
            hideWarranty: metadatos?.hideWarranty ?? false,
            notes: metadatos?.notes || row.get('Notas') || '',
        });

    } catch (error) {
        console.error('[NoteByFolio API Error]', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
