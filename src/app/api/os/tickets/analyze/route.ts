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

const SYSTEM_INSTRUCTION = `Eres un asistente de inteligencia artificial especializado en talleres mecánicos y centros de servicio automotriz en México (CarMD).
Tu trabajo es analizar fotografías de comprobantes de pago de autopartes, tickets de caja registradora (térmicos o impresos), notas de remisión hechas a mano, notas de mostrador y facturas de refaccionarias y talleres de rectificación (AutoZone, Refaccionaria California, Rolcar, Mayoreo, Dacomsa, Tornos locales, etc.).

Debes extraer con precisión los siguientes campos y devolver ÚNICAMENTE un objeto JSON válido con este esquema:
{
  "supplier": string o null,       // Nombre de la refaccionaria, negocio, taller o torno (ej: "AutoZone", "Refaccionaria California", "Rolcar", "Torno y Rectificaciones Martínez", etc.)
  "description": string o null,    // Resumen conciso y claro de las refacciones compradas o del trabajo de rectificación/torno realizado (ej: "Balatas delanteras cerámicas", "Bomba de agua y anticongelante", "Rectificación de discos delanteros y tambores", "Juego de juntas y tornillos de cabeza"). Si hay varios ítems, resúmelos de forma comprensible para el asesor técnico.
  "cost": number o null,          // El costo total o importe final pagado por los artículos/servicios como número con decimales (ej: 850, 1420.50). Si no está explícito el total, usa la suma de las partidas. NUNCA incluyas signo de pesos ni comas.
  "items": [                       // Lista de piezas o conceptos desglosados si son legibles
    {
      "description": string,
      "cost": number
    }
  ],
  "confidence": "high" | "medium" | "low", // Nivel de certidumbre en la lectura
  "notes": string o null           // Observación breve si el ticket está borroso, incompleto o cortado
}

REGLAS CRÍTICAS:
1. Normaliza los nombres de marcas y proveedores conocidos (ej: si dice "AUTO ZONE DE MEXICO SA DE CV" pon "AutoZone", si dice "REFACCIONARIA CALIFORNIA" pon "Refaccionaria California").
2. En 'cost', asegúrate de tomar el valor final a pagar (TOTAL), no el subtotal ni el cambio.
3. Si el comprobante es una nota de remisión escrita a mano o ticket de torno/rectificación, lee con atención la caligrafía para extraer el concepto mecánico principal (ej: cepillado de cabeza, rectificado de discos, encamisado, etc.).
4. Si un dato no es legible con certeza, devuelve null para ese campo específico en vez de inventarlo.
5. Devuelve EXCLUSIVAMENTE el JSON estructurado.`;

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
        const { image, mimeType = 'image/jpeg', type = 'refaccion' } = body;

        if (!image || typeof image !== 'string') {
            return NextResponse.json(
                { error: 'Falta la imagen en base64 para analizar el ticket' },
                { status: 400 }
            );
        }

        // Limpiar prefijo data:image/...;base64, si viene incluido
        const cleanBase64 = image.includes('base64,')
            ? image.split('base64,')[1]
            : image;

        const effectiveMimeType = mimeType.includes('webp')
            ? 'image/webp'
            : mimeType.includes('png')
                ? 'image/png'
                : 'image/jpeg';

        const prompt = type === 'rectificacion'
            ? 'Analiza esta nota de remisión o ticket de rectificación/torno automotriz. Extrae el taller/torno (supplier), el trabajo de rectificación o maquinado realizado (description), y el costo total cobrado (cost).'
            : 'Analiza este ticket o nota de compra de refacciones automotrices. Extrae la refaccionaria/proveedor (supplier), las piezas o repuestos comprados (description), y el costo total pagado (cost).';

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
