import { NextResponse } from 'next/server';
import { getCitas } from '@/lib/google-sheets';

export async function GET() {
  try {
    const citas = await getCitas();
    // Return only "Pendiente" or "Confirmada" but prioritize Pending
    const pendingCitas = citas
      .filter(c => c.status === "Pendiente")
      .sort((a, b) => {
        // Sort by timestamp descending (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
    return NextResponse.json(pendingCitas);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}
