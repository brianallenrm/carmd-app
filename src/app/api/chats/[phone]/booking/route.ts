import { NextRequest, NextResponse } from 'next/server';
import { getInventoryDoc } from '@/lib/google-sheets';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ phone: string }> }
) {
    try {
        const { phone } = await params;
        const cleanPhone = phone.replace(/\D/g, '').slice(-10); // Last 10 digits

        const doc = await getInventoryDoc();
        const sheet = doc.sheetsByTitle["CITAS_2025"];
        if (!sheet) {
            return NextResponse.json({ cita: null });
        }

        const rows = await sheet.getRows();
        const row = rows.find(r => {
            const val = r.get("WhatsApp");
            if (!val || typeof val !== 'string') return false;
            return val.replace(/\D/g, '').endsWith(cleanPhone);
        });

        if (!row) {
            return NextResponse.json({ cita: null });
        }

        return NextResponse.json({
            cita: {
                name: row.get("Nombre"),
                email: row.get("Email"),
                vehicle: row.get("Vehiculo"),
                year: row.get("Año"),
                km: row.get("KM"),
                plate: row.get("Placa"),
                date: row.get("Fecha_Cita"),
                time: row.get("Hora_Cita"),
                problem: row.get("Problema")
            }
        });
    } catch (error) {
        console.error("Error in GET /api/chats/[phone]/booking:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
