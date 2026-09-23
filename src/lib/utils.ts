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

/**
 * Normaliza y formatea direcciones mexicanas aplicando Title Case,
 * prefijo "Col.", prefijo "Del." (CDMX) o "Mun." (Edo. Méx. y resto de estados),
 * y estandarización de estado ("CDMX" o "Edo. Méx.").
 */
export function formatMexicanAddress({
    street,
    colonia,
    munDel,
    state,
}: {
    street?: string;
    colonia?: string;
    munDel?: string;
    state?: string;
}): string {
    const toTitleCase = (str: string) => {
        if (!str) return "";
        const smallWords = new Set(["de", "del", "la", "las", "los", "y", "en", "el", "o"]);
        return str
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .map((word, idx) => {
                if (idx > 0 && smallWords.has(word)) return word;
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(" ");
    };

    // 1. Calle y Número
    let formattedStreet = "";
    if (street && street.trim()) {
        let clean = toTitleCase(street);
        clean = clean.replace(/\bno\.?\s*/gi, "No. ");
        clean = clean.replace(/\bnum\.?\s*/gi, "No. ");
        clean = clean.replace(/#\s*/g, "No. ");
        formattedStreet = clean.trim();
    }

    // 2. Estado & CDMX check
    const rawState = (state || "").trim();
    const rawMunDel = (munDel || "").trim();
    const isCdmx = /cdmx|ciudad de m|d\.f\.|distrito federal/i.test(rawState) || /cdmx/i.test(rawMunDel);
    const isEdomex = /estado de m|edo\.?\s*m|mexico|méxico/i.test(rawState);

    let formattedState = "";
    if (rawState) {
        if (isCdmx) formattedState = "CDMX";
        else if (isEdomex) formattedState = "Edo. Méx.";
        else formattedState = toTitleCase(rawState);
    }

    // 3. Colonia
    let formattedColonia = "";
    if (colonia && colonia.trim()) {
        let clean = toTitleCase(colonia);
        if (!/^col\.?/i.test(clean) && !/^colonia/i.test(clean)) {
            clean = `Col. ${clean}`;
        } else {
            clean = clean.replace(/^colonia\s+/i, "Col. ").replace(/^col\.?\s*/i, "Col. ");
        }
        formattedColonia = clean.trim();
    }

    // 4. Delegación o Municipio
    let formattedMunDel = "";
    if (rawMunDel) {
        let clean = toTitleCase(rawMunDel);
        clean = clean
            .replace(/^(del\.?|delegaci[oó]n|alcald[ií]a|mun\.?|municipio)\s+/i, "")
            .trim();

        if (clean) {
            const prefix = isCdmx ? "Del." : "Mun.";
            formattedMunDel = `${prefix} ${clean}`;
        }
    }

    return [formattedStreet, formattedColonia, formattedMunDel, formattedState]
        .filter(Boolean)
        .join(", ");
}

