export interface FloorStageConfig {
    id: string;
    step?: number;
    label: string;
    shortLabel: string;
    icon: string;
    progress: number;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    activeBg: string;
    activeText: string;
    activeBorder: string;
    clientMessage: string;
    isResolution?: boolean;
}

/**
 * Pipeline secuencial de trabajo activo en taller (Etapas del Car Tracker)
 */
export const WORKSHOP_PIPELINE: FloorStageConfig[] = [
    {
        id: "EN_DIAGNOSTICO",
        step: 1,
        label: "Diagnóstico y Presupuesto",
        shortLabel: "Diagnóstico",
        icon: "🔍",
        progress: 15,
        badgeBg: "bg-blue-50",
        badgeText: "text-blue-700",
        badgeBorder: "border-blue-200",
        activeBg: "bg-blue-600",
        activeText: "text-white",
        activeBorder: "border-blue-600",
        clientMessage: "Estamos evaluando tu vehículo e identificando piezas y servicios necesarios."
    },
    {
        id: "ESPERANDO_PIEZAS",
        step: 2,
        label: "Esperando Refacciones",
        shortLabel: "Refacciones",
        icon: "📦",
        progress: 30,
        badgeBg: "bg-purple-50",
        badgeText: "text-purple-700",
        badgeBorder: "border-purple-200",
        activeBg: "bg-purple-600",
        activeText: "text-white",
        activeBorder: "border-purple-600",
        clientMessage: "Presupuesto autorizado. Refacciones solicitadas en camino con proveedores."
    },
    {
        id: "EN_RAMPA",
        step: 3,
        label: "En Rampa / Trabajo Activo",
        shortLabel: "En Rampa",
        icon: "🔧",
        progress: 60,
        badgeBg: "bg-orange-50",
        badgeText: "text-[#f16315]",
        badgeBorder: "border-orange-200",
        activeBg: "bg-[#f16315]",
        activeText: "text-white",
        activeBorder: "border-orange-500",
        clientMessage: "Tus mecánicos están instalando piezas y trabajando en rampa."
    },
    {
        id: "TORNO",
        step: 4,
        label: "En rectificación",
        shortLabel: "Rectificación",
        icon: "⚙️",
        progress: 70,
        badgeBg: "bg-indigo-50",
        badgeText: "text-indigo-700",
        badgeBorder: "border-indigo-200",
        activeBg: "bg-indigo-600",
        activeText: "text-white",
        activeBorder: "border-indigo-600",
        clientMessage: "Piezas en rectificación y maquinado de precisión especializado."
    },
    {
        id: "PRUEBAS_CALIDAD",
        step: 5,
        label: "Pruebas de funcionamiento y control de calidad",
        shortLabel: "Pruebas / Calidad",
        icon: "🧪",
        progress: 85,
        badgeBg: "bg-amber-50",
        badgeText: "text-amber-800",
        badgeBorder: "border-amber-200",
        activeBg: "bg-amber-600",
        activeText: "text-white",
        activeBorder: "border-amber-600",
        clientMessage: "Reparación terminada. Realizando pruebas de funcionamiento y control de calidad."
    },
    {
        id: "LAVADO",
        step: 6,
        label: "En Lavado y Detallado",
        shortLabel: "Lavado",
        icon: "🧼",
        progress: 95,
        badgeBg: "bg-cyan-50",
        badgeText: "text-cyan-800",
        badgeBorder: "border-cyan-200",
        activeBg: "bg-cyan-600",
        activeText: "text-white",
        activeBorder: "border-cyan-600",
        clientMessage: "Tu vehículo está en área de estética y limpieza para entrega."
    },
    {
        id: "LISTO_ENTREGA",
        step: 7,
        label: "Listo para Entrega",
        shortLabel: "Listo p/ Entrega",
        icon: "🏁",
        progress: 100,
        badgeBg: "bg-emerald-50",
        badgeText: "text-emerald-800",
        badgeBorder: "border-emerald-200",
        activeBg: "bg-emerald-600",
        activeText: "text-white",
        activeBorder: "border-emerald-600",
        clientMessage: "¡Tu auto está 100% terminado! Ya puedes pasar a recogerlo a CarMD."
    },
];

/**
 * Resoluciones finales / Desenlaces del servicio (Separadas del pipeline activo)
 */
export const RESOLUTION_STATUSES: FloorStageConfig[] = [
    {
        id: "ENTREGADO",
        label: "Entregado al cliente",
        shortLabel: "Entregado",
        icon: "✅",
        progress: 100,
        badgeBg: "bg-blue-50",
        badgeText: "text-blue-700",
        badgeBorder: "border-blue-200",
        activeBg: "bg-slate-900",
        activeText: "text-white",
        activeBorder: "border-slate-900",
        clientMessage: "Vehículo entregado con éxito al cliente.",
        isResolution: true,
    },
    {
        id: "MANTENIMIENTO_SIN_NOTA",
        label: "Garantía / Mantenimiento Preventivo",
        shortLabel: "Garantía / Preventivo",
        icon: "🛠️",
        progress: 100,
        badgeBg: "bg-teal-50",
        badgeText: "text-teal-800",
        badgeBorder: "border-teal-200",
        activeBg: "bg-teal-700",
        activeText: "text-white",
        activeBorder: "border-teal-700",
        clientMessage: "Servicio de garantía o mantenimiento preventivo de cortesía.",
        isResolution: true,
    },
    {
        id: "SALIDA_SIN_NOTA",
        label: "Salida sin reparación",
        shortLabel: "Salida sin rep.",
        icon: "🚪",
        progress: 0,
        badgeBg: "bg-slate-100",
        badgeText: "text-slate-600",
        badgeBorder: "border-slate-300",
        activeBg: "bg-rose-700",
        activeText: "text-white",
        activeBorder: "border-rose-700",
        clientMessage: "Salida de unidad sin reparación (presupuesto no aceptado o retiro).",
        isResolution: true,
    },
];

export const ALL_FLOOR_STATUSES = [...WORKSHOP_PIPELINE, ...RESOLUTION_STATUSES];

/**
 * Devuelve la configuración de la etapa según el ID guardado
 */
export function getFloorStage(statusId?: string): FloorStageConfig {
    if (!statusId) return WORKSHOP_PIPELINE[2]; // Default: EN_RAMPA

    // Normalizaciones retrocompatibles
    const upper = statusId.toUpperCase().trim();
    if (upper === "EN_REPARACION" || upper === "RAMPA") return WORKSHOP_PIPELINE[2];
    if (upper === "ENTREGA" || upper === "LISTO") return WORKSHOP_PIPELINE[6];

    const found = ALL_FLOOR_STATUSES.find(s => s.id === upper);
    return found || WORKSHOP_PIPELINE[2]; // Fallback EN_RAMPA
}
