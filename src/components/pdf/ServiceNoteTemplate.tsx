
import React from "react";
import { ServiceItem, ClientInfo, VehicleInfo, CompanyInfo } from "@/types/service-note";
import { LEGAL_TEXT, calculateNextMaintenance, numberToLetters } from "@/lib/constants";

interface ServiceNoteTemplateProps {
    folio: string;
    date: string;
    client: ClientInfo;
    vehicle: VehicleInfo;
    services: ServiceItem[];
    parts: ServiceItem[];
    notes?: string;
    company: CompanyInfo;
    includeIva: boolean;
    includeIsr: boolean;
}

export default function ServiceNoteTemplate({
    folio,
    date, // Expected format: "YYYY-MM-DD"
    client,
    vehicle,
    services,
    parts,
    notes,
    company,
    includeIva,
    includeIsr,
}: ServiceNoteTemplateProps) {
    // Helper to format cost: 0 -> "$0.00", undefined/null/empty -> ""
    const formatCost = (cost: number | undefined | null) => {
        if (cost === undefined || cost === null || isNaN(cost)) return "";
        return `$${cost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
    };

    // Helper to render "WhatsApp style" rich text (**bold**)
    const renderRichText = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/g); // Split by **...**
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                // Remove asterisks and render bold
                return <b key={index} className="font-bold">{part.slice(2, -2)}</b>;
            }
            return <span key={index}>{part}</span>;
        });
    };

    // Calculcate totals based on split arrays
    const servicesTotal = services.reduce((sum, s) => sum + (s.laborCost || 0), 0);
    const safeParts = parts || [];
    // Parts Total = (Unit Cost * Quantity)
    const partsTotal = safeParts.reduce((sum, p) => sum + ((p.partsCost || 0) * (p.quantity || 1)), 0);

    const subtotal = servicesTotal + partsTotal;
    const totalIva = includeIva ? subtotal * 0.16 : 0;
    const totalIsr = includeIsr ? subtotal * 0.0125 : 0;
    const grandTotal = subtotal + totalIva - totalIsr;
    const nextMaintenance = calculateNextMaintenance(vehicle.odometer);

    return (
        <div className="w-[21cm] min-h-[29.7cm] bg-white p-8 mx-auto relative text-slate-800 flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>

            {/* Header */}
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

                {/* Center: Logo (Vertically & Horizontally Centered, Larger) */}
                <div className="w-1/3 flex items-center justify-center h-full">
                    <div className="w-56 h-36 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo.png" alt="CarMD Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                </div>

                {/* Right: Folio & Date */}
                <div className="w-1/3 text-right self-start pt-2">

                    <div className="text-xs text-slate-500 mb-0.5 font-medium uppercase tracking-wide">PRESUPUESTO NO.</div>
                    <div className="text-2xl font-mono font-bold text-[#F37014] mb-1">#{folio}</div>

                    <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mt-1 mb-2">* SIN VALOR FISCAL *</p>

                    {/* Date Fixed: Parse ISO string YYYY-MM-DD manually to avoid timezone issues */}
                    <div className="text-xs text-slate-800 font-semibold bg-slate-100 px-2 py-0.5 rounded inline-block capitalize">
                        {(() => {
                            if (!date) return "";
                            // Expects "YYYY-MM-DD" or similar. Robust split.
                            // If user passes existing full date string, handle that too?
                            // But we standardized on YYYY-MM-DD in Form.
                            if (date.includes('-')) {
                                const [y, m, d] = date.split('-');
                                const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                                const day = d;
                                const month = dateObj.toLocaleDateString('es-MX', { month: 'long' });
                                const year = y;
                                return `${day} / ${month.charAt(0).toUpperCase() + month.slice(1)} / ${year}`;
                            } else {
                                // Fallback for old links with "5/10/2025" or similar
                                return date;
                            }
                        })()}
                    </div>
                </div>
            </div>

            {/* Info Grid */}
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
                            <span>{client.phone}</span>
                            <span className="text-slate-300">|</span>
                            <span>{client.email}</span>
                        </div>
                    </div>
                </div>

                {/* Vehicle (Right Side - 7 cols - Compact Grid) */}
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
                            <span className="font-mono text-slate-700 truncate">{vehicle.vin}</span>
                        </div>

                        <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Placas</span>
                            <span className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block">{vehicle.plates}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[9px] uppercase">Motor</span>
                            <span className="text-slate-700 truncate">{vehicle.engine}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="text-slate-400 block text-[9px] uppercase">Kilometraje</span>
                            <span className="font-mono font-bold text-slate-900">{vehicle.odometer.toLocaleString()} km</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Services Table */}
            <div className="mb-4">
                <div className="flex justify-between items-end border-b border-slate-200 pb-1 mb-1">
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase">Servicios Realizados</h4>
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase w-[15%] text-right pr-2">IMPORTE</h4>
                </div>
                <table className="w-full">
                    <tbody className="divide-y divide-slate-100">
                        {services.map((service) => (
                            <tr key={service.id} className="group">
                                <td className="py-1 pl-2 text-[10px] text-slate-700 whitespace-pre-wrap leading-snug group-hover:bg-slate-50 transition-colors w-[85%] text-justify pr-2 font-inter">
                                    {renderRichText(service.description)}
                                </td>
                                <td className="py-1 pr-2 text-xs font-mono text-right text-slate-900 font-medium group-hover:bg-slate-50 transition-colors w-[15%] align-top">
                                    {formatCost(service.laborCost)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Parts Table */}
            <div className="flex-grow mb-4">
                <div className="flex items-end border-b border-slate-200 pb-1 mb-1">
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase w-[10%] text-center">CANT.</h4>
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase w-[75%] pl-2">Refacciones</h4>
                    <h4 className="text-[10px] font-bold text-slate-900 uppercase w-[15%] text-right pr-2">IMPORTE</h4>
                </div>
                <table className="w-full">
                    <tbody className="divide-y divide-slate-100">
                        {safeParts.length > 0 ? safeParts.map((part) => (
                            <tr key={part.id} className="group">
                                <td className="py-1 text-[10px] font-mono font-bold text-slate-500 text-center w-[10%] align-top pt-1.5">
                                    {part.quantity || 1}
                                </td>
                                <td className="py-1 pl-2 text-[10px] text-slate-700 whitespace-pre-wrap leading-snug group-hover:bg-slate-50 transition-colors w-[75%] text-justify pr-2 align-top">
                                    {renderRichText(part.description)}
                                </td>
                                <td className="py-1 pr-2 text-xs font-mono text-right text-slate-900 font-medium group-hover:bg-slate-50 transition-colors w-[15%] align-top">
                                    {formatCost((part.partsCost || 0) * (part.quantity || 1))}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="py-1 pl-2 text-[10px] text-slate-400 italic">No se agregaron refacciones.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* New: Optional Notes Section */}
            {notes && notes.trim().length > 0 && (
                <div className="mb-4 bg-yellow-50/50 p-3 rounded-lg border border-yellow-100 text-slate-800 text-[10px] leading-snug whitespace-pre-wrap">
                    <span className="font-bold text-[#F37014] uppercase text-[9px] block mb-1">Observaciones Generales:</span>
                    {renderRichText(notes)}
                </div>
            )}

            {/* Totals & Notes */}
            <div className="flex justify-between items-start mb-4 border-t-2 border-slate-900 pt-4">

                {/* Left Side: Notes & Maintenance */}
                <div className="w-1/2 pr-4 space-y-3">
                    <div className="bg-[#F37014]/10 p-3 rounded-lg border border-[#F37014]/20 text-center">
                        <h4 className="text-[11px] font-bold text-[#F37014] uppercase mb-1">2 MANTENIMIENTOS PREVENTIVOS (GRATUITOS)</h4>
                        <div className="text-[12px] text-slate-900 font-bold flex justify-center gap-4">
                            <span>1- {nextMaintenance.first.toLocaleString()} km.</span>
                            <span>2- {nextMaintenance.second.toLocaleString()} km.</span>
                        </div>
                    </div>

                    <div className="text-[9px] text-slate-500 leading-tight">
                        <p className="font-bold text-slate-900 mb-0.5">GARANTÍA:</p>
                        <p className="font-bold">1 AÑO DE GARANTÍA en mano de obra o 10,000 kms (lo que ocurra primero).</p>
                    </div>
                </div>

                {/* Right Side: Totals */}
                <div className="w-64">
                    <div className="space-y-1 mb-2">
                        <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Subtotal</span>
                            <span className="font-mono">${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                            <span>IVA (16%)</span>
                            <span className="font-mono">${totalIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        </div>
                        {includeIsr && (
                            <div className="flex justify-between text-[10px] text-slate-500">
                                <span>Retención I.S.R.</span>
                                <span className="font-mono">${totalIsr.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between py-2 border-t border-slate-200 text-lg font-black text-slate-900 bg-slate-50 px-3 rounded-lg">
                        <span>Total</span>
                        <span className="font-mono">${grandTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="text-[8px] text-slate-400 text-right mt-1 font-medium uppercase">
                        {numberToLetters(grandTotal)}
                    </div>
                </div>
            </div>

            {/* Legal Footer */}
            <div className="mt-auto">
                <div className="text-[6px] text-slate-400 text-justify leading-snug mb-6 border-t border-slate-100 pt-2">
                    {LEGAL_TEXT}
                </div>

                <div className="flex justify-center gap-20">
                    <div className="text-center">
                        <div className="w-40 h-12 border-b border-slate-300 mb-1"></div>
                        <p className="text-[8px] font-bold text-slate-700 uppercase">Firma de Conformidad</p>
                    </div>
                </div>
            </div>

        </div>
    );
}
