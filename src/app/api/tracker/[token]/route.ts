import { NextResponse } from 'next/server';
import { getVehicleTrackerData } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await context.params;

        if (!token) {
            return NextResponse.json(
                { error: 'Token de seguimiento no proporcionado' },
                { status: 400 }
            );
        }

        const data = await getVehicleTrackerData(token);

        if (!data) {
            return NextResponse.json(
                { error: 'Vehículo no encontrado o enlace inválido' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, tracker: data },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, max-age=0, must-revalidate',
                },
            }
        );
    } catch (error) {
        console.error('[API Tracker GET Error]', error);
        return NextResponse.json(
            { error: 'Error al consultar el seguimiento del vehículo' },
            { status: 500 }
        );
    }
}
