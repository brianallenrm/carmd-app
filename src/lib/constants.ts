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
        if (n >= 10 && n <= 19) {
            output += teens[n - 10];
            return output;
        }
        if (n >= 20) {
            output += tens[Math.floor(n / 10)];
            if (n % 10 > 0) output += " Y " + units[n % 10];
        } else {
            output += units[n];
        }
        return output;
    };

    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);

    let text = "";
    if (integerPart === 0) text = "CERO";
    else if (integerPart < 1000) text = getGroup(integerPart);
    else if (integerPart < 2000) text = "MIL " + getGroup(integerPart % 1000);
    else if (integerPart < 1000000) {
        text = getGroup(Math.floor(integerPart / 1000)) + " MIL ";
        if (integerPart % 1000 > 0) text += getGroup(integerPart % 1000);
    }

    // Basic implementation for < 1 million. Can be expanded if needed.

    return `(${text.trim()} PESOS ${decimalPart.toString().padStart(2, "0")}/100 M.N.)`;
};

export function calculateNextMaintenance(currentOdometer: number) {
    return {
        first: currentOdometer + 5000,
        second: currentOdometer + 7500,
    };
}

export const GOOGLE_SHEETS_CONFIG = {
    INVENTORY: {
        ID: "1Y3w26f6EVar5Tl6YfFolv3571PjjT8dbUV4ffGolO4c",
        TAB_NAME: "Respuestas de formulario 1"
    },
    CLIENTS: {
        ID: "1Y3w26f6EVar5Tl6YfFolv3571PjjT8dbUV4ffGolO4c",
        TAB_NAME: "Inventario_Vista"
    },
    MASTER: {
        ID: "1A35mdnUopNt-pk0yWdDxucPAe5zqO46ujgzN1r0jW9Q",
        TAB_NAME: "TODOS"
    }
};
