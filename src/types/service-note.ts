export interface ServiceItem {
    id: string;
    description: string;
    laborCost: number;
    partsCost: number;
}

export interface ClientInfo {
    name: string;
    address: string;
    phone: string;
    email: string;
}

export interface VehicleInfo {
    brand: string;
    model: string;
    year: string;
    plates: string;
    vin: string;
    engine: string;
    odometer: number;
}

export interface CompanyInfo {
    name: string;
    rfc: string;
    address: string;
    phone: string;
    whatsapp: string;
    email: string;
    website: string;
}

export interface ServiceNoteData {
    folio: string;
    date: string;
    client: ClientInfo;
    vehicle: VehicleInfo;
    maintenanceInterval?: number;
    parts: ServiceItem[];
    company: CompanyInfo;
    includeIva: boolean; // 16%
    includeIsr: boolean; // 1.25% Retention
}
