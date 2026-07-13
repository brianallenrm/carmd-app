import { NextRequest, NextResponse } from 'next/server';
import { WHATSAPP_CONFIG } from '@/lib/constants';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getChatState, updateChatState, saveChatMessage } from '@/lib/google-sheets';
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
  2. Pídele al cliente que te proporcione su Nombre Completo, Correo Electrónico y el Kilometraje aproximado de su auto para tener su ficha lista antes de transferir.
  3. Una vez que el cliente responda con esos datos, agradécelos, dile que un asesor se comunicará a la brevedad y detendrás tus respuestas automáticas. (El webhook se encargará de pasarlo a humano y silenciarte de forma interna).

3.1. PREGUNTAS FRECUENTES (FAQs) DE OPERACIÓN Y TALLER:
- AFINACIÓN OFICIAL: Si te preguntan en qué consiste la afinación, descríbelo textualmente como: "Mantenimiento al sistema de ignición, inyección, enfriamiento y lubricación. Reemplazo de filtros críticos y reset de intervalos de mantenimiento, más la revisión general de puntos de seguridad."
- POLÍTICA DE REFACCIONES DEL CLIENTE: Si preguntan si pueden traer sus propias refacciones, responde que sí es posible. Aclárales que nuestro equipo de ingenieros debe evaluar la calidad de las piezas a su llegada para determinar si aplica o no nuestra garantía de 1 año y los servicios incluidos.
- COSTO DE DIAGNÓSTICO: Si preguntan cuánto cuesta el diagnóstico, responde que al igual que otros servicios, depende de la evaluación física. Sin embargo, explícales con entusiasmo que si deciden realizar la reparación con nosotros, el diagnóstico es 100% gratuito (se bonifica del total del trabajo).
- FACTURACIÓN: Si preguntan si facturamos, responde que sí emitimos factura para todos los servicios si el cliente lo requiere. Regla de oro: No menciones si el precio incluye o no IVA bajo ningún motivo.
- FORMAS DE PAGO: Aceptamos todos los medios de pago: efectivo, transferencia bancaria y todas las tarjetas de débito o crédito (Visa, Mastercard y American Express). No manejamos meses sin intereses directos, pero sí es posible diferir o dividir el pago en mensualidades con intereses directamente en nuestra terminal física a su llegada.
- GARANTÍA CARMD: Si preguntan qué garantía ofrecemos, responde que todas nuestras garantías son por escrito: ofrecemos 1 año de garantía en mano de obra e incluye de regalo dos mantenimientos preventivos gratuitos (los cuales se especifican en la nota indicando el kilometraje recomendado para traer de vuelta el carro). Comparte amablemente la dirección oficial: https://www.carmd.com.mx/terminos para detalles.
- SERVICIO DE GRÚA / AUXILIO VIAL: Si el cliente solicita grúa o auxilio por quedarse tirado, sé muy empática, tranquiliza al cliente y explícale que daremos total prioridad a su caso. Recomiéndale primero de forma atenta comunicarse con su seguro de auto para hacer uso de su cobertura de grúa o asistencia vial gratuita para trasladar el vehículo de forma segura a nuestras instalaciones. Si no cuenta con seguro o prefiere que nosotros le apoyemos a coordinar una grúa externa para traerlo al Centro de Servicio, pídele amablemente su Nombre completo, qué Vehículo tiene (marca/modelo/año) y su Ubicación exacta. En cuanto te dé esos datos o confirme que requiere la grúa, dile exactamente: "¡Excelente! Estoy registrando tus datos de auxilio vial y notificando a nuestro equipo. \n\n¡Solicitud recibida! ✔️ Revisamos disponibilidad de la grúa y te confirmamos por aquí mismo en unos momentos. Así no te hacemos perder tiempo 👍."
- REGLA DE INTERRUPCIÓN HORARIA (SITUACIONES CRÍTICAS): Si el cliente reporta quedarse tirado (grúa/auxilio vial) y la hora actual de referencia es posterior a las 8:00 PM o anterior a las 7:30 AM, debes advertirle amablemente en tu respuesta que el equipo de asesores humanos le responderá personalmente a primera hora de la mañana (a partir de las 8:00 AM) para coordinar todo, aunque dejes registrados sus datos de ubicación.

Venta de refacciones sueltas: Si preguntan si vendemos piezas sueltas (ej: un filtro, balatas), aclara con amabilidad que no somos refaccionaria; somos un Centro de Servicio integral y todas las piezas que proveemos se instalan bajo garantía de mano de obra en el taller.
- PROPUESTAS COMERCIALES Y PROVEEDORES: Si un cliente escribe para ofrecer productos, servicios, alianzas de marca o ser proveedor de refacciones/herramientas:
  1. Agradéceles amablemente el interés en CarMD.
  2. Pídeles con cortesía sus datos de contacto para hacerlos llegar al área de compras y adquisiciones: *Nombre completo*, *Nombre de la refaccionaria/empresa* y su *Correo electrónico*.
  3. Menciona que en cuanto tengan esa información, el departamento correspondiente la revisará y se comunicará con ellos si existe interés en la propuesta comercial.
- INSPECCIÓN DE COMPRA A DOMICILIO (REVISIÓN PARA COMPRA): Si el cliente te pregunta si podemos ir a revisar a domicilio un coche que le están ofreciendo para comprar, dile que sí es posible realizar este servicio de inspección a domicilio. Pídele amablemente que por favor te comparta sus datos: Nombre completo, el Vehículo (marca, modelo, año) y la Ubicación o zona de la visita. Coméntale que en cuanto te proporcione esta información, un asesor de CarMD se comunicará de inmediato para revisar la disponibilidad de la visita y coordinar la cita.
- ESTÉTICA AUTOMOTRIZ (PROHIBIDO DECIR HOJALATERÍA Y PINTURA): Si el cliente te pregunta por hojalatería y pintura o estética automotriz, responde con entusiasmo que sí contamos con el servicio oficial de *Estética Automotriz*. Explícales que realizamos todo tipo de reparaciones y mejoras estéticas: desde pequeños rayones, golpes, abolladuras y pintura general o por piezas, hasta reemplazo de partes exteriores como faros, parrillas, cajuelas o fascias. REGLA DE ORO: Aunque el cliente te pregunte usando el término informal "hojalatería y pintura", tú debes responder y referirte al servicio estrictamente usando el término premium *Estética Automotriz* en todas tus burbujas de WhatsApp. Para darles un presupuesto preciso de la reparación estética, invítalos cordialmente a agendar una cita de evaluación física en nuestro Centro de Servicio.
- VERIFICACIÓN VEHICULAR: Si preguntan si realizamos el trámite de verificación, responde que sí apoyamos a los clientes a llevar su auto a verificar. Aclara que recomendamos traer primero el carro a CarMD para una inspección y revisión de pre-verificación, garantizando que pase el trámite a la primera.
- ALCANCE DE VEHÍCULOS (MOTOS NO): Atendemos autos particulares, SUVs, pick-ups, vehículos comerciales, camiones pesados y maquinaria de todo tipo. Sin embargo, no atendemos motocicletas de ningún tipo.
- CONCEPTO PRINCIPAL: Recuerda usar siempre el término premium "Centro de Servicio" para referirte a las instalaciones de CarMD.

4. MEMORIA INTELIGENTE Y CORRECCIÓN DE DATOS:
- Si el cliente te proporciona varios datos en un solo mensaje (ej: su nombre, coche y falla), agradécelos y regístralos mentalmente en silencio. NUNCA los vuelvas a preguntar.
- REGLA DE CORRECCIÓN DE DATOS (CRÍTICA): Si el cliente te menciona que un dato del resumen está mal o quiere corregirlo (ej: "está mal el problema", "quiero cambiar la fecha"):
  1. Identifica qué campo quiere cambiar.
  2. Borra el valor anterior de ese campo.
  3. Hazle una pregunta amigable para que te dé el dato correcto (ej: "Claro, dime cuál es el síntoma correcto de tu auto para actualizarlo"). NUNCA envíes el resumen de confirmación de inmediato tras una solicitud de corrección; espera a recibir la respuesta del cliente con el dato nuevo.

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

11. SITUACIONES CRÍTICAS O URGENTES:
- Si reportan fallas graves que pongan en riesgo su seguridad (como quedarse sin frenos en el momento, humo denso del motor, etc.), sé muy empática, tranquiliza al cliente y explícale que daremos total prioridad a su caso. Recomiéndale traerlo directamente al taller o detener el carro de forma segura. Ofrécele coordinar una grúa (solicitando nombre, auto y ubicación) o si es fuera de horario adviértele que le responderemos a las 8:00 AM del día siguiente.

12. TONO Y FORMATO DE WHATSAPP:
- Tono profesional, amable, cercano y muy cálido.
- OBLIGATORIO: Usa emojis de forma natural y frecuente en cada burbuja (como 👋, 🚗, ⏰, 📍, 🛠️, 👍) para que los mensajes se sientan vivos y humanos.
- Separa tus ideas claras usando doble salto de línea (\n\n) para que el backend las envíe en burbujas separadas.
- Si el cliente te confirma que ya agendó o completó el flujo, felicítalo y deséale un excelente día sin volver a sugerir citas.`;

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

/**
 * POST: Handle incoming WhatsApp messages
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Check if it's a message event
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (!message) return NextResponse.json({ ok: true });

        const from = message.from; // Sender's phone number
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
                    
                    // 3. Mandar a transcribir a Gemini 3.5 Flash
                    console.log(`[Audio Webhook] Transcribiendo con Gemini 3.5 Flash...`);
                    const audioMime = message.audio.mime_type || 'audio/ogg';
                    
                    let genRes;
                    try {
                        genRes = await ai.models.generateContent({
                            model: 'gemini-3.5-flash',
                            contents: [
                                {
                                    inlineData: {
                                        mimeType: audioMime,
                                        data: audioBase64
                                    }
                                },
                                "Transcribe de forma sumamente precisa este audio en español de México. Devuelve únicamente el texto de la transcripción literal sin comentarios extras ni aclaraciones."
                            ]
                        });
                    } catch (geminiError) {
                        console.error("[Audio Webhook] Gemini 3.5 Flash falló o llegó al límite. Usando fallback a Gemini 3.1 Flash Lite...", geminiError);
                        // Fallback con el modelo 3.1 Flash Lite (enviando el mismo payload de audio)
                        genRes = await ai.models.generateContent({
                            model: 'gemini-3.1-flash-lite',
                            contents: [
                                {
                                    inlineData: {
                                        mimeType: audioMime,
                                        data: audioBase64
                                    }
                                },
                                "Transcribe de forma precisa este audio en español de México. Devuelve únicamente el texto."
                            ]
                        });
                    }
                    
                    const transcription = genRes.text?.trim() || '';
                    console.log(`[Audio Webhook] Transcripción completada: "${transcription}"`);
                    text = transcription;
                }
            } catch (err) {
                console.error("[Audio Webhook] Error en flujo de procesamiento de nota de voz:", err);
                const errorAudioNotify = `Disculpa, tuve un pequeño problema técnico al escuchar tu audio. 🎙️ ¿Podrías escribirme tu mensaje en texto por aquí por favor? 😊`;
                await sendWhatsAppMessage(from, errorAudioNotify);
                await saveChatMessage(from, 'assistant', errorAudioNotify);
                return NextResponse.json({ ok: true });
            }
        }

        const textLower = text?.toLowerCase() || '';
        if (!text) return NextResponse.json({ ok: true });

        // Get current Mexico City Date, Day of week and Time to inject into prompt dynamically
        const nowObj = new Date();
        const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const dayName = daysOfWeek[new Date(nowObj.toLocaleString('en-US', { timeZone: 'America/Mexico_City' })).getDay()];
        const cdmxTimeStr = nowObj.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

        // Deduplication Logic: Ignore requests received in the last 4 seconds for the same number
        const now = Date.now();
        const lastProcessed = processedMessagesCache.get(from);
        if (lastProcessed && (now - lastProcessed) < 4000) {
            console.log(`[Webhook] Duplicado concurrente detectado para ${from}. Ignorando.`);
            return NextResponse.json({ ok: true });
        }
        processedMessagesCache.set(from, now);

        console.log(`[Webhook] Mensaje recibido de ${from}: "${text}"`);
        
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

        // --- COMMAND: RESET EVERYTHING ---
        if (textLower === 'reinicia todo' || textLower === 'reinicia-todo') {
            console.log(`[Reset Command] Limpiando estado e historial para el número ${from}...`);
            await updateChatState(from, 'START', '', '[]');
            const resetMsg = `🧹 *SESIÓN REINICIADA CON ÉXITO*\n\nHe borrado tu historial de conversación y los datos temporales de la Ficha de Registro en Sheets.\n\nTu siguiente mensaje iniciará una conversación completamente limpia desde cero. ¡Listo para tus pruebas! 👍`;
            await sendWhatsAppMessage(from, resetMsg);
            await saveChatMessage(from, 'assistant', resetMsg);
            return NextResponse.json({ ok: true });
        }

        // --- COMMAND: ENTER ADMIN MODE ---
        if (textLower === 'carmd admin' || textLower === 'carmd-admin') {
            console.log(`[Admin Mode] Activando canal administrativo persistente para ${from}...`);
            const adminWelcome = `🔑 *MODO ADMINISTRADOR ACTIVADO*\n\n¡Hola, Brian/Rafael! Has entrado al canal de consulta interna de CarMD.\n\nA partir de este momento me comunicaré contigo de forma ejecutiva. Puedes preguntarme cosas casuales sobre el expediente o historial de cualquier vehículo usando sus placas.\n\n👉 *Ejemplo*: "oye búscame qué le hicieron al coche placas PCH2668"\n\n*(Escribe "salir" o "modo cliente" para volver al chat estándar de clientes)*`;
            await sendWhatsAppMessage(from, adminWelcome);
            await saveChatMessage(from, 'assistant', adminWelcome);
            await updateChatState(from, 'ADMIN_MODE_IA');
            return NextResponse.json({ ok: true });
        }

        // --- COMMAND: EXIT ADMIN MODE ---
        if (chat?.state === 'ADMIN_MODE_IA' && (textLower === 'salir' || textLower === 'modo cliente')) {
            console.log(`[Admin Mode] Desactivando canal administrativo para ${from}...`);
            const exitMsg = `👋 *MODO ADMINISTRADOR DESACTIVADO*\n\nCanal restaurado al flujo estándar de atención al cliente. ¡Bonito día!`;
            await sendWhatsAppMessage(from, exitMsg);
            await saveChatMessage(from, 'assistant', exitMsg);
            await updateChatState(from, 'COMPLETED');
            return NextResponse.json({ ok: true });
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
                
                const plateRes = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-lite',
                    contents: extractPlatePrompt,
                    config: { temperature: 0.1 }
                });
                plate = plateRes.text?.trim().toUpperCase() || 'NONE';
            } catch (e) {
                console.error("[Admin Mode] Error al extraer placa de consulta casual:", e);
            }

            if (plate === 'NONE') {
                // Si el administrador pregunta algo general sin placa, responder amablemente con la IA
                const generalAdminPrompt = `Eres Mariana, asistente de CarMD, y estás hablando directamente con tu jefe (Brian/Rafael, administradores del taller) en el modo administrador.
                El jefe te escribió: "${text}". 
                Respóndele de forma muy atenta, ejecutiva y amigable, recordándole que puedes buscar cualquier expediente de auto si te proporciona su placa.`;
                
                const genRes = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-lite',
                    contents: generalAdminPrompt,
                    config: { temperature: 0.3 }
                });
                const reply = genRes.text?.trim() || "Dime las placas del vehículo para buscar su expediente.";
                await sendWhatsAppMessage(from, reply);
                await saveChatMessage(from, 'assistant', reply);
                return NextResponse.json({ ok: true });
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
                    return NextResponse.json({ ok: true });
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

                const reportRes = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-lite',
                    contents: reportPrompt,
                    config: { temperature: 0.2 }
                });

                const finalReport = `📊 *EXPEDIENTE DEL VEHÍCULO (${plate})*\n\n${reportRes.text?.trim()}`;
                await sendWhatsAppMessage(from, finalReport);
                await saveChatMessage(from, 'assistant', finalReport);
            } catch (err) {
                console.error("[Admin Mode] Error en consulta de base de datos completa:", err);
                const errNotify = `❌ *Error administrativo*:\nOcurrió un error al consultar las notas e inventario para la placa *${plate}*. Por favor inténtalo de nuevo.`;
                await sendWhatsAppMessage(from, errNotify);
            }
            return NextResponse.json({ ok: true });
        }

        // Alerta de actividad para los administradores (sesión nueva o reanudada tras 1 hora de inactividad)
        let shouldAlertAdmins = false;
        let adminNotifyText = "";

        const rafaPhone = "525516473084";
        const momPhone = "525535786087";
        const brianPhone = "525547015312";

        if (!chat) {
            shouldAlertAdmins = true;
            adminNotifyText = `📢 *NUEVA CONVERSACIÓN INICIADA*\n\nEl número +${from} ha iniciado un chat con Mariana (IA).\n\nPuedes monitorear y gestionar la conversación en tiempo real desde tu Portal:\n👉 carmd.com.mx/os/chats`;
        } else {
            const lastUpdateMs = new Date(chat.lastUpdate || 0).getTime();
            const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hora en milisegundos
            if (lastUpdateMs < oneHourAgo) {
                shouldAlertAdmins = true;
                adminNotifyText = `🔁 *ACTIVIDAD EN CHAT REANUDADA*\n\nEl cliente +${from} ha vuelto a escribir después de más de 1 hora de inactividad.\n\nPuedes ver la conversación en tiempo real en tu Portal:\n👉 carmd.com.mx/os/chats`;
            }
        }

        if (shouldAlertAdmins) {
            console.log(`[Webhook] Alerta de actividad en chat para administradores. Enviando...`);
            
            // Enviar alerta a Rafael
            try {
                await sendWhatsAppMessage(rafaPhone, adminNotifyText);
            } catch (e) {
                console.error("Error al alertar a Rafael sobre actividad:", e);
            }

            // Enviar alerta a Mamá
            try {
                await sendWhatsAppMessage(momPhone, adminNotifyText);
            } catch (e) {
                console.error("Error al alertar a Mamá sobre actividad:", e);
            }

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
            return NextResponse.json({ ok: true });
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
            
            // Intentar extraer el nombre si estamos en el sub-estado
            let clientName = '';
            let vehicleProblemData = chat?.vehicleProblem || '';
            
            try {
                if (vehicleProblemData.startsWith('{')) {
                    const parsed = JSON.parse(vehicleProblemData);
                    clientName = parsed.name || '';
                }
            } catch(e) {}

            // Si es la primera solicitud y no tenemos su nombre registrado
            if (!clientName && chat?.state !== 'ASKING_NAME_FOR_HUMAN') {
                const askNameMessage = `Entiendo perfectamente tu molestia y te pido una disculpa. 📞 Para nada es nuestra intención quitar el trato humano ni la cercanía contigo; de hecho, usamos este asistente virtual solo para agilizar los datos y poder ayudarte mucho más rápido.\n\nPara pasarte de inmediato con uno de nuestros asesores y que sepa con quién se comunicará, ¿me podrías compartir tu *Nombre completo* y qué *coche (Marca, Modelo y Año)* tienes? 😊`;
                
                await sendWhatsAppMessage(from, askNameMessage);
                await saveChatMessage(from, 'assistant', askNameMessage);
                
                // Guardamos el estado temporal para esperar el nombre
                const tempParams = { name: '', vehicle: '', phone: from };
                await updateChatState(from, 'ASKING_NAME_FOR_HUMAN', JSON.stringify(tempParams));
                return NextResponse.json({ ok: true });
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
                    
                    const extractRes = await ai.models.generateContent({
                        model: 'gemini-3.1-flash-lite',
                        contents: extractPrompt,
                        config: { temperature: 0.1 }
                    });
                    
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
            return NextResponse.json({ ok: true });
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
            return NextResponse.json({ ok: true });
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

            // Prompt especial para que Gemini extraiga datos nuevos y responda al usuario
            const assistantInstruction = `${SYSTEM_PROMPT}

FECHA Y HORA ACTUAL DE REFERENCIA: ${cdmxTimeStr}. HOY ES DÍA: ${dayName.toUpperCase()}. (Calcula correctamente el día de la semana relativo a hoy: si hoy es ${dayName}, mañana es el siguiente día. Recuerda que los domingos el Centro de Servicio está CERRADO).

REGLAS DE RECOLECCIÓN DE CITA (MODO INTERACTIVO):
- Estás en un proceso activo de registro de cita para el cliente con teléfono: ${from}.
- Los datos acumulados hasta el momento son: ${JSON.stringify(tempParams)}.
- El cliente te acaba de escribir: "${text}".
- Tu tarea es doble:
  1. Identificar si el cliente te está proporcionando datos nuevos para su cita (ej: su nombre, marca/modelo, año, kilometraje, placas, fecha/hora preferida o el problema de su auto) y actualizar mentalmente el registro.
  2. Si el cliente te hace alguna pregunta intermedia (como horarios, dirección, por qué pedimos datos, precios, etc.), respóndela amablemente siguiendo las reglas del manual de CarMD.
  3. Si falta algún dato importante por recolectar, pídeselo de forma muy amigable. No le pidas todo junto de golpe; ve solicitándolo de forma natural en la conversación. Los datos necesarios son: *Nombre completo*, *Correo electrónico*, *Marca/Modelo del auto*, *Año*, *Kilometraje*, *Placas*, *Fecha/Hora preferida* y *Problema del auto*.
  4. VERIFICACIÓN DE CALENDARIO REAL: Si el cliente propone una fecha y día de la semana que no coinciden en el calendario real (ej: decir miércoles 14 cuando el miércoles es 15 de julio de 2026), corrígelo con amabilidad diciendo el día correcto antes de agendar (ej: "Veo que el miércoles es 15 de julio, ¿te agendamos para ese día?").
  5. REGLA DE DOMINGOS: El Centro de Servicio está estrictamente CERRADO los domingos. Si el cliente solicita explícitamente venir en domingo, debes aclararle amablemente que no abrimos y pedirle proactivamente que te sugiera otra fecha de lunes a sábado.
  6. TOLERANCIA AL KILOMETRAJE DESCONOCIDO: Si al pedirle el kilometraje el cliente te responde que no sabe o no está seguro, puedes insistir amistosamente UNA SÓLA VEZ pidiéndole un aproximado. Si insiste en que no sabe o no responde, guarda el campo 'km' como "Pendiente" y avanza inmediatamente a pedirle el siguiente dato (ej: las placas) sin volver a preguntar por los kilómetros.
  7. DATO CURIOSO DEL AUTO: Justo después de que el cliente proporcione o confirme por primera vez qué auto tiene (marca/modelo/versión), debes integrar de forma muy breve, natural y conversacional en tu respuesta de WhatsApp un dato curioso, real e interesante sobre esa marca o modelo de auto (máximo un renglón, ej: de dónde viene el nombre, un récord, algún dato histórico divertido) antes de continuar con la conversación o pedirle el siguiente dato. Si el cliente no ha dicho su auto o ya comentaste el dato curioso antes, no lo menciones.
${historyPromptText}

Recuerda: Escribe de forma natural y amigable con emojis. Mantén tus respuestas cortas.`;

            console.log("[Webhook] Llamando a Gemini para evaluar respuesta e información...");
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-flash-lite',
                contents: text,
                config: {
                    systemInstruction: assistantInstruction,
                    temperature: 0.3,
                }
            });

            let replyText = response.text || "Perfecto. Por favor compárteme tu marca y modelo de auto para continuar.";
            console.log(`[Webhook] Respuesta IA generada: "${replyText}"`);

            // Helper function to send messages sequentially in bubbles
            const sendInBubbles = async (recipient: string, rawText: string) => {
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

            // Si aún no se completa la cita, extraemos los parámetros que el cliente dio en este mensaje
            // de forma silenciosa para ir acumulándolos en el Sheets (para no perderlos en el historial de reintentos)
            const parsePrompt = `Analiza este mensaje: "${text}". Basándote en el JSON histórico: ${JSON.stringify(tempParams)}, actualiza los campos si el usuario los proporcionó ahora.
            Devuelve un JSON limpio únicamente con las llaves: name, email, vehicle, year, km, plate, date, time, problem.
            Ejemplo de salida: {"name": "...", "vehicle": "..."}
            
            FECHA Y HORA ACTUAL DE REFERENCIA (SÚPER IMPORTANTE): Hoy es ${dayName.toUpperCase()} y la fecha y hora actual en México es ${cdmxTimeStr}. 
            Calcula cualquier fecha relativa (ej: "próximo martes", "mañana", "el 14") de forma matemática estricta a partir de esta fecha de hoy. El formato de salida para 'date' debe ser un string legible (ej: "martes 15 de julio" o "lunes 13 de julio").
            ${historyPromptText}

            REGLAS DE EXTRACCIÓN DE DATOS:
            1. REGLA DE LIMPIEZA DE MARCAS: Si detectas un error de dedo obvio en la marca o modelo (ej: "btw" en lugar de "BMW", "toyot" por "Toyota", "va" por "VW"), corrígelo en el campo 'vehicle' para que se guarde de forma profesional en el JSON.
            2. SEPARACIÓN DE PREGUNTAS Y MOTIVOS: Si el cliente hace una pregunta como "¿para qué quieres las placas?", "¿cuánto cuesta?", etc., esto NUNCA debe ser guardado en el campo 'problem'. El campo 'problem' se llena únicamente con síntomas reales del coche (frenos, afinación, ruido, etc.) o solicitudes de servicio.
            3. SI EL USUARIO INDICA CORREGIR UN DATO (ej: "el problema no es afinación, es frenos"): Borra o reemplaza el dato anterior con el valor que indica el usuario ahora.
            4. CORRECCIÓN DE FECHA EN EL JSON: Si el usuario dice una fecha numérica y un día de la semana que son incompatibles o erróneos (como decir "miércoles 14" cuando el miércoles es 15 de julio de 2026), guardar en el campo 'date' la fecha REAL corregida del calendario (miércoles 15 de julio).
            5. MANEJO DE DATOS FALTANTES O DESCONOCIDOS: Si el usuario dice "no sé", "no estoy seguro" o "luego te digo" para el kilometraje ('km'), guarda el valor "Pendiente" en el campo 'km'. No dejes el campo vacío ni vuelvas a forzar la pregunta si el usuario ya declaró desconocerlo.
            6. PERSISTENCIA DE PLACAS: Asegúrate de extraer las placas si el cliente las proporciona (ej: "Abcd1234"). NUNCA limpies o dejes el campo 'plate' como nulo o vacío una vez que ya fue capturado.`;

            let extracted: any = {};
            try {
                const parseRes = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-lite',
                    contents: parsePrompt,
                    config: { temperature: 0.1 }
                });
                const cleanJson = parseRes.text?.replace(/```json|```/g, '').trim() || '{}';
                extracted = JSON.parse(cleanJson);
            } catch (e) {}

            // Combinar parámetros inteligentemente (sin sobreescribir con valores nulos o vacíos del extractor silencioso)
            const mergedParams = { ...tempParams };
            for (const key of Object.keys(extracted)) {
                if (extracted[key] && extracted[key] !== '...' && extracted[key] !== '') {
                    mergedParams[key] = extracted[key];
                }
            }

            // Responder al cliente en burbujas y guardar progreso temporal
            // Validación: ¿Ya tenemos todos los datos clave completos para presentar el resumen?
            let hasRequiredFieldsForSummary = mergedParams.name && mergedParams.name !== '...' &&
                                              mergedParams.vehicle && mergedParams.vehicle !== '...' &&
                                              mergedParams.km && mergedParams.km !== '...' &&
                                              mergedParams.plate && mergedParams.plate !== '...' &&
                                              mergedParams.date && mergedParams.date !== '...' && mergedParams.date !== 'lo más temprano posible' &&
                                              mergedParams.time && mergedParams.time !== '...' && mergedParams.time !== 'lo más temprano posible';

            // VALIDACIÓN CRÍTICA DE DOMINGO: Si la fecha contiene la palabra "domingo", bloqueamos el resumen
            if (hasRequiredFieldsForSummary && mergedParams.date.toLowerCase().includes('domingo')) {
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
                                       replyText.includes('detendré mis respuestas');
            
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
                    return NextResponse.json({ ok: true });
                }
            }

            // Sanitización de Hora de Apertura
            if (mergedParams.time && (mergedParams.time.toLowerCase() === 'apertura' || mergedParams.time.toLowerCase() === 'lo más temprano' || mergedParams.time.toLowerCase() === 'lo más temprano posible')) {
                mergedParams.time = '8:00 AM';
            }

            if (hasRequiredFieldsForSummary) {
                // Si ya tenemos todo, pasamos al estado de confirmación y le presentamos el resumen
                const kmDisplay = mergedParams.km === 'Pendiente' ? 'Por confirmar a la llegada 🛞' : `${mergedParams.km} KM`;
                const summaryText = `¡Listo! Ya tengo toda la información. Por favor confírmame si los datos de tu cita son correctos:
 
👤 *Nombre*: ${mergedParams.name}
📧 *Corro*: ${mergedParams.email || 'N/A'}
🚗 *Vehículo*: ${mergedParams.vehicle} ${mergedParams.year || ''}
🛞 *Kilometraje*: ${kmDisplay}
📋 *Placas*: ${mergedParams.plate}
📅 *Fecha*: ${mergedParams.date}
⏰ *Hora*: ${mergedParams.time}
🔧 *Problema*: ${mergedParams.problem || 'Diagnóstico general'}
 
¿Te parece bien si procedo a confirmar tu espacio con estos datos? 👍`;
 
                await sendInBubbles(from, summaryText);
                await saveChatMessage(from, 'assistant', summaryText);
                await updateChatState(from, 'WAITING_CONFIRMATION_IA', JSON.stringify(mergedParams));
                return NextResponse.json({ ok: true });
            }
 
            await sendInBubbles(from, replyText);
            await saveChatMessage(from, 'assistant', replyText);
            await updateChatState(from, 'COLLECTING_APPOINTMENT_IA', JSON.stringify(mergedParams));
            return NextResponse.json({ ok: true });
        }

        // --- Handle Final Booking Confirmation State ---
        if (chat?.state === 'WAITING_CONFIRMATION_IA') {
            console.log("[Webhook] Evaluando confirmación final en WAITING_CONFIRMATION_IA...");
            
            let tempParams: any = {};
            try {
                if (chat.vehicleProblem && chat.vehicleProblem.startsWith('{')) {
                    tempParams = JSON.parse(chat.vehicleProblem);
                }
            } catch (e) {}

            const textClean = text.toLowerCase().trim();
            
            // Usar Gemini para evaluar de forma robusta y semántica si el cliente confirma o tiene dudas/cambios
            let isAffirmative = false;
            try {
                const evalPrompt = `Analiza si este mensaje es una aceptación, confirmación o aprobación a la propuesta anterior de agendar su cita: "${text}".
                Acepta respuestas afirmativas directas, informales, modismos mexicanos o positivos (ej: "si", "sí", "va", "chido", "sobres", "perfecto", "confirmo", "adelante", "chévere", "dale", "está bien", "procede", "ok").
                Responde ÚNICAMENTE con la palabra "YES" si es afirmativo/aprobación, o "NO" si es negativo, duda, pregunta o si desea realizar algún cambio (como preguntar "cuándo confirman", etc.).
${historyPromptText}`;
                
                const evalRes = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-lite',
                    contents: evalPrompt,
                    config: { temperature: 0.1 }
                });
                
                const ans = evalRes.text?.trim().toUpperCase() || 'NO';
                console.log(`[Webhook] Evaluación semántica de confirmación en WAITING_CONFIRMATION_IA: "${ans}"`);
                isAffirmative = ans.includes('YES');
            } catch (e) {
                console.error("Error evaluando confirmación con IA:", e);
                // Fallback local robusto
                isAffirmative = textClean === 'si' || textClean === 'sí' || textClean === 'correcto' || textClean === 'perfecto' || textClean === 'confirmar' || textClean === 'confirmo';
            }

            if (isAffirmative) {
                console.log("[Webhook] Confirmación afirmativa recibida. Registrando cita definitiva...");
                
                // Evaluar si es tarde (después de las 8:00 PM o antes de las 7:30 AM en CDMX)
                const mxDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
                const mxHour = mxDate.getHours();
                const mxMinutes = mxDate.getMinutes();
                const totalMinutes = mxHour * 60 + mxMinutes;
                
                const isLateNight = totalMinutes >= 20 * 60 || totalMinutes < 7.5 * 60; // 8:00 PM (1200 mins) o 7:30 AM (450 mins)
                
                let confirmationMsg = `¡Solicitud recibida! ✔️ En este momento te llegará un correo electrónico con los detalles de tu solicitud de cita. A la brevedad, un asesor de nuestro equipo de CarMD se comunicará contigo por aquí para el seguimiento y confirmación final. ¡Muchas gracias por tu confianza! 🚗💨`;
                if (isLateNight) {
                    confirmationMsg += `\n\n⚠️ *Nota*: Por el horario actual, el seguimiento personalizado y la confirmación final por parte de nuestro equipo humano se realizarán a primera hora del día de mañana a partir de las 8:00 AM. ¡Excelente noche! 🌙`;
                }

                await sendWhatsAppMessage(from, confirmationMsg);
                await saveChatMessage(from, 'assistant', confirmationMsg);

                try {
                    const baseUrl = process.env.NODE_ENV === 'production' 
                        ? `https://${req.headers.get('host')}` 
                        : 'http://localhost:3000';

                    await fetch(`${baseUrl}/api/citas/reserve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: tempParams.name,
                            email: tempParams.email || 'N/A',
                            phone: from,
                            vehicle: tempParams.vehicle,
                            year: tempParams.year || 'N/A',
                            km: tempParams.km || 'N/A',
                            plate: tempParams.plate || 'N/A',
                            date: tempParams.date,
                            time: tempParams.time,
                            problem: tempParams.problem || 'Servicio de afinación'
                        })
                    });
                } catch (e) {
                    console.error("Error al llamar API reserve:", e);
                }
                
                await updateChatState(from, 'COMPLETED');
                return NextResponse.json({ ok: true });
            } else {
                const textLower = textClean.toLowerCase();
                const isCancellation = textLower.includes('cancelar') || textLower.includes('cancela') || 
                                       textLower.includes('ya no') || textLower.includes('olvidalo') || 
                                       textLower.includes('olvídelo') || textLower.includes('ninguno');
                
                if (isCancellation) {
                    console.log("[Webhook] Solicitud de cancelación recibida. Limpiando estado...");
                    const cancelMsg = `Entendido. He cancelado el proceso de registro de tu cita. Si en el futuro necesitas ayuda para tu auto, recuerda que aquí estaré listo para apoyarte. ¡Que tengas un excelente día! 😊🚗`;
                    await sendWhatsAppMessage(from, cancelMsg);
                    await saveChatMessage(from, 'assistant', cancelMsg);
                    await updateChatState(from, 'COMPLETED');
                    return NextResponse.json({ ok: true });
                }

                // Si dice que no o quiere cambiar algo, regresamos a la recolección
                console.log("[Webhook] El cliente no confirmó o desea cambiar datos. Regresando a recolección.");
                const retryMsg = `Entendido. ¿Qué dato te gustaría corregir o qué cambio hacemos en tu cita? 🛠️`;
                await sendWhatsAppMessage(from, retryMsg);
                await saveChatMessage(from, 'assistant', retryMsg);
                await updateChatState(from, 'COLLECTING_APPOINTMENT_IA', JSON.stringify(tempParams));
                return NextResponse.json({ ok: true });
            }
        }

        // --- Handle General AI Mode ---
        console.log("[Webhook] Modo Gemini AI activado por defecto.");

        // --- SISTEMA DE MEMORIA DE CITAS CONFIRMADAS ---
        const wantsBookingAction = textLower.includes('cita') || textLower.includes('recordar') || 
                                   textLower.includes('cuándo') || textLower.includes('hora') || 
                                   textLower.includes('reprogramar') || textLower.includes('cambiar') || 
                                   textLower.includes('cancela');

        if (wantsBookingAction && (chat?.state === 'COMPLETED' || chat?.state === 'START' || !chat?.state)) {
            console.log(`[Booking Memory] Cliente ${from} solicita acción sobre cita. Consultando hoja CITAS_2025...`);
            try {
                const baseUrl = process.env.NODE_ENV === 'production' 
                    ? `https://${req.headers.get('host')}` 
                    : 'http://localhost:3000';

                const bookingRes = await fetch(`${baseUrl}/api/chats/${from}/booking`);
                if (bookingRes.ok) {
                    const { cita } = await bookingRes.json();
                    if (cita && (cita.estatus === 'Pendiente' || cita.estatus === 'Confirmada')) {
                        console.log(`[Booking Memory] Cita activa encontrada:`, cita);
                        
                        const isQuery = textLower.includes('recordar') || textLower.includes('cuándo') || 
                                        textLower.includes('cual') || textLower.includes('cuál') || 
                                        textLower.includes('dónde') || textLower.includes('info') || 
                                        (!textLower.includes('cambiar') && !textLower.includes('reprogramar') && !textLower.includes('cancela'));

                        if (isQuery) {
                            // Responder con la confirmación de su cita activa
                            const reminderMsg = `¡Hola, ${cita.name}! 😊 Claro, con gusto te confirmo los detalles de tu cita agendada en nuestro Centro de Servicio:\n\n📅 *Fecha*: ${cita.date}\n⏰ *Hora*: ${cita.time}\n🚗 *Auto*: ${cita.vehicle} (${cita.year})\n📋 *Placas*: ${cita.plate}\n🔧 *Problema*: ${cita.problem}\n\n¡Te esperamos! Si necesitas hacer algún cambio o tienes dudas, avísame. 👍`;
                            await sendWhatsAppMessage(from, reminderMsg);
                            await saveChatMessage(from, 'assistant', reminderMsg);
                            return NextResponse.json({ ok: true });
                        }

                        const isReschedule = textLower.includes('cambiar') || textLower.includes('reprogramar') || textLower.includes('mover');
                        if (isReschedule) {
                            // Cargar de vuelta los parámetros acumulados para iniciar la reprogramación
                            const restoreParams = {
                                name: cita.name,
                                email: cita.email,
                                vehicle: cita.vehicle,
                                year: cita.year,
                                km: cita.km,
                                plate: cita.plate,
                                problem: cita.problem,
                                date: '...', // Reset para pedir fecha nueva
                                time: '...'  // Reset para pedir hora nueva
                            };

                            const rescheduleMsg = `¡Hola, ${cita.name}! Claro que sí, con mucho gusto podemos reprogramar tu espacio en el Centro de Servicio. 🗓️\n\nTu cita actual está agendada para el *${cita.date}* a las *${cita.time}*.\n\n¿Para qué nuevo día y hora de lunes a sábado te gustaría agendar? 😊`;
                            await sendWhatsAppMessage(from, rescheduleMsg);
                            await saveChatMessage(from, 'assistant', rescheduleMsg);
                            await updateChatState(from, 'COLLECTING_APPOINTMENT_IA', JSON.stringify(restoreParams));
                            return NextResponse.json({ ok: true });
                        }

                        const isCancel = textLower.includes('cancelar') || textLower.includes('cancela');
                        if (isCancel) {
                            // Actualizar estatus a Cancelada en Sheets
                            try {
                                await fetch(`${baseUrl}/api/citas/update-status`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ phone: from, status: 'Cancelada' })
                                });
                            } catch (e) {
                                console.error("Error al cancelar cita en Sheets:", e);
                            }

                            const cancelConfirmMsg = `Entendido, ${cita.name}. He cancelado tu cita para el ${cita.date} a las ${cita.time} con éxito. Si en el futuro necesitas programar de nuevo o requieres ayuda para tu auto, aquí estaré. ¡Que tengas un excelente día! 😊🚗`;
                            await sendWhatsAppMessage(from, cancelConfirmMsg);
                            await saveChatMessage(from, 'assistant', cancelConfirmMsg);
                            await updateChatState(from, 'COMPLETED');
                            return NextResponse.json({ ok: true });
                        }
                    }
                }
            } catch (e) {
                console.error("[Booking Memory] Error al consultar cita activa:", e);
            }
        }

        let systemInstruction = SYSTEM_PROMPT;
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
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: text,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.3,
            }
        });

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
            let initialProblem = null;
            if (currentState === 'WAITING_PROBLEM_IA' && chat?.vehicleProblem) {
                initialProblem = chat.vehicleProblem; // Guardar el problema que describió al inicio
            }

            await updateChatState(from, 'COLLECTING_APPOINTMENT_IA', JSON.stringify({ 
                phone: from,
                problem: initialProblem
            }));
            return NextResponse.json({ ok: true });
        }


        // Send response
        await sendInBubblesGeneral(from, replyText);
        await saveChatMessage(from, 'assistant', replyText);

        // --- SISTEMA DE CAPTURA COMERCIAL / PROVEEDORES ---
        // Si el usuario está ofreciendo una alianza comercial o refacciones y ya proporcionó su nombre y correo/datos
        let finalVehicleProblem = chat?.vehicleProblem || '';
        const isSupplierQuery = textLower.includes('refaccionaria') || textLower.includes('proveedor') || 
                                textLower.includes('servicio') || textLower.includes('colaborar') || 
                                textLower.includes('comercial') || textLower.includes('adquisiciones') ||
                                (chat && chat.chatHistory && chat.chatHistory.toLowerCase().includes('proveedor'));

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

                const supplierRes = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-lite',
                    contents: supplierPrompt,
                    config: { temperature: 0.1 }
                });

                const ansJson = supplierRes.text?.replace(/```json|```/g, '').trim() || '';
                if (ansJson && ansJson !== 'NONE' && ansJson.startsWith('{')) {
                    const parsed = JSON.parse(ansJson);
                    
                    // Si ya tenemos los datos mínimos, guardamos en la Ficha de Registro IA
                    if (parsed.name && parsed.email) {
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
                    }
                }
            } catch (err) {
                console.error("Error al procesar y enviar correo de propuesta comercial:", err);
            }
        }

        // Update state to AI state
        await updateChatState(from, nextState, currentState === 'WAITING_PROBLEM_IA' ? (finalVehicleProblem || text) : finalVehicleProblem);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Webhook Processing Error [CRITICAL]:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
