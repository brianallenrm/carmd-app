export interface QualityInspectionData {
    id: string;
    plate: string;
    status: 'aprobado' | 'pendiente';
    inspector: string;
    technician: string;
    assistantTechnician?: string;
    timestamp: string;

    // 🚨 Bloque 1: Seguridad Crítica (Fallas Fatales - 0 Tolerancia)
    critical: {
        wheelsTorqued: boolean;
        wheelsDetail: {
            frontLeft: boolean;
            frontRight: boolean;
            rearLeft: boolean;
            rearRight: boolean;
        };
        oilAndFilterOk: boolean;
        brakeFluidAndPedalOk: boolean;
        coolantCapOk: boolean;
        tirePressureOk: boolean;
        roadTestAndDashboardOk: boolean;
    };

    // ✨ Bloque 2: Calidad, Estética e Interiores
    aesthetic: {
        cleanInteriorNoGrease: boolean;
        belongingsReturned: boolean;
        washAndVacuumDone: boolean;
        toolsAndSpareSecured: boolean;
    };

    dashboardPhotoUrl?: string;
    notes?: string;
}

export const createDefaultQualityInspection = (
    plate: string,
    technician: string = "",
    assistantTechnician: string = ""
): QualityInspectionData => ({
    id: `qa-${Date.now()}`,
    plate: plate.toUpperCase().replace(/[^A-Z0-9]/g, ''),
    status: 'pendiente',
    inspector: 'Daniel',
    technician: technician || '',
    assistantTechnician: assistantTechnician || '',
    timestamp: new Date().toISOString(),
    critical: {
        wheelsTorqued: false,
        wheelsDetail: {
            frontLeft: false,
            frontRight: false,
            rearLeft: false,
            rearRight: false,
        },
        oilAndFilterOk: false,
        brakeFluidAndPedalOk: false,
        coolantCapOk: false,
        tirePressureOk: false,
        roadTestAndDashboardOk: false,
    },
    aesthetic: {
        cleanInteriorNoGrease: false,
        belongingsReturned: false,
        washAndVacuumDone: false,
        toolsAndSpareSecured: false,
    },
    dashboardPhotoUrl: '',
    notes: '',
});

/**
 * Retorna true solo si todos los puntos críticos de seguridad están verificados
 */
export const isQualityInspectionApproved = (data?: QualityInspectionData | null): boolean => {
    if (!data) return false;
    if (data.status !== 'aprobado') return false;

    const { critical } = data;
    if (!critical) return false;

    const wheelsOk = critical.wheelsTorqued &&
        critical.wheelsDetail.frontLeft &&
        critical.wheelsDetail.frontRight &&
        critical.wheelsDetail.rearLeft &&
        critical.wheelsDetail.rearRight;

    return Boolean(
        wheelsOk &&
        critical.oilAndFilterOk &&
        critical.brakeFluidAndPedalOk &&
        critical.coolantCapOk &&
        critical.tirePressureOk &&
        critical.roadTestAndDashboardOk &&
        Boolean(data.inspector?.trim())
    );
};
