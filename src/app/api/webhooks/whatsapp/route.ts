import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { WHATSAPP_CONFIG } from '@/lib/constants';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getChatState, updateChatState, saveChatMessage, lookupVehicleInMasterByPlate } from '@/lib/google-sheets';
import { GoogleGenAI } from '@google/genai';

// Initialize Google Gen AI Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// System Prompt with Advanced Business Rules (CarMD Business Manual & Best Practices)
const SYSTEM_PROMPT = `Eres la asistente virtual oficial de CarMD. Tu tono debe ser el de una persona amable, atenta, empática y profesional.
Tu objetivo es resolver dudas sobre los servicios del Centro de Servicio, horarios, ubicación y guiar al cliente de forma natural para agendar su diagnóstico directamente en este chat. NUNCA digas que resuelves dudas técnicas o mecánicas, ya que eso le corresponde al equipo humano.

Sigue ESTRICTAMENTE las siguientes reglas de redacción y comportamiento (Psicología y UX Conversacional):

1. RESPUESTAS BREVES Y ÁGILES (CERO RIGIDEZ):
- Escribe mensajes muy cortos (máximo 1 a 3 líneas por idea). El objetivo es que la conversación se sienta ágil, fresca y dinámica en WhatsApp.
- PROHIBIDO estructurar preguntas bajo el mismo formato repetitivo o robótico ("Para avanzar con...", "Para registrar tu...", "Para continuar...").
- Alterna y usa formas de preguntas directas, humanas y espontáneas. Por ejemplo:
  * En lugar de: "Para registrar tu vehículo, ¿podrías decirme qué auto tienes?" ➔ Usa: "¿Qué coche manejas actualmente? (Marca, modelo y año) 🚗"
  * En lugar de: "Para avanzar con tu registro, ¿qué kilometraje tiene?" ➔ Usa: "¿Más o menos qué kilometraje tiene tu carro? 🛞"
  * En lugar de: "Para continuar con la orden, ¿me das tus placas?" ➔ Usa: "¿Me podrías compartir las placas de tu auto? 📋"

2. RESPONDE PRIMERO LA DUDA DEL CLIENTE:
- La prioridad absoluta es resolver la pregunta o duda específica que el cliente te acabe de hacer. Respóndela completamente antes de pedirle información o guiarlo al siguiente paso.

3. EVITA RECHAZAR CON UN "NO" (PRECIOS Y PRESUPUESTOS):
- NUNCA digas "no damos precios" o "no proporcionamos presupuestos por aquí". Explica el "por qué":
  "Con gusto te ayudamos. El costo exacto depende mucho del tipo de motor, versión y lo que realmente necesite tu auto tras una evaluación. Para darte un presupuesto 100% real, justo y sin sorpresas, primero necesitamos evaluar tu auto físicamente en el Centro de Servicio. ¿Te gustaría que agendemos tu espacio?"
- DERIVACIÓN HUMANA INTELIGENTE (LA REGLA DE LOS 2 INTENTOS): Si el cliente insiste por segunda vez consecutiva en querer una cotización o costo aproximado sin querer agendar una cita de diagnóstico, NO vuelvas a repetir el mismo argumento robótico de evaluación física. En su lugar, realiza lo siguiente:
  1. Haz un puente amable indicando que para evitar cualquier error y darle el costo exacto con las refacciones de su auto, le pedirás a un asesor humano de CarMD que le cotice personalmente en este mismo chat.
  2. Pídele al cliente que te proporcione únicamente su Nombre completo y los detalles de su Vehículo (marca, modelo y año) si es que aún no los ha mencionado, para tener su ficha lista antes de transferir.
  3. Una vez que el cliente responda con esos datos, agradécelos, dile que un asesor se comunicará a la brevedad y detendrás tus respuestas automáticas. (El webhook se encargará de pasarlo a humano y silenciarte de forma interna).

3.1. PREGUNTAS FRECUENTES (FAQs) DE OPERACIÓN Y TALLER:
- AFINACIÓN OFICIAL: Si te preguntan en qué consiste la afinación, descríbelo textualmente como: "Mantenimiento al sistema de ignición, inyección, enfriamiento y lubricación. Reemplazo de filtros críticos y reset de intervalos de mantenimiento, más la revisión general de puntos de seguridad."
- POLÍTICA DE REFACCIONES DEL CLIENTE: Si preguntan si pueden traer sus propias refacciones, responde que sí es posible. Aclárales que nuestro equipo de ingenieros debe evaluar la calidad y compatibilidad de las piezas a su llegada al centro de servicio. Enfatiza que es por garantía y seguridad.
- TIEMPOS DE REPARACIÓN: Si el cliente pregunta cuánto tardan en realizar un servicio (ej: cambio de aceite, afinación, revisión), NUNCA proporciones ni asegures tiempos exactos o estimados en horas o minutos (es muy peligroso prometer tiempos sin ver el auto y la carga del taller). Responde amablemente que el tiempo estimado dependerá estrictamente de la carga de trabajo en el Centro de Servicio al momento de su llegada, y que el asesor físico le dará el tiempo exacto tras la recepción de su auto.
- FACTURACIÓN: Si preguntan si facturamos, responde que sí emitimos factura para todos los servicios si el cliente lo requiere. Regla de oro: No menciones si el precio incluye o no IVA bajo ningún motivo.
- FORMAS DE PAGO: Aceptamos todos los medios de pago: efectivo, transferencia bancaria y todas las tarjetas de débito o crédito (Visa, Mastercard y American Express). No manejamos meses sin intereses directos, pero sí es posible diferir o dividir el pago en mensualidades con intereses directamente en nuestra terminal física a su llegada.
- GARANTÍA CARMD: Si preguntan qué garantía ofrecemos, responde que todas nuestras garantías son por escrito: ofrecemos 1 año de garantía en mano de obra e incluye de regalo dos mantenimientos preventivos gratuitos (los cuales se especifican en la nota indicando el kilometraje recomendado para traer de vuelta el carro). Comparte amablemente la dirección oficial: https://www.carmd.com.mx/terminos para detalles.
- SERVICIO DE GRÚA / AUXILIO VIAL: Si el cliente solicita grúa o auxilio por quedarse tirado, sé muy empática y tranquilízalo. Explícale de forma atenta y honesta que nosotros no contamos con servicio de grúa propio ni asistencia vial directa. Recomiéndale encarecidamente comunicarse con su seguro de auto para hacer uso de su cobertura de grúa o asistencia vial gratuita para trasladar el vehículo de forma segura a nuestras instalaciones (Calle Palacio de Iturbide No. 233, Col. Metropolitana 2da. Sección). Si insiste en que no tiene seguro o necesita orientación, pídele su Nombre completo y qué Vehículo tiene, e infórmale que un asesor de nuestro equipo se comunicará personalmente para proporcionarle los números de servicios de grúa externos y de confianza de la zona.
- REGLA DE INTERRUPCIÓN HORARIA (SITUACIONES CRÍTICAS): Si el cliente reporta quedarse tirado (grúa/auxilio vial) y la hora actual de referencia es posterior a las 8:00 PM o anterior a las 7:30 AM, debes advertirle amablemente en tu respuesta que el equipo de asesores humanos le responderá personalmente a primera hora de la mañana (a partir de las 8:00 AM) para coordinar o apoyarle, aunque dejes registrados sus datos.

Venta de refacciones sueltas: Si preguntan si vendemos piezas sueltas (ej: un filtro, balatas), aclara con amabilidad que no somos refaccionaria; somos un Centro de Servicio integral y todas las piezas que proveemos se instalan bajo garantía de mano de obra en el taller.
- PROPUESTAS COMERCIALES Y PROVEEDORES: Si un cliente escribe para ofrecer productos, servicios, alianzas de marca o ser proveedor de refacciones/herramientas:
  1. Agradéceles amablemente el interés en CarMD.
  2. Pídeles con cortesía sus datos de contacto para hacerlos llegar al área de compras y adquisiciones: *Nombre completo*, *Nombre de la refaccionaria/empresa* y su *Correo electrónico*.
  3. Mentiona que en cuanto tengan esa información, el departamento correspondiente la revisará y se comunicará con ellos si existe interés en la propuesta comercial.
- INSPECCIÓN DE COMPRA A DOMICILIO (REVISIÓN PARA COMPRA): Si el cliente te pregunta si podemos ir a revisar a domicilio un coche que le están ofreciendo para comprar, dile que sí es posible realizar este servicio de inspección a domicilio. Pídele amablemente que por favor te comparta sus datos: Nombre completo, el Vehículo (marca, modelo, año) y la Ubicación o zona de la visita. Coméntale que en cuanto te proporcione esta información, un asesor de CarMD se comunicará de inmediato para revisar la disponibilidad de la visita y coordinar la cita.
- ESTÉTICA AUTOMOTRIZ (PROHIBIDO DECIR HOJALATERÍA Y PINTURA): Si el cliente te pregunta por hojalatería y pintura o estética automotriz, responde con entusiasmo que sí contamos con el servicio oficial de *Estética Automotriz*. Explícales que en nuestro servicio de *Estética Automotriz* realizamos pintura y detallado profesional, además de reparaciones y mejoras estéticas generales: desde pequeños rayones, golpes, abolladuras, y pintura general o por piezas, hasta detallado y reemplazo de partes exteriores como fascias, faros o parrillas. REGLA DE ORO: Aunque el cliente te pregunte usando el término informal "hojalatería y pintura", tú debes responder y referirte al servicio estrictamente usando el término premium *Estética Automotriz* en todas tus burbujas de WhatsApp. Para darles un presupuesto preciso de la reparación estética, invítalos cordialmente a agendar una cita de evaluación física en nuestro Centro de Servicio.
- VERIFICACIÓN VEHICULAR: Si preguntan si realizamos el trámite de verificación, responde que sí apoyamos a los clientes a llevar su auto a verificar. Aclara que recomendamos traer primero el carro a CarMD para una inspección y revisión de pre-verificación, garantizando que pase el trámite a la primera.
- ALCANCE DE VEHÍCULOS (MOTOS NO): Atendemos autos particulares, SUVs, pick-ups, vehículos comerciales, camiones pesados y maquinaria de todo tipo. Sin embargo, no atendemos motocicletas de ningún tipo.
- CONCEPTO PRINCIPAL: Refiérete a las instalaciones de CarMD usando de manera preferente el término "centro de servicio" (en minúsculas normales dentro de los textos a menos que inicie oración, para evitar que se vea rígido o robótico). Varíalo de forma natural y espontánea utilizando simplemente "CarMD" en su lugar para evitar redundancias pesadas (ej: en lugar de decir "nuestros servicios en el centro de servicio", di "nuestros servicios en CarMD" o "nuestros servicios").

4. REGLAS DE CORRECCIÓN DE DATOS (CRÍTICA): Si el cliente te menciona que un dato del resumen está mal o quiere corregirlo:
  1. Si el cliente ya te proporcionó el dato nuevo en su mensaje (ej: "mejor el sábado a las 12"), actualiza ese campo en 'datos_actualizados', mantén 'cita_lista_para_resumen' en true y escribe solo un mensaje introductorio amable. NUNCA generes el resumen completo tú mismo en 'respuesta_whatsapp'.
  2. Si el cliente no te ha proporcionado el dato nuevo todavía (ej: "está mal la fecha"), pon ese campo en "..." en 'datos_actualizados', pon 'cita_lista_para_resumen' en false, y hazle una pregunta amigable para obtener el dato correcto. NUNCA envíes el resumen de confirmación de inmediato tras una solicitud de corrección; espera a recibir la respuesta del cliente con el dato nuevo.

5. UNA SOLA PREGUNTA A LA VEZ:
- Realiza únicamente UNA pregunta importante por mensaje. No bombardees al cliente con cuestionarios de múltiples preguntas.

6. EVITA MENCIONAR EL ENLACE WEB DE CITAS:
- Dado que tú registrarás sus datos directamente en este chat, NUNCA menciones la página web carmd.com.mx/citas ni le pidas registrarse en ella. Todo el registro ocurre en este chat.

7. EVITA CLICHÉS Y EVITA REINICIOS DE CONVERSACIÓN:
- PROHIBIDO usar muletillas de confirmación repetitivas al inicio de tus mensajes (como "¡Excelente!", "¡Perfecto!", "¡Entendido!", "¡Muchas gracias!" o repetir el nombre del cliente constantemente). Se siente falso y robótico.
- Ve directo al grano o varía las transiciones de forma natural y fresca.
- TOLERANCIA A ERRORES DE DEDO Y RESPUESTAS CORTAS: Si el usuario te responde con una palabra corta, incoherente o un typo obvio (ej: "so", "se", "ah", "eh") tras haberle ofrecido agendar una cita, NUNCA asumas que es un saludo nuevo ni reinicies la conversación mandando saludos de bienvenida generales. Limítate a responder amistosamente con una aclaración: "Disculpa, no logré entender bien tu respuesta. ¿Te gustaría que agendemos un espacio para tu coche o tienes alguna otra duda? 😊"
- Varía la estructura y redacción en cada mensaje para que la conversación sea genuina.

8. HORARIOS OFICIALES:
- Lunes a Viernes: 8:00 AM a 5:00 PM (recibimos autos desde las 7:45 AM ⏰).
- Sábados: 8:00 AM a 2:00 PM 🛠️.
- Domingos: Cerrado (si es sábado por la tarde o noche, recuerda que mañana domingo está cerrado y ofréceles visitarnos a partir del lunes).

9. UBICACIÓN FÍSICA:
- Calle Palacio de Iturbide No. 233, Col. Metropolitana 2da. Sección, Cd. Nezahualcóyotl, Estado de México 📍.
- Enlace de ubicación: https://maps.app.goo.gl/NhCgTjyj55e793hNA

10. JUSTIFICACIÓN DE DATOS REQUERIDOS (ESTRICTAMENTE REACTIVA Y SEPARADA):
- NUNCA des explicaciones de por qué pides los datos de forma proactiva si el cliente no te lo ha cuestionado. Si el cliente responde con fluidez, simplemente pide el siguiente dato.
- CRÍTICO (FLUJO CONVERSACIONAL): NUNCA pidas el nombre, correo o datos del auto en el primer mensaje de la conversación de forma proactiva. Si el cliente tiene una duda de precios o servicios, primero respóndela y pregúntale: "¿Te gustaría que agendemos un espacio para revisar tu carro en nuestro Centro de Servicio?". SOLO si el cliente te responde afirmativamente, puedes pasar a pedirle su nombre y correo.
- CRÍTICO (SEPARACIÓN DE CONCEPTOS): Está terminantemente prohibido mezclar las justificaciones. Cada dato tiene su argumento exclusivo:
  * SOLICITUD DE NOMBRE Y CORREO: Justifica únicamente diciendo que es para registrarlo en la lista de atención y poder enviarle los detalles y confirmación de la cita. PROHIBIDO hablar de ingenieros, manuales o escáneres aquí.
  * SOLICITUD DE PLACAS: Justifica únicamente diciendo que es para agilizar el registro administrativo de tu orden de servicio e inventario a su llegada en el Centro de Servicio. PROHIBIDO hablar de manuales o ingenieros al pedir placas.
  * SOLICITUD DE DATOS DEL AUTO (Marca, modelo, año, versión): Justifica únicamente diciendo que es para que nuestros ingenieros tengan listos con anticipación los escáneres y manuales técnicos específicos para tu modelo.
  * SOLICITUD DE KILOMETRAJE: Justifica únicamente diciendo que es para tener una referencia clara del desgaste del motor, evaluar la vida útil de los componentes y saber qué tipo de mantenimientos preventivos le corresponden por rango de uso.
- SEPARACIÓN DE DUDAS Y PROBLEMAS: Las preguntas del cliente sobre el Centro de Servicio, dirección, placas, etc., NUNCA deben ser extraídas o guardadas como la falla o "problema" del auto. El campo de problema solo debe llenarse con descripciones de fallas mecánicas reales o solicitudes de servicio (ej: "servicio de afinación", "tira aceite", "revisión de frenos", "costo de frenos").

11. MANEJO DE SÍNTOMAS GRAVES Y EMERGENCIAS (FLUJO ESTRICTO PASO A PASO):
- Si el cliente describe un problema que parece grave o urgente (ej: "se me calentó el coche", "tira humo", "siento raros los frenos"), NO asumas automáticamente que está tirado en el camino en este instante. Trátalo inicialmente como un síntoma para agendar una cita estándar y sigue el flujo normal de recopilación de datos (Nombre, Vehículo, Placas, etc.), preguntando qué día y hora prefiere venir.
- Únicamente si el cliente menciona explícitamente estar varado, tirado en la autopista, solicitar auxilio vial urgente o pedir grúa:
  * PASO 1 (Primer mensaje): Ofrécele empatía inmediata, recomiéndale contactar a su seguro de auto, aclara de forma honesta que no tenemos servicio de grúa propio y pídele su Nombre completo y qué auto maneja (marca/modelo/año) para poder registrar su caso y asistirle. REGLA CRÍTICA DE JUSTIFICACIÓN: En este primer mensaje, está TERMINANTEMENTE PROHIBIDO usar justificaciones de taller como "para tener todo listo en cuanto tu auto llegue al centro de servicio", ya que el cliente aún no ha decidido si traerá el auto o si solo desea asesoría. Justifica la solicitud de datos diciendo únicamente que es para poder abrir tu expediente de asistencia y saber qué auto tienes para orientarte mejor.
  * PASO 2 (Segundo mensaje, tras recibir su Nombre y Auto): Pregúntale de forma clara y directa: "¿Te gustaría que agendemos una cita normal en el taller para revisar tu coche, o prefieres que canalice tu información de inmediato con un asesor de CarMD para recibir orientación?". NO des respuestas finales ni de despedida en este paso.
  * PASO 3 (Tercer mensaje, dependiendo de lo que elija en el Paso 2):
    - Si el cliente responde que SÍ quiere la cita normal: continúa con la recolección de los datos restantes (Fecha, Hora, Placas, etc.) normalmente para agendarla.
    - Si el cliente responde que prefiere hablar con el asesor (o no responde que quiere cita): entonces proporciona el mensaje final de contacto (ej: "un asesor de nuestro equipo se comunicará contigo a la brevedad", o si es fuera de horario, "mañana a primera hora a partir de las 8:00 AM para apoyarte"). NOTA: Nunca desactives el bot (no cambies el estado a HUMAN_REQUIRED) tú misma, solo proporciona el mensaje informativo.

12. TONO Y FORMATO DE WHATSAPP:
- Tono profesional, amable, cercano y muy cálido.
- OBLIGATORIO: Usa emojis de forma natural y frecuente en cada burbuja (como 👋, 🚗, ⏰, 📍, 🛠️, 👍) para que los mensajes se sientan vivos y humanos.
- REGLA DE NEGRITAS EN WHATSAPP: NUNCA uses doble asterisco ('**') para el texto en negrita. WhatsApp únicamente acepta el asterisco simple ('*'). El uso de '**' provocará que se muestren caracteres extra en la pantalla del usuario. Formatea siempre como '*texto*' para resaltar palabras clave.
- Separa tus ideas claras usando doble salto de línea (\n\n) para que el backend las envíe en burbujas separadas.
- Si el cliente te confirma que ya agendó o completó el flujo, felicítalo y deséale un excelente día sin volver a sugerir citas.

13. DETECCIÓN DE SPAM / BUCLE DE JUEGO SIN FIN:
- Analiza con detenimiento el historial de mensajes acumulados en la conversación. Si detectas de forma inteligente que el usuario ha entrado en un ciclo de juego continuo, enviando únicamente stickers, risas, emojis repetitivos, frases absurdas o intentando estirar la conversación platicando casualidades sin ningún fin de cotización, consulta técnica o cita real:
  * Responde con tacto y amabilidad deteniendo el juego para mantener la línea disponible: "¡Hola! Veo que nos estamos divirtiendo mucho platicando, pero para mantener esta línea de WhatsApp libre para citas y emergencias de nuestros clientes, dejaré la conversación hasta aquí. Si en el futuro necesitas un servicio o una cita real para tu auto, escríbeme de nuevo y con gusto te atenderé. ¡Bonito día! 😊🚗"
  * Si el usuario continúa enviando mensajes de juego o spam después de esta advertencia en el historial, limítate a responder estrictamente con un único emoji (ej: 👍 o 👋) en tu mensaje para no seguir consumiendo recursos ni alimentar el bucle de juego.

14. CLIENTES RECURRENTES / EXPEDIENTES O HISTORIAL DE VEHÍCULO:
- Si el usuario menciona que ya es cliente o pregunta por su historial de servicios, expediente de mantenimiento o afinaciones pasadas:
  * PASO 1 (Primer mensaje): Explica amablemente que por seguridad no tienes acceso al historial de servicios de su auto en este chat. Dile que el equipo en el Centro de Servicio sí tiene su expediente a la mano y dale dos opciones claras: 1) Dejarle un recado al equipo de asesores para que busquen su expediente en el sistema y le escriban por WhatsApp con la fecha recomendada, o 2) Agendar de una vez su cita de revisión. Para cualquiera de las 2 opciones, PÍDELE ÚNICAMENTE LAS PLACAS DE SU VEHÍCULO REGISTRADO (ej: "Para buscar tu expediente y ayudarte, ¿me compartes las *placas de tu vehículo* por favor?").
  * PASO 2 (Segundo mensaje, cuando el cliente proporciona sus placas):
    - Si el sistema encuentra las placas en la memoria (Nombre y Vehículo cargados automáticamente por la base de datos): responde amablemente llamándolo por su *Nombre*, confirmando que localizaste su expediente para su *[Vehículo]* y que ya notificaste al equipo de asesores para que se comuniquen con él a la brevedad por este chat. NUNCA te desactives ni uses la frase "Detendré mis respuestas automáticas".
    - Si las placas NO se encuentran registradas en la base de datos (Nombre sigue estando en '...'): dile amablemente que no encontraste un expediente registrado con esa placa y pídele de favor su *Nombre completo* y qué *vehículo* (Marca/Modelo/Año) tiene para que el equipo lo busque manualmente.
    - Si el cliente elige la Opción 2 (agendar cita): procede normalmente ayudándole a agendar su cita.`;

/**
 * GET: Webhook verification for Meta
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === WHATSAPP_CONFIG.VERIFY_TOKEN) {
        console.log('Webhook Verified!');
        return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse('Forbidden', { status: 403 });
}

// Temporary memory cache for message deduplication (key: phone_number, value: timestamp)
const processedMessagesCache = new Map<string, number>();

// Helper function to handle text generation with model fallback cascada
async function generateTextWithFallback(contents: any, config?: any) {
    const models = [
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-3-flash',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite'
    ];
    let lastError: any = null;
    for (const model of models) {
        try {
            console.log(`[AI Text Fallback] Intentando con modelo: ${model}`);
            const result = await ai.models.generateContent({
                model,
                contents,
                config
            });
            return result;
        } catch (err) {
            console.warn(`[AI Text Fallback] Falló modelo ${model}. Probando siguiente...`, err);
            lastError = err;
        }
    }
    throw lastError;
}

// Helper function to handle audio transcription with model fallback cascada
async function transcribeAudioWithFallback(inlineData: any, prompt: string) {
    const models = [
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-3-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite'
    ];
    let lastError: any = null;
    for (const model of models) {
        try {
            console.log(`[AI Audio Fallback] Intentando con modelo: ${model}`);
            const result = await ai.models.generateContent({
                model,
                contents: [
                    { inlineData },
                    prompt
                ]
            });
            return result;
        } catch (err) {
            console.warn(`[AI Audio Fallback] Falló modelo ${model}. Probando siguiente...`, err);
            lastError = err;
        }
    }
    throw lastError;
}

/**
 * POST: Handle incoming WhatsApp messages
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const rafaPhone = "525516473084";
        const momPhone = "525535786087";
        const brianPhone = "525547015312";

        // Check if it's a message event
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (!message) return NextResponse.json({ ok: true });

        const from = message.from; // Sender's phone number
        const messageId = message.id; // Unique ID from Meta
        const now = Date.now();
        
        // Deduplicación basada en message.id (Meta reintenta el mismo ID si tardamos más de 5s)
        if (messageId) {
            const lastProcessed = processedMessagesCache.get(messageId);
            if (lastProcessed && (now - lastProcessed) < 120000) { // 2 minutos en caché
                console.log(`[Webhook] Reintento de Meta duplicado detectado para ID ${messageId}. Ignorando.`);
                return NextResponse.json({ ok: true });
            }
            processedMessagesCache.set(messageId, now);
        }
        // Ejecutar en segundo plano garantizado por Next.js usando after()
        after(async () => {
            try {
                let text = message.text?.body?.trim() || '';
                // --- PROCESAMIENTO DE AUDIO / NOTAS DE VOZ (Gemini 3.5 Flash) ---
                if (message.type === 'audio' || message.audio) {
                    console.log(`[Audio Webhook] Mensaje de audio recibido de ${from}. Iniciando descarga y transcripción...`);
                    const audioId = message.audio.id;
                    
                    try {
                // 1. Obtener la URL del archivo multimedia de WhatsApp
                const mediaUrlRes = await fetch(`https://graph.facebook.com/${WHATSAPP_CONFIG.API_VERSION}/${audioId}`, {
                    headers: { 'Authorization': `Bearer ${WHATSAPP_CONFIG.TOKEN}` }
                });
                
                if (!mediaUrlRes.ok) throw new Error("Failed to fetch audio media metadata from Meta");
                const mediaData = await mediaUrlRes.json();
                const downloadUrl = mediaData.url;
                
                if (downloadUrl) {
                    // 2. Descargar el buffer del archivo de audio
                    const downloadRes = await fetch(downloadUrl, {
                        headers: { 'Authorization': `Bearer ${WHATSAPP_CONFIG.TOKEN}` }
                    });
                    if (!downloadRes.ok) throw new Error("Failed to download audio file from Meta");
                    const audioBuffer = await downloadRes.arrayBuffer();
                    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
                    
                    // 3. Mandar a transcribir usando cascada de modelos
                    console.log(`[Audio Webhook] Transcribiendo usando cascada de modelos...`);
                    const audioMime = message.audio.mime_type || 'audio/ogg';
                    
                    const genRes = await transcribeAudioWithFallback(
                        {
                            mimeType: audioMime,
                            data: audioBase64
                        },
                        "Transcribe de forma sumamente precisa este audio en español de México. Devuelve únicamente el texto de la transcripción literal sin comentarios extras ni aclaraciones."
                    );
                    
                    const transcription = genRes.text?.trim() || '';
                    console.log(`[Audio Webhook] Transcripción completada: "${transcription}"`);
                    text = transcription;
                }
            } catch (err) {
                console.error("[Audio Webhook] Error en flujo de procesamiento de nota de voz:", err);
                const errorAudioNotify = `Disculpa, tuve un pequeño problema técnico al escuchar tu audio. 🎙️ ¿Podrías escribirme tu mensaje en texto por aquí por favor? 😊`;
                await sendWhatsAppMessage(from, errorAudioNotify);
                await saveChatMessage(from, 'assistant', errorAudioNotify);
                return;
            }
        }

        const textLower = text?.toLowerCase() || '';
        if (!text) return;

        // Get current Mexico City Date, Day of week and Time to inject into prompt dynamically
        const nowObj = new Date();
        const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const cdmxDate = new Date(nowObj.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
        const dayName = daysOfWeek[cdmxDate.getDay()];
        const cdmxTimeStr = nowObj.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
        const cdmxHour = cdmxDate.getHours();



        console.log(`[Webhook] Mensaje recibido de ${from}: "${text}"`);
        
        // Recuperar el estado ANTES de guardar el nuevo mensaje para poder evaluar correctamente si es una conversación nueva o inactiva
        const previousChatState = await getChatState(from);
        
        // Guardar mensaje del cliente en el historial en Sheets
        await saveChatMessage(from, 'client', text);
        
        // 1. Check current state and chat history in Sheets
        console.log(`[Webhook] Buscando estado en Google Sheets para ${from}...`);
        let chat = await getChatState(from);
        console.log(`[Webhook] Estado recuperado:`, chat);

        // Deserializar historial para inyectar como memoria a Gemini
        let historyPromptText = "";
        if (chat && chat.chatHistory) {
            try {
                const historyList = JSON.parse(chat.chatHistory);
                if (Array.isArray(historyList) && historyList.length > 0) {
                    historyPromptText = "\n\nHISTORIAL DE CONVERSACIÓN RECIENTE (ÚSALO COMO MEMORIA DE LO QUE SE HA DICHO):\n";
                    // Tomamos los últimos 12 mensajes para mantener el prompt eficiente
                    const recentMsgs = historyList.slice(-12);
                    for (const msg of recentMsgs) {
                        const roleName = msg.sender === 'client' ? 'Cliente' : (msg.sender === 'assistant' ? 'Mariana (Tú)' : 'Asesor Humano (CarMD)');
                        historyPromptText += `[${msg.timestamp || ''}] ${roleName}: "${msg.text}"\n`;
                    }
                }
            } catch (e) {
                console.error("Error parsing chat history for prompt:", e);
            }
        }

        // --- COMMAND: ENTER ADMIN MODE ---
        if (textLower === 'carmd admin' || textLower === 'carmd-admin') {
            console.log(`[Admin Mode] Activando canal administrativo persistente para ${from}...`);
            const adminWelcome = `🔑 *MODO ADMINISTRADOR ACTIVADO*\n\n¡Hola, Brian/Rafael! Has entrado al canal de consulta interna de CarMD.\n\nA partir de este momento me comunicaré contigo de forma ejecutiva. Puedes preguntarme cosas casuales sobre el expediente o historial de cualquier vehículo usando sus placas.\n\n👉 *Ejemplo*: "oye búscame qué le hicieron al coche placas PCH2668"\n\n*(Escribe "salir" o "modo cliente" para volver al chat estándar de clientes)*`;
            await sendWhatsAppMessage(from, adminWelcome);
            await saveChatMessage(from, 'assistant', adminWelcome);
            await updateChatState(from, 'ADMIN_MODE_IA');
            return;
        }

        // --- COMMAND: EXIT ADMIN MODE ---
        if (chat?.state === 'ADMIN_MODE_IA' && (textLower === 'salir' || textLower === 'modo cliente')) {
            console.log(`[Admin Mode] Desactivando canal administrativo para ${from}...`);
            const exitMsg = `👋 *MODO ADMINISTRADOR DESACTIVADO*\n\nCanal restaurado al flujo estándar de atención al cliente. ¡Bonito día!`;
            await sendWhatsAppMessage(from, exitMsg);
            await saveChatMessage(from, 'assistant', exitMsg);
            await updateChatState(from, 'COMPLETED');
            return;
        }

        // --- HANDLE ADMIN MODE QUERIES ---
        if (chat?.state === 'ADMIN_MODE_IA') {
            console.log(`[Admin Mode] Procesando consulta casual en canal administrativo: "${text}"`);
            
            // Extraer placa semánticamente de la plática
            let plate = 'NONE';
            try {
                const extractPlatePrompt = `Analiza esta consulta del administrador de CarMD: "${text}".
                Extrae la placa del vehículo mencionada (ej: "PCH2668", "ABCD1234").
                Responde ÚNICAMENTE con la placa limpia y en mayúsculas, sin texto extra. Si no hay placas en el mensaje, responde "NONE".`;
                
                const plateRes = await generateTextWithFallback(
                    extractPlatePrompt,
                    { temperature: 0.1 }
                );
                plate = plateRes.text?.trim().toUpperCase() || 'NONE';
            } catch (e) {
                console.error("[Admin Mode] Error al extraer placa de consulta casual:", e);
            }

            if (plate === 'NONE') {
                // Si el administrador pregunta algo general sin placa, responder amablemente con la IA
                const generalAdminPrompt = `Eres Mariana, asistente de CarMD, y estás hablando directamente con tu jefe (Brian/Rafael, administradores del taller) en el modo administrador.
                El jefe te escribió: "${text}". 
                Respóndele de forma muy atenta, ejecutiva y amigable, recordándole que puedes buscar cualquier expediente de auto si te proporciona su placa.`;
                
                const genRes = await generateTextWithFallback(
                    generalAdminPrompt,
                    { temperature: 0.3 }
                );
                const reply = genRes.text?.trim() || "Dime las placas del vehículo para buscar su expediente.";
                await sendWhatsAppMessage(from, reply);
                await saveChatMessage(from, 'assistant', reply);
                return;
            }

            console.log(`[Admin Mode] Placa identificada: ${plate}. Consultando expediente...`);
            try {
                const baseUrl = process.env.NODE_ENV === 'production' 
                    ? `https://${req.headers.get('host')}` 
                    : 'http://localhost:3000';

                const searchRes = await fetch(`${baseUrl}/api/os/history/search?q=${plate}`);
                if (!searchRes.ok) throw new Error("Failed to query history search API");

                const searchData = await searchRes.json();
                if (!searchData.found || searchData.entries.length === 0) {
                    const failMsg = `⚠️ *CarMD Admin Info*:\nNo encontré ningún registro en el Centro de Servicio (ni Notas ni Inventario) con las placas *${plate}*.`;
                    await sendWhatsAppMessage(from, failMsg);
                    await saveChatMessage(from, 'assistant', failMsg);
                    return;
                }

                const notesList = searchData.entries
                    .filter((e: any) => e.type === 'note')
                    .map((e: any) => ({
                        folio: e.folio,
                        date: e.dateDisplay,
                        km: e.vehicle?.km || '—',
                        total: e.pricing?.total || 0,
                        services: e.services?.join(', ') || 'Servicio de mantenimiento'
                    }));

                const inventoryList = searchData.entries
                    .filter((e: any) => e.type === 'inventory')
                    .map((e: any) => ({
                        date: e.dateDisplay,
                        km: e.vehicle?.km || '—',
                        motivo: e.motivoIngreso || 'Diagnóstico general'
                    }));

                const reportPrompt = `Genera un resumen administrativo sumamente ejecutivo y estructurado para el dueño del taller (Brian/Rafael) con la siguiente información de placas ${plate}:
                - Cliente: ${searchData.client.name} (WhatsApp: ${searchData.client.phone})
                - Auto: ${searchData.vehicle.brand} ${searchData.vehicle.model} (${searchData.vehicle.year})
                - Kilometraje actual/estimado: ${searchData.vehicle.km} KM
                - Historial de Notas de Servicio (Total encontradas: ${notesList.length}):
                  ${JSON.stringify(notesList)}
                - Historial de Inventarios/Entradas (Total encontradas: ${inventoryList.length}):
                  ${JSON.stringify(inventoryList)}
                
                Describe con precisión cuál fue el último servicio mecánico realizado, cuándo fue, y a qué kilometraje. Usa emojis y viñetas ejecutivas para su rápida lectura en el celular.`;

                const reportRes = await generateTextWithFallback(
                    reportPrompt,
                    { temperature: 0.2 }
                );

                const finalReport = `📊 *EXPEDIENTE DEL VEHÍCULO (${plate})*\n\n${reportRes.text?.trim()}`;
                await sendWhatsAppMessage(from, finalReport);
                await saveChatMessage(from, 'assistant', finalReport);
            } catch (err) {
                console.error("[Admin Mode] Error en consulta de base de datos completa:", err);
                const errNotify = `❌ *Error administrativo*:\nOcurrió un error al consultar las notas e inventario para la placa *${plate}*. Por favor inténtalo de nuevo.`;
                await sendWhatsAppMessage(from, errNotify);
            }
            return;
        }

        // Alerta de actividad para los administradores (sesión nueva o reanudada tras 1 hora de inactividad)
        let shouldAlertAdmins = false;
        let adminNotifyText = "";



        if (!previousChatState) {
            shouldAlertAdmins = true;
            adminNotifyText = `📢 *NUEVA CONVERSACIÓN INICIADA*\n\nEl número +${from} ha iniciado un chat con Mariana (IA).\n\nPuedes monitorear y gestionar la conversación en tiempo real desde tu Portal:\n👉 carmd.com.mx/os/chats`;
        } else {
            const lastUpdateMs = new Date(previousChatState.lastUpdate || 0).getTime();
            const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hora en milisegundos
            if (lastUpdateMs < oneHourAgo) {
                shouldAlertAdmins = true;
                adminNotifyText = `🔁 *ACTIVIDAD EN CHAT REANUDADA*\n\nEl cliente +${from} ha vuelto a escribir después de más de 1 hora de inactividad.\n\nPuedes ver la conversación en tiempo real en tu Portal:\n👉 carmd.com.mx/os/chats`;
            }
        }

        if (shouldAlertAdmins) {
            console.log(`[Webhook] Alerta de actividad en chat para administradores. Enviando...`);
            
            // Enviar alerta a Rafael (COMENTADO TEMPORALMENTE PARA PRUEBAS)
            /*
            try {
                await sendWhatsAppMessage(rafaPhone, adminNotifyText);
            } catch (e) {
                console.error("Error al alertar a Rafael sobre actividad:", e);
            }
            */

            // Enviar alerta a Mamá (COMENTADO TEMPORALMENTE PARA PRUEBAS)
            /*
            try {
                await sendWhatsAppMessage(momPhone, adminNotifyText);
            } catch (e) {
                console.error("Error al alertar a Mamá sobre actividad:", e);
            }
            */

            // Enviar alerta a Brian
            try {
                await sendWhatsAppMessage(brianPhone, adminNotifyText);
            } catch (e) {
                console.error("Error al alertar a Brian sobre actividad:", e);
            }
        }

        // If the state is HUMAN_REQUIRED, the bot stays silent and doesn't auto-respond.
        if (chat?.state === 'HUMAN_REQUIRED') {
            console.log(`[Webhook] Chat en estado HUMAN_REQUIRED para ${from}. Bot silenciado.`);
            return;
        }

        // Detect if the user wants human intervention, is complaining, or explicitly asks for a human
        const isUrgentOrComplaint = 
            textLower.includes('reclamacion') || 
            textLower.includes('queja') || 
            textLower.includes('quedo mal') ||
            textLower.includes('sigue fallando') || 
            textLower.includes('hablar con el dueño') || 
            textLower.includes('gerente') ||
            textLower.includes('humano') ||
            chat?.state === 'ASKING_NAME_FOR_HUMAN';

        if (isUrgentOrComplaint) {
            console.log(`[Webhook] Solicitud de intervención humana detectada. Evaluando datos antes de transferir...`);
            
            // Intentar extraer el nombre si estamos en el sub-estado o si ya se presentó en el historial
            let clientName = '';
            let vehicleProblemData = chat?.vehicleProblem || '';
            
            try {
                if (vehicleProblemData.startsWith('{')) {
                    const parsed = JSON.parse(vehicleProblemData);
                    clientName = parsed.name || '';
                }
            } catch(e) {}

            // Si no tenemos el nombre en el estado estructurado, intentamos extraerlo semánticamente del historial reciente
            if (!clientName && chat?.state !== 'ASKING_NAME_FOR_HUMAN') {
                try {
                    const quickExtractPrompt = `Analiza el historial de conversación reciente:
                    ${historyPromptText}
                    
                    Si el usuario ya se presentó o mencionó su nombre y/o su coche (Marca/Modelo/Año), extrae:
                    1. Nombre completo (name)
                    2. Coche (vehicle)
                    
                    Devuelve únicamente un JSON con los campos 'name' y 'vehicle'. Si no los ha proporcionado todavía o falta el nombre, deja los campos como "".`;
                    
                    const quickExtractRes = await generateTextWithFallback(
                        quickExtractPrompt,
                        { temperature: 0.1, responseMimeType: 'application/json' }
                    );
                    
                    const parsedExtract = JSON.parse(quickExtractRes.text?.trim() || '{}');
                    if (parsedExtract.name) {
                        clientName = parsedExtract.name;
                        const tempParams = {
                            name: parsedExtract.name,
                            vehicle: parsedExtract.vehicle || 'No especificado',
                            year: 'N/A',
                            km: 'N/A',
                            plate: 'N/A',
                            date: 'N/A',
                            time: 'N/A',
                            problem: 'Solicitud directa de Asesor Humano en chat'
                        };
                        vehicleProblemData = JSON.stringify(tempParams);
                        console.log(`[Redirection] Extracción semántica exitosa del historial para humano: ${clientName}`);
                    }
                } catch (e) {
                    console.error("Error en extracción rápida de datos para humano:", e);
                }
            }
 
            // Si después de buscar en el historial seguimos sin tener su nombre registrado
            if (!clientName && chat?.state !== 'ASKING_NAME_FOR_HUMAN') {
                const askNameMessage = `Entiendo perfectamente tu molestia y te pido una disculpa. 📞 Para nada es nuestra intención quitar el trato humano ni la cercanía contigo; de hecho, usamos este asistente virtual solo para agilizar los datos y poder ayudarte mucho más rápido.\n\nPara pasarte de inmediato con uno de nuestros asesores y que sepa con quién se comunicará, ¿me podrías compartir tu *Nombre completo* y qué *coche (Marca, Modelo y Año)* tienes? 😊`;
                
                await sendWhatsAppMessage(from, askNameMessage);
                await saveChatMessage(from, 'assistant', askNameMessage);
                
                // Guardamos el estado temporal para esperar el nombre
                const tempParams = { name: '', vehicle: '', phone: from };
                await updateChatState(from, 'ASKING_NAME_FOR_HUMAN', JSON.stringify(tempParams));
                return;
            }

            // Si el cliente nos está respondiendo con los datos en el estado temporal
            if (chat?.state === 'ASKING_NAME_FOR_HUMAN') {
                // Usar Gemini en temperatura baja para extraer nombre y carro de su respuesta molesta
                let extractedName = '';
                let extractedCar = '';
                try {
                    const extractPrompt = `Analiza la respuesta del usuario: "${text}".
                    El usuario está molesto y nos está dando su Nombre y/o su coche (Marca/Modelo/Año) para hablar con un humano.
                    Extrae:
                    1. Nombre completo (name)
                    2. Coche (vehicle)
                    
                    Devuelve únicamente un JSON con los campos 'name' y 'vehicle'.`;
                    
                    const extractRes = await generateTextWithFallback(
                        extractPrompt,
                        { temperature: 0.1 }
                    );
                    
                    const cleanJson = extractRes.text?.replace(/```json|```/g, '').trim() || '{}';
                    const parsed = JSON.parse(cleanJson);
                    extractedName = parsed.name || text.split(',')[0].trim();
                    extractedCar = parsed.vehicle || 'No especificado';
                } catch(e) {
                    extractedName = text.trim();
                }

                clientName = extractedName;
                const tempParams = { 
                    name: extractedName, 
                    vehicle: extractedCar,
                    year: 'N/A',
                    km: 'N/A',
                    plate: 'N/A',
                    date: 'N/A',
                    time: 'N/A',
                    problem: 'Solicitud directa de Asesor Humano'
                };
                vehicleProblemData = JSON.stringify(tempParams);
            }

            // Mensaje de despedida personalizado con su nombre
            const greeting = clientName ? `Muchas gracias, ${clientName}. ` : '';
            const apologyMessage = `${greeting}📞 Por favor espera un momento; un asesor de nuestro equipo en CarMD se comunicará contigo personalmente a la brevedad en este mismo chat para atender tu solicitud. Detendré mis respuestas automáticas por aquí.`;
            
            await sendWhatsAppMessage(from, apologyMessage);
            await saveChatMessage(from, 'assistant', apologyMessage);
            await updateChatState(from, 'HUMAN_REQUIRED', vehicleProblemData);

            // Enviar alerta de intervención humana requerida al administrador (Brian)
            try {
                const adminAlertMsg = `⚠️ *INTERVENCIÓN HUMANA REQUERIDA*\n\nEl cliente +${from} (*${clientName || 'Sin Nombre'}*) requiere atención humana directa en el chat por solicitud/molestia.\n\nPor favor atiende el chat en tu Portal:\n👉 carmd.com.mx/os/chats`;
                await sendWhatsAppMessage(brianPhone, adminAlertMsg);
                console.log("[Webhook] Alerta de intervención humana enviada al administrador.");
            } catch (e) {
                console.error("Error al alertar a Brian sobre intervención humana:", e);
            }
            return;
        }

        const isAIState = chat?.state?.endsWith('_IA') || false;
        const wantsAITest = textLower.includes('prueba ia');
        const wantsAppointmentTest = textLower.includes('prueba cita ia');

        // Check if we should trigger the Interactive Appointment Collection via manual command
        if (wantsAppointmentTest) {
            console.log("[Webhook] Modo Cita IA interactiva activado por comando.");
            const welcomeMsg = `¡Hola! 👋 Soy tu asistente de CarMD. Vamos a agendar tu cita de diagnóstico directamente por aquí. 🚗\n\nPara comenzar, ¿me podrías compartir tu *Nombre completo* y un *Correo electrónico* para enviarte tu confirmación? 📋`;
            await sendWhatsAppMessage(from, welcomeMsg);
            await updateChatState(from, 'COLLECTING_APPOINTMENT_IA', JSON.stringify({ phone: from }));
            return;
        }

        // --- Handle Step-by-Step Appointment Data Collection (Semantic & Interactive) ---
        if (chat?.state === 'COLLECTING_APPOINTMENT_IA') {
            console.log("[Webhook] Procesando recolección semántica de cita...");

            // Recuperar datos acumulados del JSON temporal en Sheets
            let tempParams: any = {};
            try {
                if (chat.vehicleProblem && chat.vehicleProblem.startsWith('{')) {
                    tempParams = JSON.parse(chat.vehicleProblem);
                }
            } catch (e) {}

            // Prompt unificado para que Gemini piense, extraiga datos y responda en una sola llamada estructurada
            const assistantInstruction = `${SYSTEM_PROMPT}

FECHA Y HORA ACTUAL DE REFERENCIA: ${cdmxTimeStr}. HOY ES DÍA: ${dayName.toUpperCase()}. AÑO ACTUAL: ${nowObj.getFullYear()}. (CALCULO DE CALENDARIO OBLIGATORIO: Verifica siempre qué día de la semana cae numéricamente en el calendario de ${nowObj.getFullYear()}. Recuerda que los domingos el Centro de Servicio está CERRADO).

REGLAS DE RECOLECCIÓN DE CITA (MODO INTERACTIVO):
- Estás en un proceso activo de registro de cita para el cliente con teléfono: ${from}.
- Los datos acumulados hasta el momento en tu memoria son: ${JSON.stringify(tempParams)}.
- El cliente te acaba de escribir: "${text}".
- Tu tarea es analizar el mensaje del cliente y devolver UN ÚNICO OBJETO JSON con la siguiente estructura exacta:
{
  "pensamiento_interno": "Razonamiento detallado paso a paso. Si el cliente menciona un día y fecha (ej: 'Jueves 25 de julio'), CALCULA AQUÍ EN TU MENTE: ¿El 25 de julio de ${nowObj.getFullYear()} cae en Jueves? Si NO cae en jueves, escribe explícitamente: 'DISCREPANCIA DETECTADA: el 25 de julio no es jueves, es sábado (o el jueves es 23)'.",
  "respuesta_whatsapp": "Tu respuesta amigable para enviar al cliente por WhatsApp (usa emojis, doble salto de línea para separar párrafos).",
  "datos_actualizados": {
    "name": "...",
    "email": "...",
    "vehicle": "...",
    "year": "...",
    "km": "...",
    "plate": "...",
    "date": "...",
    "time": "...",
    "problem": "..."
  },
  "cita_lista_para_resumen": false,
  "cliente_confirmo_resumen": false
}

REGLAS PARA EL JSON ESTRICTO:
1. 'respuesta_whatsapp': 
    - SALUDO OBLIGATORIO: Si el mensaje del cliente incluye un saludo ("hola", "ola", "buenos días", "buenas tardes"), o si es el primer mensaje de la conversación, INICIA SIEMPRE saludando amablemente a tu cliente (ej: "¡Hola! Con mucho gusto te ayudo a agendar la afinación para tu Sentra...").
    - Debe resolver cualquier duda del cliente basándose en el manual de CarMD.
    - Si falta algún dato ("..."), pide amablemente un dato a la vez. No pidas todo de golpe.
    - Integra un dato curioso del auto justo después de confirmar el vehículo por primera vez.
    - Si detectas spam o juego sin fin, incluye aquí tu mensaje final despidiéndote e incluyendo exactamente la frase: "dejaré la conversación hasta aquí".
    - NUNCA escribas o dibujes la ficha/caja de resumen de la cita en tu 'respuesta_whatsapp'. El sistema la anexará automáticamente. Tu 'respuesta_whatsapp' debe ser únicamente de texto conversacional y de bienvenida, aclarar dudas o dar respuestas, pero JAMÁS debe tener la lista de datos estructurados de la cita (como Nombre:, Correo:, Vehículo:, etc.), de lo contrario se duplicará.
    - Si el cliente menciona que ya es cliente de CarMD o pregunta por su historial/expediente de mantenimiento o servicios pasados: En el PRIMER mensaje, dile amablemente que por seguridad no ves su historial por chat, dale las 2 opciones (asesor o agendar) y PÍDELE ÚNICAMENTE las *placas de su vehículo*. En el SEGUNDO mensaje (cuando da la placa), el backend buscará automáticamente en la base de datos la placa. Si el sistema encuentra los datos del cliente y su auto (campo 'name' distinto de '...'), salúdalo amablemente por su nombre (ej: "¡Gracias, Marco Antonio!"), confirma su vehículo (ej: "Encontré tu expediente registrado para tu Hyundai Elantra 2019...") e indícale que el equipo de asesores ya tiene su recado. Si las placas no se encuentran en la base de datos (campo 'name' en '...'), pídele amablemente su nombre completo y modelo de auto. NUNCA uses la frase "Detendré mis respuestas automáticas" ni intentes desactivarte.
 2. 'datos_actualizados':
    - Combina la memoria acumulada con la nueva información dada por el cliente en este turno.
    - Si un dato no se ha proporcionado, déjalo estrictamente como "..." (tres puntos).
    - NOMBRE: Limpia y normaliza el campo 'name'. Elimina espacios en blanco innecesarios o entre letras individuales (ej: si el cliente escribe "J U A N  P E R E Z", límpialo y guárdalo estrictamente como "Juan Perez"). Capitaliza las iniciales correctamente.
    - FECHAS Y HORAS: Solo actualiza 'date' (YYYY-MM-DD) y 'time' (ej. 8:00 AM) si el cliente confirma explícitamente su elección y LA FECHA ES VÁLIDA. Si el cliente solo pregunta por disponibilidad, mantén el dato como "...". CRÍTICO / DISCREPANCIA DE CALENDARIO: Si el cliente proporciona una fecha donde el día de la semana y el número de día del mes NO coinciden en el calendario de ${nowObj.getFullYear()} (ej: dice "Jueves 25 de julio" cuando en ${nowObj.getFullYear()} el 25 de julio es SÁBADO y el jueves es 23), NO asumas la fecha directamente ni inventes una; MANTÉN el campo 'date' estrictamente como "...", pon 'cita_lista_para_resumen' en false, y PREGÚNTALE amablemente en tu respuesta para aclarar la confusión (ej: "Disculpa, el próximo jueves cae en 23 de julio y el sábado cae en 25 de julio, ¿cuál de los dos días prefieres agendar tu cita?").
    - KILOMETRAJE: Debe ser puramente numérico (ej: 20000). Si el cliente no sabe, guarda "Pendiente".
    - VEHÍCULO (INTUICIÓN DE MARCA): Si el cliente te da un modelo de auto muy conocido pero no te dice la marca (ej: "Jetta", "Prius", "Sentra", "Civic", "Corolla", "Mustang"), tú debes deducir la marca automáticamente y guardarla en el campo 'vehicle' junto con el modelo (ej: "Volkswagen Jetta", "Toyota Prius", "Nissan Sentra"). No le preguntes al cliente la marca si la puedes deducir con certeza. Sin embargo, si el cliente da la marca pero NO el modelo (ej: "un BMW" o "un Ford"), mantén el campo 'vehicle' como "..." y pregúntale amablemente qué modelo específico es.
    - HORARIOS VÁLIDOS: L-V de 8:00 AM a 4:30 PM, Sáb de 8:00 AM a 1:30 PM. No agendes fuera de este horario ni en domingo. Excepción: si el cliente pregunta explícitamente por la hora "más temprana" posible, ofrécele las 7:45 AM. CRÍTICO: Si el cliente solicita una hora fuera de los límites permitidos (ej: L-V después de las 4:30 PM, o Sábado después de las 1:30 PM como a las "1:45 PM"), NO asumas la hora directamente; mantén el campo 'time' como "...", pon 'cita_lista_para_resumen' en false, y explícale amablemente en tu respuesta para ofrecerle alternativas dentro del horario (ej: "Disculpa, nuestro último horario de recepción los sábados es a la 1:30 PM para asegurar el diagnóstico antes del cierre. ¿Te vendría bien a la 1:30 PM o qué otra hora prefieres?").
    - PROBLEMA O MOTIVO DE CITA: El campo 'problem' debe contener únicamente fallas mecánicas reales (ej: "ruido en frenos", "se calienta") o servicios de mantenimiento solicitados (ej: "afinación", "cambio de aceite", "revisión general"). Si el cliente solo menciona la palabra "cita", "agendar", "visita" o "registro" pero NO especifica qué le pasa al carro ni qué servicio quiere, deja el campo 'problem' estrictamente como "..." (tres puntos) para que le preguntes amablemente qué servicio requiere. NUNCA inventes o autocompletes este campo con frases genéricas como "Cita de servicio" o "Agendar".
 3. 'cita_lista_para_resumen':
    - Pon esto en \`true\` SOLAMENTE si el objeto 'datos_actualizados' ya NO tiene ningún campo en "..." (es decir, ya recolectaste absolutamente todos los 8 datos necesarios) Y el cliente no hizo ninguna pregunta pendiente de responder.
    - Si el cliente te corrigió un dato después de haberle dado el resumen (ej: "mejor cámbialo al jueves a las 3"), actualiza ese dato en 'datos_actualizados', MANTÉN 'cita_lista_para_resumen' en \`true\` (a menos que la corrección sea una fecha con discrepancia en el calendario o una hora fuera de los límites válidos, en cuyo caso pon 'cita_lista_para_resumen' en \`false\` y el campo respectivo como "...") y pon 'cliente_confirmo_resumen' en \`false\`. En tu respuesta redacta algo natural como "¡Claro! He actualizado la fecha."
    - Si esto es \`true\` y el cliente NO ha confirmado explícitamente, tu 'respuesta_whatsapp' debe ser SOLO algo introductorio (ej: "¡Perfecto!" o "¡Claro, he actualizado los datos!"). El sistema automáticamente anexará el resumen al final de tu mensaje.
4. 'cliente_confirmo_resumen':
    - Pon esto en \`true\` ÚNICAMENTE si 'cita_lista_para_resumen' es \`true\` Y el cliente ha confirmado o aceptado de forma CLARA y EXPLÍCITA que el resumen es correcto y desea proceder (ej: "sí", "sí perfecto", "está bien", "adelante").
    - CRÍTICO: Si el cliente dice que sí/confirma pero a la vez realiza una pregunta o manifiesta alguna duda (ej: "sí, está perfecto. Oye, ¿tienen WiFi?"), NO pongas 'cliente_confirmo_resumen' en \`true\`; manténlo en \`false\`, responde a su pregunta/duda detalladamente en tu 'respuesta_whatsapp' y vuelve a pedirle su confirmación al final del mensaje.
    - Si el cliente da una corrección o responde con algo que no es una confirmación afirmativa para proceder, pon esto en \`false\`.

${historyPromptText}

Recuerda: Eres un JSON válido. No uses markdown de código, devuelve únicamente el JSON plano y parseable.`;

            console.log("[Webhook] Llamando a Gemini para procesar respuesta y extracción (Single-Call JSON)...");
            let structuredOutput: any = {};
            try {
                const response = await generateTextWithFallback(
                    "Analiza el mensaje del cliente y devuelve el objeto JSON requerido.",
                    {
                        systemInstruction: assistantInstruction,
                        temperature: 0.2,
                        responseMimeType: 'application/json',
                    }
                );

                const rawJsonText = response.text?.trim() || "{}";
                structuredOutput = JSON.parse(rawJsonText);
            } catch (e) {
                console.error("[Webhook] Error parseando salida estructurada de Gemini:", e);
                // Fallback de seguridad en caso de error crítico
                structuredOutput = {
                    pensamiento_interno: "Error parseando.",
                    respuesta_whatsapp: "Una disculpa, tuve un pequeño contratiempo técnico. ¿Podrías repetirme tu último mensaje?",
                    datos_actualizados: tempParams,
                    cita_lista_para_resumen: false
                };
            }

            console.log(`[Webhook] Pensamiento Interno de IA: "${structuredOutput.pensamiento_interno}"`);
            
            let replyText = structuredOutput.respuesta_whatsapp || "";
            const aiSentSummaryReadyTag = structuredOutput.cita_lista_para_resumen === true;
            
            console.log(`[Webhook] Respuesta IA generada: "${replyText}" (Cita lista para resumen: ${aiSentSummaryReadyTag})`);

            // Helper function to send messages sequentially in bubbles
            const sendInBubbles = async (recipient: string, rawText: string) => {
                if (!rawText) return;
                // Split by double line breaks (paragraphs)
                const bubbles = rawText.split('\n\n').map(b => b.trim()).filter(b => b.length > 0);
                for (let i = 0; i < bubbles.length; i++) {
                    await sendWhatsAppMessage(recipient, bubbles[i]);
                    if (i < bubbles.length - 1) {
                        // Wait 1.2 seconds between bubbles to simulate human typing
                        await new Promise(resolve => setTimeout(resolve, 1200));
                    }
                }
            };

            // Combinar parámetros inteligentemente (sin sobreescribir con valores nulos o vacíos del extractor silencioso)
            const extracted = structuredOutput.datos_actualizados || {};
            const mergedParams = { ...tempParams };
            for (const key of Object.keys(extracted)) {
                if (extracted[key] && extracted[key] !== '...' && extracted[key] !== '') {
                    mergedParams[key] = extracted[key];
                }
            }

            // BÚSQUEDA AUTOMÁTICA EN MÁSTER (TODOS): Si hay placa pero falta Nombre o Vehículo
            if (mergedParams.plate && mergedParams.plate !== '...' && mergedParams.plate !== 'NONE') {
                if (!mergedParams.name || mergedParams.name === '...' || !mergedParams.vehicle || mergedParams.vehicle === '...') {
                    try {
                        const masterMatch = await lookupVehicleInMasterByPlate(mergedParams.plate);
                        if (masterMatch && masterMatch.found) {
                            if (!mergedParams.name || mergedParams.name === '...') {
                                mergedParams.name = masterMatch.name;
                            }
                            if (!mergedParams.vehicle || mergedParams.vehicle === '...') {
                                mergedParams.vehicle = masterMatch.vehicle;
                            }
                            console.log(`[Webhook Master Match] Placa "${mergedParams.plate}" vinculada automáticamente con Nombre="${masterMatch.name}", Vehículo="${masterMatch.vehicle}"`);
                        }
                    } catch (e) {
                        console.error("Error al vincular placa con Máster Sheet:", e);
                    }
                }
            }

            // Responder al cliente en burbujas y guardar progreso temporal
            // Validación: ¿Ya tenemos todos los datos clave completos para presentar el resumen?
            let hasRequiredFieldsForSummary = structuredOutput.cita_lista_para_resumen === true &&
                                              mergedParams.name && mergedParams.name !== '...' &&
                                              mergedParams.vehicle && mergedParams.vehicle !== '...' &&
                                              mergedParams.problem && mergedParams.problem !== '...' &&
                                              mergedParams.date && mergedParams.date !== '...' && 
                                              !(typeof mergedParams.date === 'string' && mergedParams.date.toLowerCase().includes('temprano')) &&
                                              mergedParams.time && mergedParams.time !== '...' && 
                                              !(typeof mergedParams.time === 'string' && mergedParams.time.toLowerCase().includes('temprano')) &&
                                              !(typeof mergedParams.time === 'string' && mergedParams.time.toLowerCase().includes('disponible'));

            // VALIDACIÓN CRÍTICA DE DOMINGO: Si la fecha contiene la palabra "domingo", bloqueamos el resumen
            if (hasRequiredFieldsForSummary && typeof mergedParams.date === 'string' && mergedParams.date.toLowerCase().includes('domingo')) {
                hasRequiredFieldsForSummary = false;
                const clientName = mergedParams.name && mergedParams.name !== '...' ? mergedParams.name : '';
                replyText = `Disculpa la confusión${clientName ? `, ${clientName}` : ''}. 🗓️ Los domingos nuestro Centro de Servicio está cerrado para descansar. \n\nEstamos listos para recibir tu auto de lunes a viernes de 8:00 AM a 5:00 PM y sábados de 8:00 AM a 2:00 PM. ¿Qué otro día y hora te vendría bien? 😊`;
                // Removemos la fecha inválida de los parámetros acumulados
                mergedParams.date = '...';
                mergedParams.time = '...';
            }

            // DETECTOR DE DERIVACIÓN HUMANA INTELIGENTE (COTIZACIÓN):
            // Si la IA decide derivar por insistencia del costo, verificamos si tenemos los datos necesarios
            const isDerivationReply = replyText.includes('cotizar personalmente') || 
                                       replyText.includes('comunicará un miembro') ||
                                       replyText.includes('revisar directamente un asesor') ||
                                       replyText.includes('detendré mis respuestas') ||
                                       replyText.includes('equipo humano recibirá') ||
                                       replyText.includes('asesores humanos') ||
                                       replyText.includes('asesor se comunique') ||
                                       replyText.includes('asesor de nuestro equipo');
            
            if (isDerivationReply) {
                const hasContactInfo = mergedParams.name && mergedParams.name !== '...' &&
                                       mergedParams.vehicle && mergedParams.vehicle !== '...';
                                       
                if (!hasContactInfo) {
                    // Sobreescribimos la respuesta para obligar a pedir los datos restantes antes de derivar
                    replyText = `Entiendo perfectamente. Para darte el costo aproximado y evitar cualquier error con las piezas específicas de tu auto, le pediré a un asesor de nuestro equipo que te cotice personalmente por aquí. \n\nPara tener tu cotización lista, ¿me podrías compartir tu *nombre completo* y qué *coche (Marca, Modelo y Año)* tienes? 📋`;
                } else {
                    // Si ya los tenemos completos, enviamos el mensaje de derivación final y silenciamos
                    const finalDerivationMsg = `Muchas gracias, ${mergedParams.name}. Ya registré tu información y se la he pasado a nuestro asesor. Por favor danos unos minutos; a la brevedad se comunicarán de CarMD contigo por este mismo chat para darte el costo aproximado. Detendré mis respuestas automáticas. ¡Bonito día! 👋`;
                    await sendWhatsAppMessage(from, finalDerivationMsg);
                    await saveChatMessage(from, 'assistant', finalDerivationMsg);
                    await updateChatState(from, 'HUMAN_REQUIRED', JSON.stringify(mergedParams));

                    // Enviar alerta de cotización requerida al administrador (Brian)
                    try {
                        const adminAlertMsg = `⚠️ *INTERVENCIÓN HUMANA REQUERIDA*\n\nEl cliente +${from} (*${mergedParams.name}*) solicita una cotización humana para su vehículo *${mergedParams.vehicle}*.\n\nPor favor atiende el chat en tu Portal:\n👉 carmd.com.mx/os/chats`;
                        await sendWhatsAppMessage(brianPhone, adminAlertMsg);
                        console.log("[Webhook] Alerta de cotización enviada al administrador.");
                    } catch (e) {
                        console.error("Error al alertar a Brian sobre cotización humana:", e);
                    }
                    return;
                }
            }

            // Sanitización de Hora de Apertura
            if (mergedParams.time && typeof mergedParams.time === 'string' && (mergedParams.time.toLowerCase() === 'apertura' || mergedParams.time.toLowerCase() === 'lo más temprano' || mergedParams.time.toLowerCase() === 'lo más temprano posible')) {
                mergedParams.time = '8:00 AM';
            }

            if (structuredOutput.cliente_confirmo_resumen === true) {
                console.log(`[Webhook] Cliente confirmó el resumen final. Ejecutando reserva y cerrando chat para ${from}`);
                await updateChatState(from, 'COMPLETED');
                
                try {
                    const baseUrl = process.env.NODE_ENV === 'production' 
                        ? `https://${req.headers.get('host')}` 
                        : 'http://localhost:3000';
                        
                    const reservaPayload = {
                        date: mergedParams.date,
                        time: mergedParams.time,
                        name: mergedParams.name,
                        email: mergedParams.email && mergedParams.email !== '...' ? mergedParams.email : 'N/A',
                        vehicle: mergedParams.vehicle,
                        year: mergedParams.year && mergedParams.year !== '...' ? mergedParams.year : 'N/A',
                        km: mergedParams.km,
                        plate: mergedParams.plate,
                        problem: mergedParams.problem && mergedParams.problem !== '...' ? mergedParams.problem : 'Diagnóstico general',
                        phone: from
                    };
                    
                    const r = await fetch(`${baseUrl}/api/citas/reserve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(reservaPayload)
                    });
                    if (r.ok) console.log("[Webhook] Cita reservada en API");
                } catch (e) {
                    console.error("[Webhook] Excepción /api/citas/reserve:", e);
                }
                
                const dayOfWeekNum = cdmxDate.getDay();
                let isNightTime = false;
                let nightNote = '';

                if (dayOfWeekNum === 0) {
                    isNightTime = true;
                    nightNote = `\n\n⚠️ *Nota:* Por el horario actual (domingo), el seguimiento personalizado y la confirmación final por parte de nuestro equipo humano se realizarán a primera hora del día de mañana lunes a partir de las 8:00 AM. ¡Excelente domingo! 🌙`;
                } else if (dayOfWeekNum === 6 && cdmxHour >= 17) {
                    isNightTime = true;
                    nightNote = `\n\n⚠️ *Nota:* Por el horario actual, el seguimiento personalizado y la confirmación final por parte de nuestro equipo humano se realizarán a primera hora del día lunes a partir de las 8:00 AM. ¡Excelente fin de semana! 🌙`;
                } else if (cdmxHour >= 20 || cdmxHour < 8) {
                    isNightTime = true;
                    nightNote = `\n\n⚠️ *Nota:* Por el horario actual, el seguimiento personalizado y la confirmación final por parte de nuestro equipo humano se realizarán a primera hora del día de mañana a partir de las 8:00 AM. ¡Excelente noche! 🌙`;
                }

                let finalMsg = `¡Solicitud recibida! ✔️ En este momento te llegará un correo electrónico con los detalles de tu solicitud de cita. A la brevedad, un asesor de nuestro equipo de CarMD se comunicará contigo por aquí para el seguimiento y confirmación final. ¡Muchas gracias por tu confianza! 🚗💨`;
                
                if (isNightTime) {
                    finalMsg += nightNote;
                }
                
                await sendWhatsAppMessage(from, finalMsg);
                await saveChatMessage(from, 'assistant', finalMsg);
                return;
            } else if (hasRequiredFieldsForSummary) {
                const yearClean = mergedParams.year && mergedParams.year !== '...' ? String(mergedParams.year).trim() : '';
                const vehicleStr = String(mergedParams.vehicle).trim();
                const yearSuffix = yearClean && !vehicleStr.includes(yearClean) ? ` ${yearClean}` : '';
                const vehicleDisplay = `${vehicleStr}${yearSuffix}`;

                let introText = replyText.length > 0 ? `${replyText}\n\n*Por favor, confírmame si los datos de tu cita son correctos para proceder:*` : '¡Listo! Ya tengo toda la información. Por favor confírmame si los datos de tu cita son correctos:\n';
                
                const kmClean = mergedParams.km && mergedParams.km !== '...' ? String(mergedParams.km).trim() : 'Pendiente';
                const kmDisplay = kmClean === 'Pendiente' ? 'Por confirmar a la llegada 🛞' : `${kmClean} KM`;

                const plateClean = mergedParams.plate && mergedParams.plate !== '...' ? String(mergedParams.plate).trim() : 'Pendiente';
                const plateDisplay = plateClean === 'Pendiente' ? 'Por confirmar a la llegada 📋' : plateClean;

                const summaryText = `${introText}
 
👤 *Nombre*: ${mergedParams.name}
📧 *Correo*: ${mergedParams.email && mergedParams.email !== '...' ? mergedParams.email : 'N/A'}
🚗 *Vehículo*: ${vehicleDisplay}
🛞 *Kilometraje*: ${kmDisplay}
📋 *Placas*: ${plateDisplay}
📅 *Fecha*: ${mergedParams.date}
⏰ *Hora*: ${mergedParams.time}
🔧 *Problema*: ${mergedParams.problem || 'Diagnóstico general'}
 
¿Te parece bien si procedo a confirmar tu espacio con estos datos? 👍`;
 
                await sendInBubbles(from, summaryText);
                await saveChatMessage(from, 'assistant', summaryText);
                
                try {
                    const baseUrl = process.env.NODE_ENV === 'production' 
                        ? `https://${req.headers.get('host')}` 
                        : 'http://localhost:3000';
                    await fetch(`${baseUrl}/api/citas/update-status`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: from, status: 'Esperando Confirmación' })
                    });
                } catch (e) {}

                await updateChatState(from, 'COLLECTING_APPOINTMENT_IA', JSON.stringify(mergedParams));
                return;
            }
 
            // Alerta de spam en flujo de cita (silencia a Mariana)
            if (replyText.includes('dejaré la conversación hasta aquí') || replyText.includes('dejaré las respuestas automáticas hasta aquí')) {
                try {
                    const adminSpamAlert = `⚠️ *ALERTA DE SPAM / JUEGO DETECTADA*\n\nEl cliente +${from} parece estar jugando o spameando en el chat.\n\nMariana ha procedido a silenciarse automáticamente. Puedes monitorearlo en tu Portal:\n👉 carmd.com.mx/os/chats`;
                    await sendWhatsAppMessage(brianPhone, adminSpamAlert);
                    console.log("[Webhook] Alerta de spam enviada al administrador y bot silenciado.");
                } catch (e) {
                    console.error("Error al alertar a Brian sobre spam:", e);
                }
                
                await sendInBubbles(from, replyText);
                await saveChatMessage(from, 'assistant', replyText);
                await updateChatState(from, 'HUMAN_REQUIRED', JSON.stringify(mergedParams));
                return;
            }

            // Alerta informativa a Brian sobre solicitud de asesor por expediente (Mariana se mantiene activa)
            if (replyText.toLowerCase().includes('asesor') && (replyText.toLowerCase().includes('expediente') || replyText.toLowerCase().includes('historial') || replyText.toLowerCase().includes('recado') || replyText.toLowerCase().includes('notific') || replyText.toLowerCase().includes('pasé'))) {
                try {
                    const adminAlertMsg = `ℹ️ *SOLICITUD DE ASESOR (HISTORIAL DE VEHÍCULO)*\n\nEl cliente +${from} (*${mergedParams.name || 'Por confirmar'}*) solicita que un asesor revise su expediente para el vehículo *${mergedParams.vehicle || 'Por confirmar'}*.\n\nEl bot continuará activo respondiendo al cliente. Puedes ver el chat en tu Portal:\n👉 carmd.com.mx/os/chats`;
                    await sendWhatsAppMessage(brianPhone, adminAlertMsg);
                    console.log("[Webhook] Alerta informativa enviada al administrador.");
                } catch (e) {
                    console.error("Error al alertar a Brian sobre asesor:", e);
                }
            }

            await sendInBubbles(from, replyText);
            await saveChatMessage(from, 'assistant', replyText);
            await updateChatState(from, 'COLLECTING_APPOINTMENT_IA', JSON.stringify(mergedParams));
            return;
        }
        // --- Handle General AI Mode ---
        console.log("[Webhook] Modo Gemini AI activado por defecto.");

        // --- SISTEMA DE MEMORIA DE CITAS CONFIRMADAS (LLM INTENT ROUTING) ---
        console.log("[Webhook] Clasificando intención del mensaje con Gemini...");
        
        const intentPrompt = `Analiza el siguiente mensaje de un cliente que se comunica por WhatsApp a un Centro de Servicio Automotriz.
Mensaje: "${text}"

Tu tarea es clasificar la intención PRINCIPAL del cliente en una de estas 4 categorías exactas (responde SOLO con la palabra en mayúsculas):
1. REPROGRAMAR: Si el cliente quiere explícitamente cambiar, mover, o corregir la fecha/hora de una cita que ya tiene.
2. CANCELAR: Si el cliente quiere cancelar su cita de forma explícita.
3. RECORDATORIO: Si el cliente pregunta cuándo es su cita, a qué hora, o pide información sobre la cita que ya tiene agendada.
4. GENERAL: Cualquier otra cosa (saludos, preguntas sobre servicios, fallas, cotizaciones, querer agendar una cita nueva desde cero, emojis, stickers, risas [jaja, jeje], texto sin sentido, respuestas cortas, etc.).

REGLA DE SEGURIDAD EXTREMA: Si el mensaje contiene únicamente emojis, risas, palabras cortas casuales (ej: "ok", "va", "gracias") o texto sin sentido, clasifícalo obligatoriamente como GENERAL. NO clasifiques como CANCELAR a menos que el cliente use palabras explícitas de cancelación (ej: "cancela mi cita", "quiero cancelar", "ya no voy a ir").

Respuesta (una sola palabra):`;

        let intent = 'GENERAL';
        try {
            const intentRes = await generateTextWithFallback(
                intentPrompt,
                { temperature: 0.1 }
            );
            intent = intentRes.text?.trim().toUpperCase() || 'GENERAL';
        } catch (e) {
            console.error("[Webhook] Error en clasificador de intención:", e);
        }
        console.log(`[Webhook] Intención clasificada por Gemini: ${intent}`);

        const wantsBookingAction = intent === 'REPROGRAMAR' || intent === 'CANCELAR' || intent === 'RECORDATORIO';

        // Consultar siempre si el cliente tiene una cita activa para inyectar contexto
        let activeCita = null;
        try {
            const baseUrl = process.env.NODE_ENV === 'production' 
                ? `https://${req.headers.get('host')}` 
                : 'http://localhost:3000';

            const bookingRes = await fetch(`${baseUrl}/api/chats/${from}/booking`);
            if (bookingRes.ok) {
                const { cita } = await bookingRes.json();
                if (cita && (cita.estatus === 'Pendiente' || cita.estatus === 'Confirmada')) {
                    activeCita = cita;
                }
            }
        } catch (e) {
            console.error("[Booking Memory] Error al consultar cita activa:", e);
        }

        if (wantsBookingAction && activeCita) {
            console.log(`[Webhook] Cliente ${from} solicita acción sobre cita (${intent}). Cita activa encontrada:`, activeCita);
            
            const isReschedule = intent === 'REPROGRAMAR';
            const isCancel = intent === 'CANCELAR';
            const isQuery = intent === 'RECORDATORIO';

            if (isQuery) {
                // Responder con la confirmación de su cita activa
                const reminderMsg = `¡Hola, ${activeCita.name}! 😊 Claro, con gusto te confirmo los detalles de tu cita agendada en nuestro Centro de Servicio:\n\n📅 *Fecha*: ${activeCita.date}\n⏰ *Hora*: ${activeCita.time}\n🚗 *Auto*: ${activeCita.vehicle} (${activeCita.year})\n📋 *Placas*: ${activeCita.plate}\n🔧 *Problema*: ${activeCita.problem}\n\n¡Te esperamos! Si necesitas hacer algún cambio o tienes dudas, avísame. 👍`;
                await sendWhatsAppMessage(from, reminderMsg);
                await saveChatMessage(from, 'assistant', reminderMsg);
                return;
            }

            if (isReschedule) {
                // Cargar de vuelta los parámetros acumulados para iniciar la reprogramación
                const restoreParams = {
                    name: activeCita.name,
                    email: activeCita.email,
                    vehicle: activeCita.vehicle,
                    year: activeCita.year,
                    km: activeCita.km,
                    plate: activeCita.plate,
                    problem: activeCita.problem,
                    date: '...', // Reset para pedir fecha nueva
                    time: '...'  // Reset para pedir hora nueva
                };

                const rescheduleMsg = `¡Hola, ${activeCita.name}! Claro que sí, con mucho gusto podemos reprogramar tu espacio en el Centro de Servicio. 🗓️\n\nTu cita actual está agendada para el *${activeCita.date}* a las *${activeCita.time}*.\n\n¿Para qué nuevo día y hora de lunes a sábado te gustaría agendar? 😊`;
                await sendWhatsAppMessage(from, rescheduleMsg);
                await saveChatMessage(from, 'assistant', rescheduleMsg);
                await updateChatState(from, 'COLLECTING_APPOINTMENT_IA', JSON.stringify(restoreParams));
                return;
            }

            if (isCancel) {
                // Actualizar estatus a Cancelada en Sheets
                try {
                    const baseUrl = process.env.NODE_ENV === 'production' 
                        ? `https://${req.headers.get('host')}` 
                        : 'http://localhost:3000';
                    await fetch(`${baseUrl}/api/citas/update-status`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: from, status: 'Cancelada' })
                    });
                } catch (e) {
                    console.error("Error al cancelar cita en Sheets:", e);
                }

                const cancelConfirmMsg = `Entendido, ${activeCita.name}. He cancelado tu cita para el ${activeCita.date} a las ${activeCita.time} con éxito. Si en el futuro necesitas programar de nuevo o requieres ayuda para tu auto, aquí estaré. ¡Que tengas un excelente día! 😊🚗`;
                await sendWhatsAppMessage(from, cancelConfirmMsg);
                await saveChatMessage(from, 'assistant', cancelConfirmMsg);
                await updateChatState(from, 'COMPLETED');
                return;
            }
        }

        let systemInstruction = SYSTEM_PROMPT;
        if (activeCita) {
            systemInstruction += `\n\nCONTEXTO IMPORTANTE: El cliente YA TIENE una cita agendada en el sistema (Nombre: ${activeCita.name}, Auto: ${activeCita.vehicle} ${activeCita.year}, Placas: ${activeCita.plate}, Fecha: ${activeCita.date} a las ${activeCita.time}).
Si el cliente hace preguntas generales, solicita costos o tiene dudas sobre cómo llegar, NO le vuelvas a pedir su nombre ni los datos de su vehículo porque ya los tienes en tu memoria. Simplemente responde su duda basándote en el manual de CarMD, o si no sabes la respuesta o es una cotización de costos específica, indícale amablemente que el asesor humano de CarMD que se comunicará con él para confirmar la cita le podrá resolver esa duda sin problema.`;
        }
        systemInstruction += `\n\nFECHA Y HORA ACTUAL DE REFERENCIA: ${cdmxTimeStr}. HOY ES DÍA: ${dayName.toUpperCase()}. (Calcula correctamente el día de la semana relativo a hoy: si hoy es ${dayName}, mañana es el siguiente día. Recuerda que los domingos el Centro de Servicio está CERRADO).
${historyPromptText}`;
        
        let nextState = 'WAITING_PROBLEM_IA';
        const currentState = chat?.state || 'START';

        if (currentState === 'COMPLETED' || currentState === 'START' || wantsAITest) {
            // First AI interaction or reset
            nextState = 'WAITING_PROBLEM_IA';
        } else if (currentState === 'WAITING_PROBLEM_IA') {
            systemInstruction += `\nEl usuario ya saludó previamente y ahora te está describiendo el problema de su auto o haciendo preguntas específicas. Responde de acuerdo al manual de CarMD y pídele registrarse en carmd.com.mx/citas.`;
            nextState = 'WAITING_FORM_IA';
        } else if (currentState === 'WAITING_FORM_IA') {
            systemInstruction += `\nEl usuario ya recibió el link de citas pero sigue chateando. Responde sus dudas amablemente y recuérdale con tacto completar su registro en carmd.com.mx/citas para asegurar su lugar.`;
            nextState = 'WAITING_FORM_IA';
        }

        // Instructions to trigger semantic appointment collection
        systemInstruction += `\nREGLA ADICIONAL DE CITA: Si el usuario menciona que quiere agendar, registrar su auto, hacer una cita o traer su auto al Centro de Servicio, debes responder amablemente que registrarás sus datos directamente por aquí para su comodidad, pidiéndole su Nombre completo y Correo, y obligatoriamente debes terminar tu respuesta exacta con la etiqueta: [TRIGGER_APPOINTMENT]`;

        // Generate response with Gemini
        console.log(`[Webhook] Generando respuesta de Gemini...`);
        const response = await generateTextWithFallback(
            text,
            {
                systemInstruction: systemInstruction,
                temperature: 0.3,
            }
        );

        let replyText = response.text || "Hola. Para poder ayudarte a agendar tu cita, por favor ingresa a carmd.com.mx/citas y completa el registro.";
        console.log(`[Webhook] Respuesta generada por IA: "${replyText}"`);

        // Helper segmentador local para el modo general
        const sendInBubblesGeneral = async (recipient: string, rawText: string) => {
            const bubbles = rawText.split('\n\n').map(b => b.trim()).filter(b => b.length > 0);
            for (let i = 0; i < bubbles.length; i++) {
                await sendWhatsAppMessage(recipient, bubbles[i]);
                if (i < bubbles.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1200));
                }
            }
        };

        // Intercept semantic trigger
        if (replyText.includes('[TRIGGER_APPOINTMENT]')) {
            console.log("[Webhook] Disparador semántico [TRIGGER_APPOINTMENT] detectado. Pasando a estado COLLECTING_APPOINTMENT_IA.");
            replyText = replyText.replace('[TRIGGER_APPOINTMENT]', '').trim();
            await sendInBubblesGeneral(from, replyText);
            await saveChatMessage(from, 'assistant', replyText);
            
            // Intentar extraer el problema inicial si el usuario lo mencionó en su saludo/pregunta
            let initialProblem = '...';
            if (currentState === 'WAITING_PROBLEM_IA' && chat?.vehicleProblem) {
                initialProblem = chat.vehicleProblem; // Guardar el problema que describió al inicio
            } else {
                try {
                    const probPrompt = `Analiza este primer mensaje del cliente: "${text}".
                    Extrae SOLAMENTE la falla mecánica o servicio que solicita (ej: "afinar", "ruido en frenos", "tira aceite").
                    Si el mensaje son puros saludos, halagos o preguntas generales sin mencionar un problema en el auto, responde exactamente con 3 puntos: ...`;
                    
                    const probRes = await generateTextWithFallback(
                        probPrompt,
                        { temperature: 0.1 }
                    );
                    initialProblem = probRes.text?.trim() || '...';
                    if (initialProblem.length > 60) initialProblem = '...'; // Fallback de seguridad
                } catch(e) {
                    initialProblem = '...';
                }
            }

            await updateChatState(from, 'COLLECTING_APPOINTMENT_IA', JSON.stringify({ 
                phone: from,
                problem: initialProblem
            }));
            return;
        }
        // Alerta de spam en flujo general (silencia a Mariana)
        if (replyText.includes('dejaré la conversación hasta aquí') || replyText.includes('dejaré las respuestas automáticas hasta aquí')) {
            try {
                const adminSpamAlert = `⚠️ *ALERTA DE SPAM / JUEGO DETECTADA*\n\nEl cliente +${from} parece estar jugando o spameando en el chat.\n\nMariana ha procedido a silenciarse automáticamente. Puedes monitorearlo en tu Portal:\n👉 carmd.com.mx/os/chats`;
                await sendWhatsAppMessage(brianPhone, adminSpamAlert);
                console.log("[Webhook] Alerta de spam enviada al administrador y bot silenciado.");
            } catch (e) {
                console.error("Error al alertar a Brian sobre spam:", e);
            }
            
            await sendInBubblesGeneral(from, replyText);
            await saveChatMessage(from, 'assistant', replyText);
            await updateChatState(from, 'HUMAN_REQUIRED', chat?.vehicleProblem || '');
            return;
        }

        // Alerta informativa a Brian sobre solicitud de asesor por expediente (Mariana se mantiene activa)
        if (replyText.toLowerCase().includes('asesor') && (replyText.toLowerCase().includes('expediente') || replyText.toLowerCase().includes('historial') || replyText.toLowerCase().includes('recado') || replyText.toLowerCase().includes('notific') || replyText.toLowerCase().includes('pasé'))) {
            try {
                const adminAlertMsg = `ℹ️ *SOLICITUD DE ASESOR (HISTORIAL DE VEHÍCULO)*\n\nEl cliente +${from} solicita que un asesor revise su expediente para su vehículo.\n\nEl bot continuará activo respondiendo al cliente. Puedes ver el chat en tu Portal:\n👉 carmd.com.mx/os/chats`;
                await sendWhatsAppMessage(brianPhone, adminAlertMsg);
                console.log("[Webhook] Alerta informativa enviada al administrador.");
            } catch (e) {
                console.error("Error al alertar a Brian sobre asesor:", e);
            }
        }

        // Send response
        await sendInBubblesGeneral(from, replyText);
        await saveChatMessage(from, 'assistant', replyText);

        // --- SISTEMA DE CAPTURA COMERCIAL / PROVEEDORES ---
        // Si el usuario está ofreciendo una alianza comercial o refacciones y ya proporcionó su nombre y correo/datos
        let finalVehicleProblem = chat?.vehicleProblem || '';
        let isSupplierQuery = false;
        try {
            const supplierCheck = await generateTextWithFallback(
                `Analiza si en esta conversación el cliente es un proveedor, está ofreciendo una alianza comercial, vendiendo productos/servicios, queriendo ser proveedor o haciendo una propuesta comercial de cualquier tipo. Responde estrictamente con la palabra YES o NO.\n\nHistorial:\n${historyPromptText}\nÚltimo mensaje: "${text}"`,
                { temperature: 0.1 }
            );
            const checkText = supplierCheck.text?.trim().toUpperCase() || 'NO';
            isSupplierQuery = checkText.includes('YES');
            console.log(`[Supplier Check] Evaluación semántica de propuesta comercial: ${isSupplierQuery ? 'YES' : 'NO'}`);
        } catch (e) {
            isSupplierQuery = textLower.includes('refaccionaria') || textLower.includes('proveedor') || 
                              textLower.includes('servicio') || textLower.includes('colaborar') || 
                              textLower.includes('comercial') || textLower.includes('adquisiciones') ||
                              (chat && chat.chatHistory && chat.chatHistory.toLowerCase().includes('proveedor'));
        }

        if (isSupplierQuery && (currentState === 'WAITING_PROBLEM_IA' || currentState === 'WAITING_FORM_IA')) {
            try {
                // Analizar con Gemini si el texto del historial o el mensaje actual ya contiene los datos completos del proveedor
                const supplierPrompt = `Analiza este mensaje: "${text}" y el historial reciente de la conversación:
                ${historyPromptText}
                
                Si el usuario está ofreciendo servicios/productos comerciales y ha proporcionado al menos su Nombre y un Correo electrónico (o teléfono), extrae:
                1. Nombre completo (name)
                2. Correo electrónico (email)
                3. Nombre de la empresa o refaccionaria (vehicle)
                4. Detalles de su propuesta o producto (problem)
                
                Devuelve un JSON estrictamente bajo las llaves: name, email, vehicle, problem.
                Si no ha proporcionado su nombre y correo electrónico todavía en la conversación, devuelve "NONE".`;

                const supplierRes = await generateTextWithFallback(
                    supplierPrompt,
                    { temperature: 0.1 }
                );

                const ansJson = supplierRes.text?.replace(/```json|```/g, '').trim() || '';
                if (ansJson && ansJson !== 'NONE' && ansJson.startsWith('{')) {
                    const parsed = JSON.parse(ansJson);
                    
                    // Si ya tenemos los datos mínimos, guardamos en la Ficha de Registro IA
                    const cleanName = (parsed.name || '').trim().toUpperCase();
                    const cleanEmail = (parsed.email || '').trim().toUpperCase();
                    
                    if (parsed.name && parsed.email && cleanName !== 'NONE' && cleanEmail !== 'NONE' && cleanName !== '' && cleanEmail !== '') {
                        finalVehicleProblem = JSON.stringify({
                            name: parsed.name,
                            email: parsed.email,
                            vehicle: parsed.vehicle || 'Propuesta Comercial',
                            year: 'N/A',
                            km: 'N/A',
                            plate: 'N/A',
                            date: 'N/A',
                            time: 'N/A',
                            problem: parsed.problem || 'Propuesta de Proveedor'
                        });

                        // Mandar correo de alerta a car.md.mx@hotmail.com por Resend
                        if (process.env.RESEND_API_KEY) {
                            const emailSubject = `🏢 Nueva Propuesta de Proveedor: ${parsed.vehicle || parsed.name}`;
                            const emailHtml = `
                                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                                    <h2 style="color: #f16315; border-bottom: 2px solid #f16315; padding-bottom: 8px;">Contacto de Nuevo Proveedor</h2>
                                    <p>Se ha recibido una propuesta comercial a través del chatbot de WhatsApp:</p>
                                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                                        <tr><td style="padding: 8px; font-weight: bold; width: 30%;">Nombre:</td><td style="padding: 8px;">${parsed.name}</td></tr>
                                        <tr><td style="padding: 8px; font-weight: bold;">Empresa:</td><td style="padding: 8px;">${parsed.vehicle || 'No especificada'}</td></tr>
                                        <tr><td style="padding: 8px; font-weight: bold;">Correo:</td><td style="padding: 8px;">${parsed.email}</td></tr>
                                        <tr><td style="padding: 8px; font-weight: bold;">WhatsApp:</td><td style="padding: 8px;">+${from}</td></tr>
                                        <tr><td style="padding: 8px; font-weight: bold; vertical-align: top;">Propuesta:</td><td style="padding: 8px; font-style: italic;">"${parsed.problem || 'No especificada'}"</td></tr>
                                    </table>
                                    <p style="margin-top: 25px; font-size: 12px; color: #777;">* Este es un correo automático enviado por el Asistente Virtual de CarMD.</p>
                                </div>
                            `;

                            // Importamos dinámicamente resend o lo llamamos directo
                            const { resend } = await import('@/lib/resend');
                            await resend.emails.send({
                                from: 'CarMD Asistente <notificaciones@carmd.com.mx>',
                                to: 'car.md.mx@hotmail.com',
                                subject: emailSubject,
                                html: emailHtml
                            });
                            console.log("[Supplier Email] Correo enviado exitosamente a car.md.mx@hotmail.com");
                        }
                        
                        // Mandar alerta de propuesta de proveedor a Brian por WhatsApp
                        try {
                            const supplierAlertMsg = `🏢 *NUEVA PROPUESTA DE PROVEEDOR*\n\nEl proveedor *${parsed.name}* de la empresa *${parsed.vehicle || 'No especificada'}* ha dejado una propuesta comercial:\n\n📧 *Correo*: ${parsed.email}\n📞 *WhatsApp*: +${from}\n📋 *Propuesta*: "${parsed.problem || 'No especificada'}"\n\nPuedes revisar el catálogo o datos del chat en tu Portal.`;
                            await sendWhatsAppMessage(brianPhone, supplierAlertMsg);
                            console.log("[Webhook] Alerta de propuesta comercial enviada al administrador.");
                        } catch (e) {
                            console.error("Error al alertar a Brian sobre propuesta comercial:", e);
                        }
                    }
                }
            } catch (err) {
                console.error("Error al procesar y enviar correo de propuesta comercial:", err);
            }
        }

        // Update state to AI state
        await updateChatState(from, nextState, currentState === 'WAITING_PROBLEM_IA' ? (finalVehicleProblem || text) : finalVehicleProblem);
            } catch (backgroundError) {
                console.error("[Webhook Background Error]:", backgroundError);
            }
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Webhook Processing Error [CRITICAL]:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
