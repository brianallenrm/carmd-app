import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isPastAppointmentDate(dateStr: string): boolean {
    if (!dateStr || dateStr === '...' || dateStr === 'N/A' || dateStr.trim().length === 0) return false;

    // Normalizar a fecha de medianoche (hora de referencia)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cleanStr = dateStr.trim();
    const parts = cleanStr.split(/[-/]/);
    let appDate: Date | null = null;

    if (parts.length === 3) {
        if (parts[0].length === 4) {
            // YYYY-MM-DD
            appDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
            // DD/MM/YYYY
            const y = parseInt(parts[2]);
            const fullY = y < 100 ? y + 2000 : y;
            appDate = new Date(fullY, parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
    } else {
        const d = new Date(cleanStr);
        if (!isNaN(d.getTime())) appDate = d;
    }

    if (!appDate || isNaN(appDate.getTime())) return false;
    appDate.setHours(0, 0, 0, 0);

    // Retorna true si la fecha de la cita fue anterior a hoy (ayer o más vieja)
    return appDate.getTime() < today.getTime();
}

