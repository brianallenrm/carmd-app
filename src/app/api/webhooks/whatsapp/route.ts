import { NextRequest, NextResponse } from 'next/server';
import { WHATSAPP_CONFIG } from '@/lib/constants';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getChatState, updateChatState } from '@/lib/google-sheets';

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

        if (!text) return NextResponse.json({ ok: true });

        // --- Core Bot Logic ---
        
        // 1. Check current state
        const chat = await getChatState(from);

        if (!chat || chat.state === 'COMPLETED' || chat.state === 'START') {
            // STEP 1: GREETING + QUESTION
            const greeting = `Hola 👋 Soy el asistente virtual de CarMD. Para poder ayudarte de la mejor manera, cuéntame: ¿Qué problema presenta tu vehículo hoy?`;
            
            await sendWhatsAppMessage(from, greeting);
            await updateChatState(from, 'WAITING_PROBLEM');
            
        } else if (chat.state === 'WAITING_PROBLEM') {
            // STEP 2: AUTHORITY + LINK
            const response = `Perfecto, gracias por la info 🙌. Nuestro equipo técnico revisa cada caso personalmente para asegurar una solución precisa.

Para continuar, necesito que registres tu solicitud aquí:
👉 carmd.com.mx/citas
⏱️ Te toma 1 minuto

En cuanto lo envíes:
✔️ Revisamos tu caso
✔️ Validamos disponibilidad
✔️ Te confirmamos por aquí mismo

Así evitamos hacerte perder tiempo 👍`;

            await sendWhatsAppMessage(from, response);
            await updateChatState(from, 'WAITING_FORM', text); // Store the problem reported
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Webhook Processing Error:", error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
