import { NextResponse } from 'next/server';
import { getCitas } from '@/lib/google-sheets';

export async function GET() {
  try {
    const citas = await getCitas();
    return NextResponse.json({ citas });
  } catch (error) {
    console.error('Error fetching citas:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
