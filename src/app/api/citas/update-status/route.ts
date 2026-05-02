import { NextRequest, NextResponse } from 'next/server';
import { getInventoryDoc } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const doc = await getInventoryDoc();
    const sheet = doc.sheetsByTitle["CITAS_2025"];
    if (!sheet) {
      return NextResponse.json({ error: 'Sheet not found' }, { status: 404 });
    }

    const rows = await sheet.getRows();
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
