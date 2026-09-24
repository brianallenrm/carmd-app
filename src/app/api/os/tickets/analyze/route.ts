import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize Google Gen AI client with environment API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Model fallback cascade: primary is gemini-3.5-flash-lite
const VISION_FALLBACK_MODELS = [
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3-flash',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
];

const SYSTEM_INSTRUCTION = `Eres un asistente experto de visión e inteligencia artificial de CarMD, diseñado para leer y extraer datos de CUALQUIER ticket, nota de compra, remisión de mostrador, factura o recibo en México.
Aunque la gran mayoría de los comprobantes del taller son de refaccionarias (AutoZone, California, Rolcar, Mayoreo, Dacomsa, etc.) o de tornos y rectificadoras, en el centro de servicio también se compran insumos en ferreterías, tiendas de conveniencia, gasolineras o se realizan pruebas con diversos tickets de consumo general.

Tu objetivo SIEMPRE es extraer los datos principales del comprobante presentado, sin importar el giro comercial:
1. "supplier": Nombre del comercio, refaccionaria, taller, torno, tienda o negocio emisor (ej: "AutoZone", "Refaccionaria California", "Rolcar", "Torno Don Pepe", "Ferretería Calzada", "Helados Santa Clara", "OXXO", etc.). Normaliza el nombre comercial conocido si aplica.
2. "description": Resumen conciso y útil de los artículos, piezas, insumos o servicios adquiridos (ej: "Balatas delanteras cerámicas", "Rectificación de discos delanteros", "Tornillos y abrazaderas", "Helado sencillo y agua"). Si hay varios ítems, resúmelos de forma clara para el técnico.
3. "cost": Monto total final pagado (TOTAL / IMPORTE PAGADO) como número con decimales (ej: 850, 1420.50). Si no está explícito el total, usa la suma de las partidas. NUNCA incluyas signo de pesos ni comas.
4. "items": Lista de conceptos legibles con descripción y costo.
5. "confidence": "high" | "medium" | "low"
6. "notes": Breve apunte relevante si el comprobante no es automotriz o si la imagen está borrosa o cortada.

REGLAS CRÍTICAS:
- NUNCA devuelvas null en supplier, description o cost si el comprobante tiene el nombre del negocio, los conceptos o el importe total visible, aun cuando no sea estrictamente de refacciones de auto.
- En 'cost', prioriza siempre el 'TOTAL' o 'IMPORTE PAGADO', no el subtotal ni el cambio.
- Si el comprobante es una nota de remisión hecha a mano (ej: torno, rectificación), lee con cuidado la caligrafía para extraer el concepto mecánico principal.
- Devuelve EXCLUSIVAMENTE el JSON estructurado.`;

async function analyzeTicketWithFallback(inlineData: { mimeType: string; data: string }, userPrompt: string) {
    let lastError: any = null;

    for (const model of VISION_FALLBACK_MODELS) {
        try {
            console.log(`[Ticket AI] Analizando imagen de ticket con modelo: ${model}`);
            const result = await ai.models.generateContent({
                model,
                contents: [
                    { inlineData },
                    userPrompt
                ],
                config: {
                    systemInstruction: SYSTEM_INSTRUCTION,
                    temperature: 0.1,
                    responseMimeType: 'application/json'
                }
            });

            if (result && result.text) {
                return { result, modelUsed: model };
            }
        } catch (err: any) {
            console.warn(`[Ticket AI] Falló modelo ${model}. Probando siguiente en cascada...`, err?.message || err);
            lastError = err;
        }
    }

    throw lastError || new Error('No se pudo analizar el ticket con ningún modelo disponible.');
}

export async function POST(request: NextRequest) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY no configurada en las variables de entorno' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { image, imageUrl, mimeType = 'image/jpeg', type = 'refaccion' } = body;

        let cleanBase64 = '';
        let effectiveMimeType = mimeType || 'image/jpeg';

        if (imageUrl && typeof imageUrl === 'string') {
            console.log(`[Ticket AI] Obteniendo imagen para análisis desde URL: ${imageUrl}`);
            const imgRes = await fetch(imageUrl);
            if (!imgRes.ok) {
                throw new Error(`No se pudo descargar la imagen del ticket: HTTP ${imgRes.status}`);
            }
            const arrayBuf = await imgRes.arrayBuffer();
            cleanBase64 = Buffer.from(arrayBuf).toString('base64');
            const contentType = imgRes.headers.get('content-type');
            if (contentType) {
                effectiveMimeType = contentType.includes('webp')
                    ? 'image/webp'
                    : contentType.includes('png')
                        ? 'image/png'
                        : 'image/jpeg';
            }
        } else if (image && typeof image === 'string') {
            cleanBase64 = image.includes('base64,')
                ? image.split('base64,')[1]
                : image;
            effectiveMimeType = mimeType.includes('webp')
                ? 'image/webp'
                : mimeType.includes('png')
                    ? 'image/png'
                    : 'image/jpeg';
        } else {
            return NextResponse.json(
                { error: 'Falta la imagen (image o imageUrl) para analizar el ticket' },
                { status: 400 }
            );
        }

        const prompt = type === 'rectificacion'
            ? 'Analiza esta nota de remisión o ticket de rectificación, maquinado o torno automotriz. Extrae el taller/torno (supplier), el trabajo realizado (description), y el costo total pagado (cost).'
            : 'Analiza este ticket, factura o comprobante de compra. Extrae el comercio o refaccionaria (supplier), los artículos o piezas compradas (description), y el costo total pagado (cost).';

        const { result, modelUsed } = await analyzeTicketWithFallback(
            {
                mimeType: effectiveMimeType,
                data: cleanBase64
            },
            prompt
        );

        let parsedData: any = {};
        try {
            const rawText = result.text || '{}';
            parsedData = JSON.parse(rawText);
        } catch (parseErr) {
            console.error('[Ticket AI] Error al parsear JSON devuelto por Gemini:', parseErr, result.text);
            return NextResponse.json(
                {
                    error: 'Error al interpretar los datos del ticket',
                    raw: result.text
                },
                { status: 422 }
            );
        }

        // Sanitización y normalización de costo
        let sanitizedCost: number | null = null;
        if (parsedData.cost !== undefined && parsedData.cost !== null) {
            const num = typeof parsedData.cost === 'number'
                ? parsedData.cost
                : parseFloat(String(parsedData.cost).replace(/[^0-9.]/g, ''));
            if (!isNaN(num) && num > 0) {
                sanitizedCost = Math.round(num * 100) / 100;
            }
        }

        return NextResponse.json({
            success: true,
            modelUsed,
            data: {
                supplier: parsedData.supplier ? String(parsedData.supplier).trim() : null,
                description: parsedData.description ? String(parsedData.description).trim() : null,
                cost: sanitizedCost,
                items: Array.isArray(parsedData.items) ? parsedData.items : [],
                confidence: parsedData.confidence || 'medium',
                notes: parsedData.notes || null
            }
        });

    } catch (error: any) {
        console.error('[Ticket AI] Error crítico en análisis de ticket:', error);
        return NextResponse.json(
            {
                error: error.message || 'Error al procesar el ticket con Inteligencia Artificial',
                details: error.toString()
            },
            { status: 500 }
        );
    }
}
