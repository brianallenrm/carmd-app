import { NextResponse } from 'next/server';
import { getInventoryDoc } from '@/lib/google-sheets';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';

export async function GET() {
    try {
        const doc = await getInventoryDoc();
        const sheet = doc.sheetsByTitle[GOOGLE_SHEETS_CONFIG.INVENTORY.CHAT_SESSIONS_TAB!];
        if (!sheet) {
            return NextResponse.json({ sessions: [] });
        }

        const rows = await sheet.getRows();
        const sessions = rows.map(r => ({
            phone: r.get("phone"),
            state: r.get("state"),
            lastUpdate: r.get("last_update"),
            vehicleProblem: r.get("vehicle_problem")
        }));

        // Ordenamos por fecha de última actualización descendente (los más recientes primero)
        sessions.sort((a, b) => new Date(b.lastUpdate || 0).getTime() - new Date(a.lastUpdate || 0).getTime());

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error("Error in GET /api/chats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
