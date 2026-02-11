import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';

// Type matching the frontend expectations
interface ReceptionData {
    id: string;
    date: string;
    folio: string;
    client: {
        name: string;
        phone: string;
        email: string;
        address: string;
        colonia: string;
        municipality: string;
        state: string;
    };
    vehicle: {
        brand: string;
        model: string;
        year: string;
        plates: string;
        serialNumber: string;
        motor: string;
        km: string;
        gas: string;
    };
    inventory: any;
    inventoryOther: string;
    functional: any;
    service: {
        advisorName: string;
        hasValuables: boolean;
        valuablesDescription: string;
        comments: string;
    };
    photos: any;
}

export async function GET() {
    try {
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

        // Read from the test/production inventory sheet
        const sheet = doc.sheetsByTitle['Inventario_entorno_prueba'];
        if (!sheet) {
            return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
        }

        const rows = await sheet.getRows();

        // Map rows to ReceptionData format
        const receptions: ReceptionData[] = rows.map((row, index) => {
            const dateStr = row.get("Fecha de Ingreso:") || "";
            const timeStr = row.get("Hora de ingreso:") || "";

            // Parse inventory items from comma-separated string back into a boolean object
            const inventoryStr = row.get("¿El vehículo cuenta con la siguiente herramienta/objetos?") || "";
            const inventoryObj: Record<string, boolean> = {};
            const knownItems = [
                'birlo', 'cables', 'reflejantes', 'herramienta',
                'gato', 'llanta', 'maletin', 'extintor',
                'cds', 'radio', 'antena', 'encendedor'
            ];
            const itemsInSheet = inventoryStr.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
            knownItems.forEach(item => {
                if (itemsInSheet.includes(item)) {
                    inventoryObj[item] = true;
                }
            });
            // Anything not in knownItems is "other"
            const otherItems = itemsInSheet.filter((i: string) => !knownItems.includes(i)).join(', ');

            // Parse functional inspection data from sheet columns
            const functionalJson = row.get("Datos Inspección Visual") || "";
            let functionalObj: any = {};
            if (functionalJson) {
                try {
                    functionalObj = JSON.parse(functionalJson);
                } catch {
                    // If not JSON, leave as empty
                }
            }

            const serialNumber = row.get("Número de serie:") || "";

            // Parse photo URLs from R2 storage (format: "id:https://url#notes|id:https://url|...")
            const photosStr = row.get("Adjuntar fotos de daños físicos del vehículo") || "";
            const photosObj: Record<string, any> = {};
            if (photosStr.includes('http')) {
                photosStr.split('|').forEach((entry: string) => {
                    const colonIdx = entry.indexOf(':');
                    if (colonIdx > 0) {
                        const id = entry.substring(0, colonIdx);
                        const rest = entry.substring(colonIdx + 1);
                        // Split URL#notes
                        const hashIdx = rest.lastIndexOf('#');
                        let url: string;
                        let notes = '';
                        if (hashIdx > 10) { // Only split if # is deep enough to not be part of URL
                            url = rest.substring(0, hashIdx);
                            notes = rest.substring(hashIdx + 1);
                        } else {
                            url = rest;
                        }
                        if (url.startsWith('http')) {
                            photosObj[id] = {
                                id,
                                label: id,
                                previewUrl: url,
                                driveUrl: url,
                                notes,
                            };
                        }
                    }
                });
            }

            return {
                id: `sheet_${index}_${Date.now()}`, // Unique ID
                date: dateStr,
                folio: `INV-${String(index + 1).padStart(5, '0')}`,
                client: {
                    name: row.get("Nombre COMPLETO o Empresa:") || "",
                    phone: row.get("Teléfono (whatsapp):") || "",
                    email: row.get("Dirección de correo electrónico") || "",
                    address: row.get("Domicilio Calle y NUMERO:") || "",
                    colonia: row.get("Colonia:") || "",
                    municipality: row.get("Deleg. o Municipio:") || "",
                    state: row.get("Estado:") || ""
                },
                vehicle: {
                    brand: row.get("Marca:") || "",
                    model: row.get("Sub marca:") || "",
                    year: row.get("Modelo (año):") || "",
                    plates: row.get("Placas:") || "",
                    serialNumber: serialNumber,
                    vin: serialNumber,
                    motor: row.get("Tipo de Motor:") || "",
                    km: row.get("Kilometraje:") || "",
                    gas: row.get("¿Cuál es el nivel de gasolina?") || ""
                },
                inventory: inventoryObj,
                inventoryOther: otherItems,
                functional: functionalObj,
                service: {
                    advisorName: row.get("¿Quién elaboró el inventario?") || "",
                    hasValuables: row.get("¿Deja algún objeto de valor?")?.includes("Sí") || false,
                    valuablesDescription: row.get("¿Deja algún objeto de valor?")?.replace("Sí: ", "") || "",
                    comments: row.get("Detalles de daños") || "",
                    serviceType: row.get("Motivo de Ingreso") || ""
                },
                photos: photosObj
            };
        });

        // Return newest first
        return NextResponse.json({
            receptions: receptions.reverse()
        });

    } catch (error) {
        console.error("Error fetching inventory list:", error);
        return NextResponse.json(
            { error: 'Failed to fetch inventory data' },
            { status: 500 }
        );
    }
}
