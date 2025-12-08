import { NextResponse } from 'next/server';
import { lookupVehicleByPlate } from '@/lib/google-sheets';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const plate = searchParams.get('plate');

    if (!plate) {
        return NextResponse.json({ error: 'Plate number is required' }, { status: 400 });
    }

    try {
        const result = await lookupVehicleByPlate(plate);

        if (!result) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Google Sheets Lookup Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vehicle data', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
