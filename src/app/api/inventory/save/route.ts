import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 500 });
        }

        const auth = new google.auth.JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = GOOGLE_SHEETS_CONFIG.INVENTORY.ID;
        const primaryTabName = GOOGLE_SHEETS_CONFIG.INVENTORY.TAB_NAME;
        const legacyTabName = GOOGLE_SHEETS_CONFIG.INVENTORY.LEGACY_TAB_NAME;

        // Build the common data map
        const now = new Date();
        const timezone = 'America/Mexico_City';
        const dateStr = now.toLocaleDateString('es-MX', { timeZone: timezone });
        const timeStr = now.toLocaleTimeString('es-MX', { timeZone: timezone, hour12: true });

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

        // --- STEP 1: PARALLEL METADATA GATHERING ---
        // We fetch headers and sheet properties for both tabs at once
        const [primaryHeadersRes, legacyHeadersRes, spreadsheetMeta] = await Promise.all([
            sheets.spreadsheets.values.get({ spreadsheetId, range: `'${primaryTabName}'!1:1` }),
            legacyTabName ? sheets.spreadsheets.values.get({ spreadsheetId, range: `'${legacyTabName}'!1:1` }) : Promise.resolve({ data: { values: [] } }),
            sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' })
        ]);

        const primaryHeaders = primaryHeadersRes.data.values?.[0] || [];
        const legacyHeaders = legacyHeadersRes.data.values?.[0] || [];
        const primarySheetId = spreadsheetMeta.data.sheets?.find(s => s.properties?.title === primaryTabName)?.properties?.sheetId ?? 0;

        // --- STEP 2: PRIMARY TAB SAVE (CRITICAL) - INSERT AT TOP ---
        try {
            // We still need to batchUpdate (Insert Row) and update (Write Data)
            // But now we already have the headers and sheetId
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        insertDimension: {
                            range: { sheetId: primarySheetId, dimension: 'ROWS', startIndex: 1, endIndex: 2 },
                            inheritFromBefore: false,
                        }
                    }]
                }
            });

            const primaryRowValues = primaryHeaders.map((h: string) => dataMap[h] || "");
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${primaryTabName}'!A2`,
                valueInputOption: 'RAW',
                requestBody: { values: [primaryRowValues] },
            });
        } catch (error) {
            console.error("Critical error saving to PRIMARY tab:", error);
            throw error;
        }

        // --- STEP 3: LEGACY TAB SAVE (NON-CRITICAL) - APPEND AT BOTTOM ---
        if (legacyTabName && legacyHeaders.length > 0) {
            // Fire and forget (almost) legacy save in background? 
            // In a Serverless function, we should await but legacy failure shouldn't block return
            try {
                const legacyRowValues = legacyHeaders.map((h: string) => dataMap[h] || "");
                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: `'${legacyTabName}'!A1`,
                    valueInputOption: 'RAW',
                    requestBody: { values: [legacyRowValues] },
                });
            } catch (error) {
                console.warn("Non-critical error saving to LEGACY tab:", error);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Save Inventory Error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
