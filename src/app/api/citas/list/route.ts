import { NextResponse } from 'next/server';
import { getCitas } from '@/lib/google-sheets';
import { isPastAppointmentDate } from '@/lib/utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'active'; // 'active' | 'expired' | 'all'
    const returnMeta = searchParams.get('meta') === 'true';

    const citas = await getCitas();
    
    // Filtrar citas que requieren atención (Pendiente o Esperando Confirmación)
    const pendingCitas = citas
      .filter(c => c.status === "Pendiente" || c.status === "Esperando Confirmación")
      .sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

    const active = pendingCitas.filter(c => !isPastAppointmentDate(c.date));
    const expired = pendingCitas.filter(c => isPastAppointmentDate(c.date));

    if (returnMeta) {
      return NextResponse.json({
        active,
        expired,
        totalPending: pendingCitas.length,
        activeCount: active.length,
        expiredCount: expired.length
      });
    }

    if (view === 'expired') {
      return NextResponse.json(expired);
    } else if (view === 'all') {
      return NextResponse.json(pendingCitas);
    } else {
      // Por defecto 'active' (hoy y próximas)
      return NextResponse.json(active);
    }
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

