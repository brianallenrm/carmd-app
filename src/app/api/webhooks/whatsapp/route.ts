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
- Si reportan fallas graves (humo, sin frenos, etc.): Sé empática, tranquiliza al cliente y explícale que daremos total prioridad a su caso. Sugiérele traerlo directamente y agendar su recepción en este chat. NUNCA des números telefónicos ni sugieras llamadas.

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
        const text = message.text?.body?.trim();
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
        
        // Guardar mensaje en el historial CHAT_MESSAGES
        await saveChatMessage(from, 'client', text);
        
        // 1. Check current state in Sheets
        console.log(`[Webhook] Buscando estado en Google Sheets para ${from}...`);
        let chat = await getChatState(from);
        console.log(`[Webhook] Estado recuperado:`, chat);

        // Si es una conversación totalmente nueva (no registrada en CHAT_SESSIONS), alertamos a los administradores
        if (!chat) {
            console.log(`[Webhook] Nueva conversación detectada para ${from}. Enviando alertas a los administradores...`);
            const adminNotifyText = `📢 *NUEVA CONVERSACIÓN INICIADA*\n\nEl número +${from} ha iniciado un chat con Mariana (IA).\n\nPuedes monitorear y gestionar la conversación en tiempo real desde tu Portal:\n👉 carmd.com.mx/os/chats`;
            
            const rafaPhone = "525516473084";
            const momPhone = "525535786087";

            // Enviar alerta a Rafael
            try {
                await sendWhatsAppMessage(rafaPhone, adminNotifyText);
            } catch (e) {
                console.error("Error al alertar a Rafael sobre inicio de chat:", e);
            }

            // Enviar alerta a Mamá
            try {
                await sendWhatsAppMessage(momPhone, adminNotifyText);
            } catch (e) {
                console.error("Error al alertar a Mamá sobre inicio de chat:", e);
            }
        }

        // If the state is HUMAN_REQUIRED, the bot stays silent and doesn't auto-respond.
        if (chat?.state === 'HUMAN_REQUIRED') {
            console.log(`[Webhook] Chat en estado HUMAN_REQUIRED para ${from}. Bot silenciado.`);
            return NextResponse.json({ ok: true });
        }

        // Detect if the user wants human intervention, is complaining, has a critical issue, or asks for offsite services
        const isUrgentOrComplaint = 
            textLower.includes('reclamacion') || 
            textLower.includes('queja') || 
            textLower.includes('quedo mal') ||
            textLower.includes('sigue fallando') || 
            textLower.includes('hablar con el dueño') || 
            textLower.includes('gerente') ||
            textLower.includes('humano') ||
            textLower.includes('auxilio vial') ||
            textLower.includes('me quede tirado') ||
            textLower.includes('tirado') ||
            textLower.includes('grúa') ||
            textLower.includes('inspeccion a domicilio') ||
            textLower.includes('inspeccion fuera') ||
            textLower.includes('revisar un coche que quiero comprar') ||
            textLower.includes('inspeccion de compra');

        if (isUrgentOrComplaint) {
            console.log(`[Webhook] Solicitud de servicio especial, auxilio o queja detectada. Cambiando estado a HUMAN_REQUIRED.`);
            
            const apologyMessage = `Entendido. 📞 Para este tipo de servicios especiales o de auxilio, por favor espera un momento; un miembro de nuestro equipo en CarMD se comunicará contigo personalmente a la brevedad para brindarte más información y seguimiento. Detendré mis respuestas automáticas por aquí.`;
            await sendWhatsAppMessage(from, apologyMessage);
            await saveChatMessage(from, 'assistant', apologyMessage);
            await updateChatState(from, 'HUMAN_REQUIRED', text);
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

        // --- Handle Final Booking Confirmation State (Isolate from Gemini to prevent loop) ---
        if (chat?.state === 'WAITING_CONFIRMATION_IA') {
            console.log("[Webhook] Evaluando confirmación final en WAITING_CONFIRMATION_IA con IA...");
            
            let tempParams: any = {};
            try {
                if (chat.vehicleProblem && chat.vehicleProblem.startsWith('{')) {
                    tempParams = JSON.parse(chat.vehicleProblem);
                }
            } catch (e) {}

            // Usar Gemini de forma ultra rápida para evaluar si el texto es afirmativo
            let isAffirmative = false;
            try {
                const evalPrompt = `Analiza si este mensaje es una aceptación, confirmación o aprobación a la propuesta anterior de agendar su cita: "${text}".
                Acepta respuestas afirmativas directas, informales, modismos mexicanos o positivos (ej: "si", "va", "chido", "sobres", "perfecto", "confirmo", "adelante", "chévere", "dale", "está bien", "procede", "ok").
                Responde ÚNICAMENTE con la palabra "YES" si es afirmativo/aprobación, o "NO" si es negativo, duda o si desea realizar algún cambio.`;
                
                const evalRes = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-lite',
                    contents: evalPrompt,
                    config: { temperature: 0.1 }
                });
                
                const ans = evalRes.text?.trim().toUpperCase() || 'NO';
                console.log(`[Webhook] Evaluación semántica de confirmación: "${ans}"`);
                isAffirmative = ans.includes('YES');
            } catch (e) {
                console.error("Error evaluando confirmación con IA:", e);
            }

            if (isAffirmative) {
                console.log("[Webhook] Confirmación afirmativa recibida. Registrando cita definitiva...");
                const confirmationMsg = `¡Excelente! Estoy agendando tu cita y notificando a nuestro equipo. Te esperamos en nuestro Centro de Servicio. 🚗💨`;
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
                            problem: tempParams.problem || 'Diagnóstico general'
                        })
                    });
                } catch (e) {
                    console.error("Error al llamar API reserve:", e);
                }
                
                // Limpiar estado a completado
                await updateChatState(from, 'COMPLETED');
                return NextResponse.json({ ok: true });
            } else {
                // Si dice que no o quiere cambiar algo, regresamos a la recolección
                console.log("[Webhook] El cliente no confirmó o desea cambiar datos. Regresando a recolección.");
                const retryMsg = `Entendido. ¿Qué dato te gustaría corregir o qué cambio hacemos en tu cita? 🛠️`;
                await sendWhatsAppMessage(from, retryMsg);
                await saveChatMessage(from, 'assistant', retryMsg);
                await updateChatState(from, 'COLLECTING_APPOINTMENT_IA', JSON.stringify(tempParams));
                return NextResponse.json({ ok: true });
            }
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
            
            REGLAS DE EXTRACCIÓN DE DATOS:
            1. REGLA DE LIMPIEZA DE MARCAS: Si detectas un error de dedo obvio en la marca o modelo (ej: "btw" en lugar de "BMW", "toyot" por "Toyota", "va" por "VW"), corrígelo en el campo 'vehicle' para que se guarde de forma profesional en el JSON.
            2. SEPARACIÓN DE PREGUNTAS Y MOTIVOS: Si el cliente hace una pregunta como "¿para qué quieres las placas?", "¿cuánto cuesta?", etc., esto NUNCA debe ser guardado en el campo 'problem'. El campo 'problem' se llena únicamente con síntomas reales del coche (frenos, afinación, ruido, etc.) o solicitudes de servicio.
            3. SI EL USUARIO INDICA CORREGIR UN DATO (ej: "el problema no es afinación, es frenos"): Borra o reemplaza el dato anterior con el valor que indica el usuario ahora.
            4. CORRECCIÓN DE FECHA EN EL JSON: Si el usuario dice una fecha numérica y un día de la semana que son incompatibles o erróneos (como decir "miércoles 14" cuando el miércoles es 15 de julio de 2026), debes guardar en el campo 'date' la fecha REAL corregida del calendario (miércoles 15 de julio).
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
                replyText = `Disculpa la confusión, Pamela. 🗓️ Los domingos nuestro Centro de Servicio está cerrado para descansar. \n\nEstamos listos para recibir tu auto de lunes a viernes de 8:00 AM a 5:00 PM y sábados de 8:00 AM a 2:00 PM. ¿Qué otro día y hora te vendría bien? 😊`;
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
                                       mergedParams.email && mergedParams.email !== '...' &&
                                       mergedParams.km && mergedParams.km !== '...';
                                       
                if (!hasContactInfo) {
                    // Sobreescribimos la respuesta para obligar a pedir los datos restantes antes de derivar
                    replyText = `Entiendo perfectamente. Para darte el costo aproximado y evitar cualquier error con las piezas específicas de tu auto, le pediré a un asesor de nuestro equipo que te cotice personalmente por aquí. \n\nPara tener tu cotización lista, ¿me podrías compartir tu *nombre completo*, un *correo electrónico* y el *kilometraje* aproximado de tu vehículo? 📋`;
                } else {
                    // Si ya los tenemos completos, enviamos el mensaje de derivación final y silenciamos
                    const finalDerivationMsg = `Muchas gracias, ${mergedParams.name}. Ya registré tu información y se la he pasado a nuestro asesor. Por favor danos unos minutos; a la brevedad se comunicarán de CarMD contigo por este mismo chat para darte el costo aproximado. Detendré mis respuestas automáticas. ¡Bonito día! 👋`;
                    await sendWhatsAppMessage(from, finalDerivationMsg);
                    await saveChatMessage(from, 'assistant', finalDerivationMsg);
                    await updateChatState(from, 'HUMAN_REQUIRED', JSON.stringify(mergedParams));
                    return NextResponse.json({ ok: true });
                }
            }

            if (hasRequiredFieldsForSummary) {
                // Si ya tenemos todo, pasamos al estado de confirmación y le presentamos el resumen
                const summaryText = `¡Listo! Ya tengo toda la información. Por favor confírmame si los datos de tu cita son correctos:
 
👤 *Nombre*: ${mergedParams.name}
📧 *Correo*: ${mergedParams.email || 'N/A'}
🚗 *Vehículo*: ${mergedParams.vehicle} ${mergedParams.year || ''}
🛞 *Kilometraje*: ${mergedParams.km} KM
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
            const isAffirmative = textClean.includes('si') || textClean.includes('sí') || textClean.includes('confirm') || 
                                  textClean.includes('acuerdo') || textClean.includes('bien') || textClean.includes('perfecto') ||
                                  textClean.includes('correcto') || textClean.includes('agrada') || textClean.includes('dale');

            if (isAffirmative) {
                console.log("[Webhook] Confirmación afirmativa recibida. Registrando cita definitiva...");
                
                // Evaluar si es tarde (después de las 8:00 PM o antes de las 7:30 AM en CDMX)
                const mxDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
                const mxHour = mxDate.getHours();
                const mxMinutes = mxDate.getMinutes();
                const totalMinutes = mxHour * 60 + mxMinutes;
                
                const isLateNight = totalMinutes >= 20 * 60 || totalMinutes < 7.5 * 60; // 8:00 PM (1200 mins) o 7:30 AM (450 mins)
                
                let confirmationMsg = `¡Excelente! Estoy agendando tu cita y notificando a nuestro equipo. Te esperamos en nuestro Centro de Servicio. 🚗💨`;
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

        let systemInstruction = SYSTEM_PROMPT;
        systemInstruction += `\n\nFECHA Y HORA ACTUAL DE REFERENCIA: ${cdmxTimeStr}. HOY ES DÍA: ${dayName.toUpperCase()}. (Calcula correctamente el día de la semana relativo a hoy: si hoy es ${dayName}, mañana es el siguiente día. Recuerda que los domingos el Centro de Servicio está CERRADO).`;
        
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

        // Update state to AI state
        await updateChatState(from, nextState, currentState === 'WAITING_PROBLEM_IA' ? text : chat?.vehicleProblem);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Webhook Processing Error [CRITICAL]:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
