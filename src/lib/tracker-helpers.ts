import {
    WORKSHOP_PIPELINE,
    getFloorStage,
    CarTrackerStep,
    FloorStageConfig
} from "@/types/floor-pipeline";
import { COMPANY_DEFAULTS } from "@/lib/constants";

export const parseDate = (dateVal: any, timeVal?: any): number => {
    if (!dateVal) return 0;

    let year: number, month: number, day: number;

    if (typeof dateVal === 'number') {
        const d = new Date((dateVal - 25569) * 86400 * 1000);
        year = d.getUTCFullYear();
        month = d.getUTCMonth();
        day = d.getUTCDate();
    } else {
        const str = String(dateVal).trim();
        const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
        const dmyMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);

        if (isoMatch) {
            year = parseInt(isoMatch[1]);
            month = parseInt(isoMatch[2]) - 1;
            day = parseInt(isoMatch[3]);
        } else if (dmyMatch) {
            let a = parseInt(dmyMatch[1]);
            let b = parseInt(dmyMatch[2]);
            year = parseInt(dmyMatch[3]);
            if (year < 100) year += 2000;

            const now = new Date();
            const testDate = new Date(year, b - 1, a);
            if (a <= 12 && testDate > now) {
                month = a - 1;
                day = b;
            } else {
                month = b - 1;
                day = a;
            }
        } else {
            const d = new Date(str);
            if (isNaN(d.getTime())) return 0;
            year = d.getFullYear();
            month = d.getMonth();
            day = d.getDate();
        }
    }

    let hours = 0, minutes = 0, seconds = 0;
    if (timeVal !== undefined && timeVal !== null && timeVal !== '') {
        if (typeof timeVal === 'number' || (!isNaN(Number(timeVal)) && !String(timeVal).includes(':'))) {
            const fraction = parseFloat(String(timeVal));
            const totalSeconds = Math.round(fraction * 86400);
            hours = Math.floor(totalSeconds / 3600);
            minutes = Math.floor((totalSeconds % 3600) / 60);
            seconds = totalSeconds % 60;
        } else {
            const timeStr = String(timeVal).trim().toLowerCase();
            const match = timeStr.match(/(\d{1,2})[:.](\d{1,2})(?::(\d{1,2}))?\s*([ap][\s.]*[m][.]?)?/);
            if (match) {
                hours = parseInt(match[1]);
                minutes = parseInt(match[2]);
                seconds = match[3] ? parseInt(match[3]) : 0;
                const ampm = match[4];
                if (ampm) {
                    if (ampm.includes('p') && hours < 12) hours += 12;
                    if (ampm.includes('a') && hours === 12) hours = 0;
                }
            }
        }
    }

    const isoString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}-06:00`;
    const finalTs = new Date(isoString).getTime();
    return isNaN(finalTs) ? 0 : finalTs;
};

export const formatDateDisplay = (ts: number): string => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString('es-MX', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Mexico_City'
    });

    if (isToday) {
        return `Hoy, ${timeStr}`;
    }

    const dateStr = date.toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', timeZone: 'America/Mexico_City'
    });

    return `${dateStr} · ${timeStr}`;
};

export const timeAgo = (ts: number): string => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Hace un momento';
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
};

export const extractFirstName = (fullName: string): string => {
    if (!fullName) return 'Cliente';
    const clean = fullName.trim().replace(/^(sr\.|sra\.|ing\.|lic\.|dr\.|dra\.)\s+/i, '');
    const parts = clean.split(/\s+/);
    return parts[0] || 'Cliente';
};

export const buildCustomerPipeline = (currentStatusId: string): CarTrackerStep[] => {
    const activeStage = getFloorStage(currentStatusId);
    const isResolution = Boolean(activeStage.isResolution);
    const activeStep = activeStage.step ?? 3;

    return WORKSHOP_PIPELINE.map((stage) => {
        const stepNum = stage.step ?? 0;
        let isCompleted = false;
        let isCurrent = false;
        let isPending = false;

        if (isResolution) {
            // Si es resolución (ej. Salida sin reparación o Garantía), se refleja según el caso
            isCompleted = false;
            isCurrent = false;
            isPending = true;
        } else if (stage.id === activeStage.id) {
            isCurrent = true;
        } else if (stepNum < activeStep) {
            isCompleted = true;
        } else {
            isPending = true;
        }

        return {
            ...stage,
            isCompleted,
            isCurrent,
            isPending
        };
    });
};

export const getWorkshopInfo = () => {
    return {
        name: "CarMD Diagnóstico Mecánico Automotriz",
        address: "Calle Palacio de Iturbide No. 233, Col. Metropolitana 2da. Secc.",
        fullAddress: "Calle Palacio de Iturbide No. 233, Col. Metropolitana 2da. Secc., 57740 Nezahualcóyotl, Estado de México",
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=CarMD+Diagnostico+Mecanico+Automotriz",
        wazeUrl: "https://waze.com/ul?q=Calle%20Palacio%20de%20Iturbide%20233%20Nezahualcoyotl",
        schedule: "Lunes a Viernes 9:00 - 18:00 | Sábado 9:00 - 14:00"
    };
};
