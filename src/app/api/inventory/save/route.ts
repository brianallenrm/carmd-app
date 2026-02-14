import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
        }

        const auth = new google.auth.JWT(
            process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            undefined,
            process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            ["https://www.googleapis.com/auth/spreadsheets"]
        );

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = GOOGLE_SHEETS_CONFIG.INVENTORY.ID;
        const tabName = GOOGLE_SHEETS_CONFIG.INVENTORY.TAB_NAME;

        // Step 1: Read headers from row 1
        const headerRes = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${tabName}'!1:1`,
        });
        const headers = headerRes.data.values?.[0] || [];

        // Step 2: Get sheet ID (gid) for batchUpdate
        const spreadsheetMeta = await sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'sheets.properties',
        });
        const sheetMeta = spreadsheetMeta.data.sheets?.find(
            s => s.properties?.title === tabName
        );
        const sheetId = sheetMeta?.properties?.sheetId ?? 0;

        // Step 3: Insert a blank row at position 2 (index 1, just below headers)
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    insertDimension: {
                        range: {
                            sheetId,
                            dimension: 'ROWS',
                            startIndex: 1,
                            endIndex: 2,
                        },
                        inheritFromBefore: false,
                    }
                }]
            }
        });

        // Step 4: Build data row matching header order
        const now = new Date();
        const dateStr = now.toLocaleDateString('es-MX');
        const timeStr = now.toLocaleTimeString('es-MX');

        const dataMap: Record<string, string> = {
            "FECHA": dateStr,
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
            "Sub marca:": body.vehicle?.model || "",
            "Modelo (año):": body.vehicle?.year || "",
            "Placas:": body.vehicle?.plates || "",
            "Número de serie:": body.vehicle?.serialNumber || "",
            "Tipo de Motor:": body.vehicle?.motor || "",
            "Kilometraje:": body.vehicle?.km || "",
            "¿Cuál es el nivel de gasolina?": body.vehicle?.gas || "",
            "¿Deja algún objeto de valor?": body.service?.hasValuables ? `Sí: ${body.service.valuablesDescription}` : "No",
            "¿Quién elaboró el inventario?": body.service?.advisorName || "N/A",
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
            "Correo Electronico": body.client?.email || "",
            "Detalles de daños": body.service?.comments || "",
            "Presupuesto Solicitado:": body.service?.serviceType || "",
            "Motivo de Ingreso": body.service?.serviceType || "",
            "¿El vehículo cuenta con la siguiente herramienta/objetos?": [
                ...Object.entries(body.inventory || {}).filter(([_, v]) => v).map(([k]) => k),
                body.inventoryOther
            ].filter(Boolean).join(", "),
            "Datos Inspección Visual": JSON.stringify(body.functional || {})
        };

        const rowValues = headers.map((h: string) => dataMap[h] || "");

        // Step 5: Write data to the newly inserted row 2
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${tabName}'!A2`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [rowValues],
            },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Save Inventory Error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
