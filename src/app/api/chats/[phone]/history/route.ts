import { NextRequest, NextResponse } from 'next/server';
import { getChatMessages } from '@/lib/google-sheets';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ phone: string }> }
) {
    try {
        const { phone } = await params;
        const messages = await getChatMessages(phone);
        return NextResponse.json({ messages });
    } catch (error) {
        console.error("Error in GET /api/chats/[phone]/history:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
