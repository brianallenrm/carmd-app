import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize Google Gen AI Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Target Model
const FALLBACK_MODELS = [
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3-flash',
    'gemini-2.5-flash'
];

async function generateClinicalInsightsWithFallback(systemInstruction: string, promptText: string) {
    let lastError: any = null;
    for (const model of FALLBACK_MODELS) {
        try {
            console.log(`[Expediente AI] Intentando análisis con modelo: ${model}`);
            const result = await ai.models.generateContent({
                model,
                contents: promptText,
                config: {
                    systemInstruction,
                    temperature: 0.15,
                    responseMimeType: 'application/json'
                }
            });
            return result;
        } catch (err) {
            console.warn(`[Expediente AI] Falló modelo ${model}. Probando siguiente...`, err);
            lastError = err;
        }
    }
    throw lastError;
}

export async function POST(request: NextRequest) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY no configurada en el servidor' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { client, vehicle, entries, maintenance } = body;

        if (!vehicle || !entries || !Array.isArray(entries)) {
            return NextResponse.json(
                { error: 'Datos incompletos del expediente para análisis' },
                { status: 400 }
            );
        }

        const now = new Date();
        const currentDateMx = now.toLocaleDateString('es-MX', {
            timeZone: 'America/Mexico_City',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        // 1. Prepare clinical history data for Gemini
        const notes = entries.filter((e: any) => e.type === 'note');
        const inventories = entries.filter((e: any) => e.type === 'inventory');

        const notesFormatted = notes.map((n: any) => ({
            folio: n.folio,
            fecha: n.dateDisplay || n.dateRaw,
            fechaTs: n.dateTs,
            km: n.vehicle?.km || 0,
            servicios: n.services || [],
            precioTotal: n.pricing?.total || 0,
            hasFactura: n.pricing?.hasFactura || false,
            hasAfinacion: n.hasAfinacion || false,
            hasInspeccionAfinacion: n.hasInspeccionAfinacion || false
        }));

        const inventoriesFormatted = inventories.map((inv: any) => ({
            fecha: inv.dateDisplay || inv.dateRaw,
            fechaTs: inv.dateTs,
            km: inv.vehicle?.km || 0,
            gasolina: inv.vehicle?.gas || '',
            motivoIngreso: inv.motivoIngreso || '',
            asesor: inv.advisor || ''
        }));

        // 2. System Instruction specialized for CarMD Clinical Engineering
        const systemInstruction = `Eres el Director Médico y Especialista Clínico de Diagnóstico Automotriz de CarMD.
Tu objetivo es analizar con precisión quirúrgica el historial completo de un vehículo (notas de servicio e inventarios de recepción) para entregar un Diagnóstico Clínico Ejecutivo al asesor del taller.

REGLAS MECÁNICAS Y CLÍNICAS ESTRICTAS DE CARMD:

1. DIFERENCIACIÓN OBLIGATORIA DE AFINACIÓN:
- AFINACIÓN COMPLETA / REAL (Bien hecha): Incluye cambio de aceite, filtros (aceite, aire, cabina, gasolina) y/o bujías. 
  * EFECTO: Resetea el intervalo de afinación a 10,000 km y el reloj de tiempo a 6 meses.
- INSPECCIÓN DE AFINACIÓN / MANTENIMIENTO DE CORTESÍA: En CarMD cuando el cliente afina, se le regalan 2 inspecciones preventivas intermedias (a los 5,000 km y 7,500 km). En las notas los asesores pueden escribirlo como: "Inspección de afinación", "Inspecc. Afina", "Mantenimiento de afinación", "Mtto. afinación", "Revisión preventiva", "Inspección de mantenimiento".
  * EFECTO: Es una visita de seguimiento/garantía cumplida. NO RESATEA el odómetro de afinación completa. El kilometraje acumulado debe medirse desde la última AFINACIÓN COMPLETA.

2. EVALUACIÓN DUAL DE SALUD DE AFINACIÓN (KILOMETRAJE + TIEMPO):
- Intervalo estándar: 10,000 km o 6 meses (lo que ocurra primero).
- POR KILOMETRAJE desde la última afinación completa:
  * < 7,000 km: 'al_dia' (Verde)
  * 7,000 a 9,999 km: 'proxima' (Ámbar)
  * >= 10,000 km: 'urgente' (Rojo)
- POR TIEMPO desde la última afinación completa:
  * > 6 meses: Advertencia de degradación temporal.
  * > 12 meses: 'urgente' (Rojo) por degradación y oxidación natural del aceite/filtros, aun si el kilometraje recorrido es bajo.

3. TRAZABILIDAD MULTI-NOTA DE COMPONENTES:
- BUJÍAS: Revisa si en la última afinación se cambiaron o no bujías. Si en la última afinación NO se cambiaron (o no aparecen en refacciones/servicios) pero en notas más antiguas sí, calcula el uso total acumulado. Si llevan más de 20,000 km de uso o más de 2 afinaciones sin cambio, marca 'Reemplazo Mandatorio'.
- ACEITE Y FILTROS: Calcula kilómetros y meses reales transcurridos desde el último cambio real.
- FRENOS, SUSPENSIÓN Y OTROS: Detecta cuándo se cambiaron balatas, discos, horquillas, amortiguadores o clutch con su número de nota y km relativo.

4. MODOS POLIMÓRFICOS DE ANÁLISIS:
- MODO 'con_afinacion': Si el auto tiene al menos una afinación completa en CarMD.
- MODO 'otros_servicios': Si el auto tiene notas mecánicas (frenos, suspensión, etc.) pero NUNCA se ha afinado en CarMD.
- MODO 'primer_ingreso': Si el auto solo tiene inventarios de recepción recientes sin notas de servicio previas.

FECHA ACTUAL DE EVALUACIÓN: ${currentDateMx}.
Odómetro actual efectivo del auto: ${maintenance?.effectiveCurrentKm || vehicle?.km || 0} km.

Devuelve ÚNICAMENTE un JSON válido (sin markdown de código) con la estructura especificada.`;

        const userPrompt = `Analiza el siguiente expediente de CarMD y genera el diagnóstico clínico estructurado:

DATOS DEL CLIENTE:
- Nombre: ${client?.name || 'Cliente CarMD'}
- Teléfono: ${client?.phone || 'No registrado'}

DATOS DEL VEHÍCULO:
- Marca/Modelo: ${vehicle?.fullName || `${vehicle?.brand || ''} ${vehicle?.model || ''}`.trim()} ${vehicle?.year || ''}
- Placas: ${vehicle?.plates || 'Sin placa'}
- Kilometraje Actual Efectivo: ${maintenance?.effectiveCurrentKm || vehicle?.km || 0} km
- Días desde última visita: ${maintenance?.daysSinceLastVisit !== null ? maintenance.daysSinceLastVisit : 'Desconocido'}
- Promedio mensual de km: ${maintenance?.avgMonthlyKm || 'No calculado'}

HISTORIAL DE NOTAS DE SERVICIO (${notesFormatted.length} notas):
${JSON.stringify(notesFormatted, null, 2)}

HISTORIAL DE INVENTARIOS DE RECEPCIÓN (${inventoriesFormatted.length} ingresos):
${JSON.stringify(inventoriesFormatted, null, 2)}

ESTRUCTURA EXACTA DEL JSON DE RESPUESTA:
{
  "modo": "con_afinacion" | "otros_servicios" | "primer_ingreso",
  "estadoSalud": "urgente" | "proxima" | "al_dia" | "sin_registro" | "primer_ingreso",
  "tituloEstado": "string conciso con mayúsculas y emojis (ej: 🔴 AFINACIÓN REQUERIDA (+11,200 km))",
  "subtituloEstado": "string explicativo breve (ej: Superó el intervalo por 1,200 km o 7 meses de uso)",
  "porcentajeDesgaste": 85, // Número entero de 0 a 100 indicando el nivel de desgaste del ciclo de afinación (100 = 10k km o 6 meses)
  "kmTranscurridos": 11200, // KM desde última afinación completa, o null si no aplica
  "mesesTranscurridos": 7, // Meses desde última afinación completa, o null
  "ultimaAfinacionReal": {
    "folio": "6102",
    "fecha": "12 de Octubre 2025",
    "km": 72000,
    "incluyoBujias": false,
    "detalles": "Cambio de aceite sintético y filtros."
  } | null,
  "ultimoMantenimientoInspeccion": {
    "folio": "6735",
    "fecha": "15 de Enero 2026",
    "km": 77500,
    "tipo": "Inspección de Afinación / Cortesía"
  } | null,
  "componentes": [
    {
      "id": "bujias",
      "nombre": "Bujías",
      "icono": "sparkles", // 'sparkles' | 'droplet' | 'disc' | 'wrench' | 'gauge' | 'shield'
      "estado": "Reemplazo recomendado",
      "nivel": "alerta", // 'alerta' (rojo) | 'advertencia' (amarillo) | 'ok' (verde) | 'neutral' (gris)
      "detalle": "No se cambiaron en la última afinación (#6102). Llevan +25,000 km de uso.",
      "ultimaNota": "5210"
    },
    {
      "id": "aceite",
      "nombre": "Aceite y Filtros",
      "icono": "droplet",
      "estado": "Vencido (+1,200 km)",
      "nivel": "alerta",
      "detalle": "Último cambio realizado en nota #6102 a los 72,000 km.",
      "ultimaNota": "6102"
    },
    {
      "id": "frenos",
      "nombre": "Sistema de Frenos",
      "icono": "disc",
      "estado": "Al día",
      "nivel": "ok",
      "detalle": "Balatas delanteras cambiadas en nota #6400 (hace 8,000 km).",
      "ultimaNota": "6400"
    }
  ],
  "stepperCiclo": [
    {
      "paso": 1,
      "titulo": "Afinación Mayor",
      "notaFolio": "6102",
      "km": 72000,
      "fecha": "12 Oct 2025",
      "estado": "completado" // 'completado' | 'actual' | 'pendiente'
    },
    {
      "paso": 2,
      "titulo": "Insp. Preventiva (5k km)",
      "notaFolio": "6735",
      "km": 77500,
      "fecha": "15 Ene 2026",
      "estado": "completado"
    },
    {
      "paso": 3,
      "titulo": "Próxima Afinación",
      "notaFolio": null,
      "km": 82000,
      "fecha": "Hoy",
      "estado": "actual"
    }
  ],
  "puntosClave": [
    {
      "tipo": "diagnostico", // 'diagnostico' | 'recomendacion' | 'garantia'
      "icono": "target", // 'target' | 'lightbulb' | 'shield'
      "texto": "El vehículo superó el límite de kilometraje y tiempo. Requiere afinación completa con cambio obligado de bujías."
    },
    {
      "tipo": "recomendacion",
      "icono": "lightbulb",
      "texto": "Revisar espesor de balatas traseras ya que solo se atendió el eje delantero en la última visita."
    }
  ],
  "oportunidadComercial": "Ofrecer afinación completa con bujías de platino e inspección de puntos de seguridad."
}`;

        console.log(`[Expediente AI API] Enviando solicitud a Gemini 3.5 Flash Lite para placas: ${vehicle?.plates || 'N/A'}`);
        const aiResponse = await generateClinicalInsightsWithFallback(systemInstruction, userPrompt);
        const rawText = aiResponse.text?.trim() || '{}';
        const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        
        const parsedClinicalData = JSON.parse(cleanJson);
        console.log(`[Expediente AI API] Análisis completado con éxito (Modo: ${parsedClinicalData.modo}, Estado: ${parsedClinicalData.estadoSalud})`);

        return NextResponse.json({
            success: true,
            insights: parsedClinicalData,
            analyzedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Expediente AI API Error]', error);
        return NextResponse.json(
            { error: error?.message || 'Error al generar análisis clínico con IA' },
            { status: 500 }
        );
    }
}
