import { NextRequest, NextResponse } from 'next/server';
import { getInventoryDoc } from '@/lib/google-sheets';
import { isPastAppointmentDate } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ids, status, archiveExpired } = body;

    const doc = await getInventoryDoc();
    const sheet = doc.sheetsByTitle["CITAS_2025"];
    if (!sheet) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    const rows = await sheet.getRows();

    // Opción para archivar todas las citas pendientes pasadas
    if (archiveExpired) {
      let archivedCount = 0;
      for (const row of rows) {
        const rowStatus = row.get("Estatus") || "Pendiente";
        if (rowStatus === "Pendiente" || rowStatus === "Esperando Confirmación") {
          const dateStr = row.get("Fecha_Cita");
          if (isPastAppointmentDate(dateStr)) {
            row.set("Estatus", "Archivada");
            await row.save();
            archivedCount++;
          }
        }
      }
      return NextResponse.json({ success: true, archivedCount });
    }

    // Actualización masiva por IDs
    if (ids && Array.isArray(ids)) {
      for (const singleId of ids) {
        const r = rows.find(row => row.rowNumber === singleId);
        if (r) {
          r.set("Estatus", status || "Archivada");
          await r.save();
        }
      }
      return NextResponse.json({ success: true, count: ids.length });
    }

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const row = rows.find(r => r.rowNumber === id);
    if (!row) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    row.set("Estatus", status);
    await row.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

