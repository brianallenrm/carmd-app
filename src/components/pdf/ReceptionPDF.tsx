import React from "react";

interface Props {
    data: any;
}

/**
 * Title-case a string: capitalize first letter of each word.
 */
function toTitleCase(str: string): string {
    if (!str) return str;
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ReceptionPDF({ data }: Props) {
    const { client: rawClient, vehicle, company, folio, date, inventory, functional, service, photos, notes } = data;

    const DEFAULT_EMAIL = 'car.md.mx@hotmail.com';

    // Auto-capitalize client name, filter default email
    const client = {
        ...rawClient,
        name: toTitleCase(rawClient?.name || ''),
        email: rawClient?.email === DEFAULT_EMAIL ? '' : (rawClient?.email || ''),
    };

    // Helper to chunk inventory for layout
    const inventoryItems = Object.entries(inventory || {})
        .filter(([_, val]) => val === true)
        .map(([key, _]) => key);

    // Helper: determine tapetes display
    const tapetesDisplay = (() => {
        const v = functional?.floormats;
        if (v === 'Completo' || v === '4' || v === 4 || v === 'Todo') return 'Completo';
        if (v !== undefined && v !== null && v !== '') return v;
        return '—';
    })();

    // Helper: determine tapones/rines display
    const taponesDisplay = (() => {
        if (functional?.hasRines) return null; // Will show "Rines" instead
        const v = functional?.hubcaps;
        if (v === 'Completo' || v === '4' || v === 4) return 'Completo';
        if (v === '0' || v === 0) return 'Falta todos';
        if (v !== undefined && v !== null && v !== '' && v !== 'Rines') return `Falta ${4 - Number(v)}`;
        return '—';
    })();

    return (
        <div className="w-[21cm] min-h-[29.7cm] bg-white p-8 mx-auto relative text-slate-800 flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>

            {/* Header - Identical to ServiceNote */}
            <div className="flex justify-between items-center mb-6 border-b-2 border-slate-900 pb-4 h-32">
                {/* Left: Company Info */}
                <div className="text-[9px] text-slate-500 space-y-0.5 leading-tight w-1/3 self-start pt-2">
                    <div className="flex gap-2 items-center">
                        <p className="font-bold text-slate-900">RFC: {company.rfc}</p>
                        <span className="text-slate-300">|</span>
                        <p className="text-slate-700 font-semibold">{company.name}</p>
                    </div>
                    <p className="max-w-[250px]">{company.address}</p>
                    <div className="flex gap-3 font-medium text-[#F37014]">
                        <span>WA: {company.whatsapp}</span>
                    </div>
                    <p>{company.email}</p>
                    <p>{company.website}</p>
                </div>

                {/* Center: Logo */}
                <div className="w-1/3 flex items-center justify-center h-full">
                    <div className="w-56 h-36 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo.png" alt="CarMD Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                </div>

                {/* Right: Folio & Date */}
                <div className="w-1/3 text-right self-start pt-2">
                    <div className="text-xs text-slate-500 mb-0.5 font-medium uppercase tracking-wide">RECEPCIÓN NO.</div>
                    <div className="text-2xl font-mono font-bold text-[#F37014] mb-1">#{folio}</div>
                    <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mt-1 mb-2">INGRESO VEHICULAR</p>
                    <div className="text-xs text-slate-800 font-semibold bg-slate-100 px-2 py-0.5 rounded inline-block capitalize">
                        {date}
                    </div>
                </div>
            </div>

            {/* Info Grid - Identical to ServiceNote */}
            <div className="grid grid-cols-12 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {/* Client (Left Side - 5 cols) */}
                <div className="col-span-5 space-y-2 border-r border-slate-200 pr-4">
                    <h3 className="text-[10px] font-bold text-[#F37014] uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#F37014] rounded-full"></span>
                        Datos del Cliente
                    </h3>
                    <div className="space-y-0.5">
                        <div className="text-sm font-bold text-slate-900">{client.name}</div>
                        <div className="text-[10px] text-slate-600 leading-tight">{client.address}</div>
                        <div className="text-[10px] text-slate-600 flex gap-2">
                            {client.phone && <span>{client.phone}</span>}
                            {client.phone && client.email && <span className="text-slate-300">|</span>}
                            {client.email && <span>{client.email}</span>}
                        </div>
                    </div>
                </div>

                {/* Vehicle (Right Side - 7 cols) */}
                <div className="col-span-7 space-y-2 pl-2">
                    <h3 className="text-[10px] font-bold text-[#F37014] uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#F37014] rounded-full"></span>
                        Datos del Vehículo
                    </h3>
                    <div className="grid grid-cols-4 gap-x-2 gap-y-1 text-[10px]">
                        <div className="col-span-2">
                            <span className="text-slate-400 block text-[9px] uppercase">Vehículo</span>
                            <span className="font-bold text-slate-900 truncate">{vehicle.brand} {vehicle.model} {vehicle.year}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-slate-400 block text-[9px] uppercase">VIN / Serie</span>
                            <span className="font-mono text-slate-700 truncate">{vehicle.vin || vehicle.serialNumber || 'N/A'}</span>
                        </div>

                        <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Placas</span>
                            <span className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block">{vehicle.plates}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Combustible</span>
                            <span className="text-slate-700 truncate font-bold">{vehicle.gas}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-slate-400 block text-[9px] uppercase">Kilometraje</span>
                            <span className="font-mono font-bold text-slate-900">
                                {vehicle.km ? `${vehicle.km} km` : "- km"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Service Request Section */}
            <div className="mb-6 border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                    <h3 className="text-[10px] font-bold text-[#F37014] uppercase tracking-wider">Solicitud de Servicio</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">ASESOR: {service.advisorName || 'Staff'}</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block mb-0.5">Motivo de Ingreso / Fallas Reportadas</span>
                        <p className="text-xs font-medium text-slate-800">{service.serviceType || 'Revisión General'}</p>
                        {service.comments && <p className="text-[10px] text-slate-600 mt-1 italic">&quot;{service.comments}&quot;</p>}
                    </div>
                    {service.hasValuables && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-100 rounded text-[10px] text-yellow-800 flex gap-2 items-start">
                            <span className="text-lg leading-none">⚠️</span>
                            <div>
                                <strong>Objetos de Valor Reportados:</strong>
                                <p>{service.valuablesDescription}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Inventory & Functional Grid */}
            <div className="grid grid-cols-2 gap-8 mb-6">

                {/* Inventory Items */}
                <div>
                    <div className="flex items-end border-b border-slate-200 pb-1 mb-2">
                        <h4 className="text-[10px] font-bold text-slate-900 uppercase">Inventario Físico</h4>
                    </div>
                    {inventoryItems.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            {inventoryItems.map(item => (
                                <div key={item} className="flex items-center gap-2">
                                    <span className="text-green-600 font-bold">✔</span>
                                    <span className="capitalize text-slate-700">{item}</span>
                                </div>
                            ))}
                            {data.inventoryOther && (
                                <div className="col-span-2 text-slate-500 italic mt-1 bg-slate-50 p-1 rounded">+ {data.inventoryOther}</div>
                            )}
                        </div>
                    ) : (
                        <p className="text-[10px] text-slate-400 italic">Sin objetos particulares reportados.</p>
                    )}

                    {/* Tapetes & Tapones/Rines - under Inventario Físico */}
                    <div className="pt-2 mt-3 border-t border-slate-100 grid grid-cols-2 gap-4">
                        <div className="text-center bg-slate-50 rounded p-1.5">
                            <span className="text-slate-400 text-[9px] uppercase font-bold block">Tapetes</span>
                            <span className="font-bold text-slate-900 text-xs">
                                {tapetesDisplay === 'Completo'
                                    ? <span className="text-green-600">Completo</span>
                                    : <span>{tapetesDisplay}</span>}
                            </span>
                        </div>
                        <div className="text-center bg-slate-50 rounded p-1.5">
                            <span className="text-slate-400 text-[9px] uppercase font-bold block">
                                {functional?.hasRines ? 'Rines' : 'Tapones'}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                                {functional?.hasRines
                                    ? <span className="text-green-600">Sí</span>
                                    : taponesDisplay === 'Completo'
                                        ? <span className="text-green-600">Completo</span>
                                        : <span>{taponesDisplay}</span>}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Functional Check */}
                <div>
                    <div className="flex items-end border-b border-slate-200 pb-1 mb-2">
                        <h4 className="text-[10px] font-bold text-slate-900 uppercase">Inspección Visual</h4>
                    </div>
                    <div className="space-y-1">
                        {/* Groups: Lights */}
                        <StatusRow label="Iluminación" ok={functional?.lightsAllOk !== false} />
                        {functional?.lightsAllOk === false && (
                            <div className="pl-4 text-[9px] text-rose-600 font-medium grid grid-cols-2 gap-1 mb-1">
                                {functional.lightsHead === false && <span>• Faros</span>}
                                {functional.lightsTail === false && <span>• Calaveras</span>}
                                {functional.lightsStop === false && <span>• Stop</span>}
                                {functional.lightsTurn === false && <span>• Intermitentes</span>}
                            </div>
                        )}

                        {/* Groups: Windows */}
                        <StatusRow label="Cristales/Espejos" ok={functional?.windowsAllOk !== false} />
                        {functional?.windowsAllOk === false && (
                            <div className="pl-4 text-[9px] text-rose-600 font-medium grid grid-cols-2 gap-1 mb-1">
                                {functional.windowPiloto === false && <span>• Piloto</span>}
                                {functional.windowCopiloto === false && <span>• Copiloto</span>}
                                {functional.windowRearLeft === false && <span>• Trasera Izq</span>}
                                {functional.windowRearRight === false && <span>• Trasera Der</span>}
                                {functional.sunroof === false && <span>• Quemacocos</span>}
                                {functional.mirrors === false && <span>• Espejos</span>}
                            </div>
                        )}

                        <StatusRow label="Claxon" ok={functional?.horn !== false} />
                        <StatusRow label="Limpiaparabrisas" ok={functional?.wipers !== false} />

                    </div>
                </div>
            </div>

            {/* Photo Evidence - Use R2 URL (driveUrl) if available, fallback to previewUrl */}
            {photos && Object.keys(photos).length > 0 && (
                <div className="mb-4 break-inside-avoid">
                    <div className="flex items-end border-b border-slate-200 pb-1 mb-2">
                        <h4 className="text-[10px] font-bold text-slate-900 uppercase">Evidencia Fotográfica</h4>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {['frente', 'atras', 'izq', 'der'].map(zone => {
                            const photo = photos[zone];
                            const imgUrl = photo?.driveUrl || photo?.previewUrl;
                            if (!imgUrl) return null;
                            return (
                                <div key={zone} className="border border-slate-200 rounded-lg p-1 bg-slate-50">
                                    <div className="aspect-video relative overflow-hidden bg-white mb-1 rounded border border-slate-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={imgUrl} className="object-cover w-full h-full" alt={zone} />
                                    </div>
                                    <div className="flex justify-between items-start px-0.5">
                                        <p className="text-[9px] font-bold text-slate-700 uppercase">{zone}</p>
                                    </div>
                                    {photo.notes && (
                                        <p className="text-[8px] text-rose-600 font-medium leading-tight mt-0.5 bg-rose-50 p-0.5 rounded px-1">
                                            {photo.notes}
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Footer - Identical Style */}
            <div className="mt-auto pt-4 border-t-2 border-slate-900">
                <p className="text-[7px] text-justify text-slate-400 mb-8 leading-snug">
                    El cliente acepta que el vehículo aquí descrito queda depositado en los talleres de la empresa para los fines del presupuesto y/o reparación acordada.
                    La empresa se reserva el derecho de admisión. No nos hacemos responsables por pérdidas de objetos no reportados en este inventario, ni por fallas mecánicas o eléctricas no detectadas en la recepción visual.
                    En caso de siniestro dentro del taller, se procederá conforme a la póliza de seguro vigente.
                    Cualquier revisión o diagnóstico genera honorarios.
                </p>

                <div className="flex justify-between items-end px-12">
                    <div className="text-center w-48">
                        <div className="border-b border-slate-400 mb-1 h-8"></div>
                        <p className="text-[9px] font-bold text-slate-800">{service.advisorName || 'Asesor de Servicio'}</p>
                        <p className="text-[8px] text-slate-500 uppercase tracking-wider">Recibe Vehículo</p>
                    </div>

                    <div className="text-center w-48">
                        <div className="border-b border-slate-400 mb-1 h-8"></div>
                        <p className="text-[9px] font-bold text-slate-800">{client.name}</p>
                        <p className="text-[8px] text-slate-500 uppercase tracking-wider">Firma de Conformidad</p>
                    </div>
                </div>
            </div>

        </div>
    );
}

function StatusRow({ label, ok }: { label: string, ok: boolean }) {
    return (
        <div className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0 border-dashed">
            <span className="text-slate-700 font-medium">{label}</span>
            {ok
                ? <span className="text-green-600 text-[9px] font-bold bg-green-50 px-1.5 rounded-full border border-green-100">OK</span>
                : <span className="text-rose-600 text-[9px] font-bold bg-rose-50 px-1.5 rounded-full border border-rose-100">FALLA</span>
            }
        </div>
    )
}
