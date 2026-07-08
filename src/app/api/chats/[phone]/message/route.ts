import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { updateChatState, saveChatMessage } from '@/lib/google-sheets';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ phone: string }> }
) {
    try {
        const { phone } = await params;
        const body = await req.json();
        const { text } = body;

        if (!text || text.trim() === '') {
            return NextResponse.json({ error: "Missing message text" }, { status: 400 });
        }

        // 1. Enviar el mensaje físico al WhatsApp del cliente por API de Meta
        console.log(`[API Message] Enviando mensaje manual a ${phone}: "${text}"`);
        await sendWhatsAppMessage(phone, text);

        // 2. Guardar en la base de datos como enviado por 'admin'
        await saveChatMessage(phone, 'admin', text);

        // 3. Forzar el estado del chat a HUMAN_REQUIRED para silenciar a Mariana (IA) de inmediato
        await updateChatState(phone, 'HUMAN_REQUIRED');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in POST /api/chats/[phone]/message:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
