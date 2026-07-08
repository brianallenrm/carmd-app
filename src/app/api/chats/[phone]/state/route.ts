import { NextRequest, NextResponse } from 'next/server';
import { updateChatState } from '@/lib/google-sheets';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ phone: string }> }
) {
    try {
        const { phone } = await params;
        const body = await req.json();
        const { state, vehicleProblem } = body;

        if (!state) {
            return NextResponse.json({ error: "Missing state field" }, { status: 400 });
        }

        await updateChatState(phone, state, vehicleProblem);
        console.log(`[API State] Estado del chat ${phone} actualizado manualmente a: ${state}`);
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in PUT /api/chats/[phone]/state:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
