import { ServiceNoteData } from "@/types/service-note";

export const COMPANY_DEFAULTS = {
    name: "Rivera Moya B.A.",
    rfc: "RIMB960505SXA",
    address: "Calle Palacio de Iturbide No. 233 Col. Metropolitana 2da. Secc. Cd. Nezahualcoyotl, Estado de Mexico C.P. 57740",
    phone: "", // User said only WhatsApp exists
    whatsapp: "56 1190 4066",
    email: "contacto@carmd.com.mx",
    website: "carmd.com.mx",
};

export const LEGAL_TEXT = `Por medio de la presente, autorizo a CarMD / Rivera Moya B.A. a realizar los servicios de mantenimiento y reparación descritos en la parte superior de esta Orden de Trabajo. Asimismo, autorizo la instalación de las refacciones necesarias, mismas que se cobran por separado y deberán ser nuevas, conforme al Art. 39 de la Ley Federal de Protección al Consumidor. El vehículo aquí descrito queda depositado en el(los) taller(es) de CarMD. En caso de ser necesaria una aclaración, inspección o reclamación ante autoridades, dichas reparaciones no podrán ser realizadas sin mi consentimiento, ya sea por escrito o vía telefónica. Autorizo el uso de mi vehículo dentro de los límites de esta ciudad y área metropolitana únicamente para pruebas y verificación de las reparaciones. CarMD no se hace responsable por pérdida de objetos personales dentro del vehículo, ni por daños derivados de causa de fuerza mayor. La garantía de los trabajos realizados se rige por el Art. 40 de la Ley Federal de Protección al Consumidor. Cualquier inconformidad deberá reclamarse dentro de los 30 días posteriores a la entrega del vehículo. Una vez notificado que el vehículo está listo, me comprometo a acudir al taller en un plazo no mayor a 24 horas para revisarlo y recogerlo. En caso de estar conforme, deberé liquidar el importe de los trabajos dentro de las 24 horas siguientes. Si no recojo el vehículo en ese plazo, se generará un cargo por almacenaje, conforme a la tarifa oficial vigente para este tipo de servicios. El vehículo descrito queda como garantía prendaria conforme al Art. 334 de la Ley General de Títulos y Operaciones de Crédito, hasta que el adeudo sea liquidado. En caso de cheque devuelto, CarMD se reserva el derecho de cobrar el 20% por indemnización, de acuerdo con el Art. 193 de la Ley antes citada. Ambas partes acuerdan nombrar a la Procuraduría Federal del Consumidor (PROFECO) como conciliador para resolver cualquier controversia relacionada con este documento. Después de revisar y aprobar el automóvil entregado, manifiesto estar conforme con los trabajos realizados, recibiendo en este acto las refacciones y piezas usadas que fueron sustituidas. Este pagaré es mercantil y se rige por la Ley General de Títulos y Operaciones de Crédito, Art. 173 y correlativos. El importe de esta factura causará intereses moratorios del 9% mensual en caso de no ser liquidado en el plazo convenido.`;

export const numberToLetters = (amount: number): string => {
    const units = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
    const tens = ["", "DIEZ", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
    const teens = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE"];

    const getGroup = (n: number): string => {
        let output = "";
        if (n === 100) return "CIEN";
        if (n > 100) {
            const hundreds = Math.floor(n / 100);
            if (n < 200) {
                output += "CIENTO ";
            } else if (hundreds === 5) {
                output += "QUINIENTOS ";
            } else if (hundreds === 7) {
                output += "SETECIENTOS ";
            } else if (hundreds === 9) {
                output += "NOVECIENTOS ";
            } else {
                output += units[hundreds] + "CIENTOS ";
            }
            n %= 100;
        }

        if (n >= 20) {
            const ten = Math.floor(n / 10);
            output += tens[ten];
            if (n % 10 > 0) output += " Y " + units[n % 10];
        } else if (n >= 10) {
            output += teens[n - 10];
        } else if (n > 0) {
            output += units[n];
        }
        return output;
    };

    const thousands = Math.floor(amount / 1000);
    const remainder = Math.floor(amount % 1000); // Use Math.floor to ignore pennies in letter conversion? Or handle them.

    // Simple logic for this use case:
    let result = "";
    if (thousands > 0) {
        if (thousands === 1) result += "MIL ";
        else result += getGroup(thousands) + " MIL ";
    }
    if (remainder > 0 || result === "") {
        result += getGroup(remainder);
    }

    return result.trim();
};

export const calculateNextMaintenance = (currentKm: number): { first: number; second: number } => {
    const interval = 5000;
    const next = Math.ceil(currentKm / interval) * interval;
    // If currentKm is exactly on an interval, the next one is +interval
    const first = next === currentKm ? currentKm + interval : next;
    const second = first + interval;
    return { first, second };
};

export const GOOGLE_SHEETS_CONFIG = {
    // Shared ID for all tabs based on user input
    // Old invalid ID: 1s-G5O_-VwbIJtX-CLy6PS0swraN7vF_y6OVMvlKeA4M
    // New valid ID: 1Y3w26f6EVar5Tl6YfFolv3571PjjT8dbUV4ffGolO4c

    INVENTORY: {
        ID: "1Y3w26f6EVar5Tl6YfFolv3571PjjT8dbUV4ffGolO4c",
        TAB_NAME: "Inventario_entorno_prueba" // Confirmed exists by script
    },
    CLIENTS: {
        ID: "1Y3w26f6EVar5Tl6YfFolv3571PjjT8dbUV4ffGolO4c",
        TAB_NAME: "Inventario_Vista" // Confirmed exists by script, likely the history view
    },
    MASTER: {
        ID: "1s-G5O_-VwbIJtX-CLy6PS0swraN7vF_y6OVMvlKeA4M", // PRODUCTION ID for Notes
        TAB_NAME: "CATALOGO"
    }
};
