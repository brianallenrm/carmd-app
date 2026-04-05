import { NextRequest, NextResponse } from 'next/server';
import { unlockVehicleData } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  const { plate, lastDigits } = await request.json();

  if (!plate || !lastDigits) {
    return NextResponse.json({ error: 'Plate and last 4 digits are required' }, { status: 400 });
  }

  try {
    const result = await unlockVehicleData(plate, lastDigits);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error unlocking data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
