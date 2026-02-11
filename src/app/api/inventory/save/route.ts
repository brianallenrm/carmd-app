import { NextRequest, NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // structure: { client, vehicle, inventory, functional, ... }

        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
        }

        const auth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.INVENTORY.ID, auth);
        await doc.loadInfo();

        // WRITE TO TEST SHEET
        const sheet = doc.sheetsByTitle["Inventario_entorno_prueba"];
        if (!sheet) {
            return NextResponse.json({ error: 'Target sheet not found' }, { status: 404 });
        }

        // Map data to columns based on user screenshot/structure
        // A: Fecha, B: Hora, C: Nombre, D: Tel, E: Cel/Whastapp, F: Email, ...
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-MX');
        const timeStr = now.toLocaleTimeString('es-MX');

        // Map data to columns matching the user's request
        await sheet.addRow({
            "Fecha de Ingreso:": dateStr,
            "Hora de ingreso:": timeStr,
            "Nombre COMPLETO o Empresa:": body.client?.name || "",
            "Teléfono casa / oficina:": body.client?.phoneOffice || "",
            "Teléfono (whatsapp):": body.client?.phone || "",
            "Dirección de correo electrónico": body.client?.email || "",
            "Domicilio Calle y NUMERO:": body.client?.address || "",
            "Colonia:": body.client?.colonia || "",
            "Deleg. o Municipio:": body.client?.municipality || "",
            "Estado:": body.client?.state || "",
            "Marca:": body.vehicle?.brand || "",
            "Sub marca:": body.vehicle?.model || "", // Model is stored in model
            "Modelo (año):": body.vehicle?.year || "", // Year is stored in year
            "Placas:": body.vehicle?.plates || "",
            "Número de serie:": body.vehicle?.serialNumber || "",
            "Tipo de Motor:": body.vehicle?.motor || "",
            "Kilometraje:": body.vehicle?.km || "",
            "¿Cuál es el nivel de gasolina?": body.vehicle?.gas || "",
            "¿Deja algún objeto de valor?": body.service?.hasValuables ? `Sí: ${body.service.valuablesDescription}` : "No",
            "¿Quién elaboró el inventario?": body.service?.advisorName || "N/A",
            // Photos: store R2 URLs for persistence (format: "id:url|id:url" with notes after #)
            "Adjuntar fotos de daños físicos del vehículo": (() => {
                const photosObj = body.photos || {};
                const urlEntries = Object.entries(photosObj)
                    .filter(([_, p]: [string, any]) => p?.driveUrl)
                    .map(([id, p]: [string, any]) => {
                        const notes = (p.notes || '').replace(/[|#]/g, '');
                        return notes ? `${id}:${p.driveUrl}#${notes}` : `${id}:${p.driveUrl}`;
                    })
                    .join('|');
                if (urlEntries) return urlEntries;
                const count = Object.keys(photosObj).filter(k => photosObj[k]?.previewUrl).length;
                return count > 0 ? `${count} Fotos (Ver PDF)` : "Sin fotos";
            })(),
            "Correo Electronico": body.client?.email || "", // Duplicate column per user request
            "Puntuación": "", // Placeholder for Score if available, otherwise empty
            "Detalles de daños": body.service?.comments || "",
            "Presupuesto Solicitado:": body.service?.serviceType || "", // Legacy column name
            "Motivo de Ingreso": body.service?.serviceType || "",
            // Inventory items (Tools/Objects)
            "¿El vehículo cuenta con la siguiente herramienta/objetos?": [
                ...Object.entries(body.inventory || {}).filter(([_, v]) => v).map(([k]) => k),
                body.inventoryOther
            ].filter(Boolean).join(", "),
            // Functional inspection data (stored as JSON for round-trip)
            "Datos Inspección Visual": JSON.stringify(body.functional || {})
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Save Inventory Error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
