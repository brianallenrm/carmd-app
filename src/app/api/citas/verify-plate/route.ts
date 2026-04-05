import { NextRequest, NextResponse } from 'next/server';
import { checkVehiclePlate } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const plate = searchParams.get('plate');

  if (!plate) {
    return NextResponse.json({ error: 'Plate is required' }, { status: 400 });
  }

  try {
    const result = await checkVehiclePlate(plate);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error verifying plate:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
