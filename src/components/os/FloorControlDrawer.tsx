"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Car, User, Phone, Wrench, ShieldCheck, Clock,
    DollarSign, Image as ImageIcon, Plus, Check, ChevronRight,
    ExternalLink, FileText, History, ZoomIn, ZoomOut, AlertCircle,
    RotateCcw, Sparkles, Fuel, Gauge, Trash2
} from "lucide-react";

export interface PartItem {
    id: string | number;
    description: string;
    cost: number;
    supplier?: string;
    buyer?: string;
    photoUrl?: string;
    date?: string;
}

export interface ExternalServiceItem {
    id: string | number;
    description: string;
    cost: number;
    vendor?: string;
    date?: string;
}

export interface LogItem {
    id: string | number;
    text: string;
    author?: string;
    timestamp: string;
}

interface FloorControlDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    vehicle: any | null; // RecentVehicle
    onVehicleUpdated?: (updatedVehicle: any) => void;
    onExpedienteSearch?: (plates: string) => void;
}

const DEFAULT_MECHANICS = [
    "Jesús",
    "Alejandro",
    "Israel",
    "Juan Pablo",
    "Rubén",
    "Josué",
];

const FLOOR_STATUS_OPTIONS = [
    { value: "EN_RAMPA", label: "En rampa / trabajo", color: "bg-amber-500 text-white border-amber-500", icon: "🔧" },
    { value: "EN_DIAGNOSTICO", label: "En diagnóstico", color: "bg-blue-500 text-white border-blue-500", icon: "🔍" },
    { value: "ESPERANDO_PIEZAS", label: "Esperando refacciones", color: "bg-purple-500 text-white border-purple-500", icon: "📦" },
    { value: "TORNO", label: "En torno / rectificado", color: "bg-indigo-500 text-white border-indigo-500", icon: "⚙️" },
    { value: "LAVADO", label: "En lavado", color: "bg-cyan-500 text-white border-cyan-500", icon: "🧼" },
    { value: "LISTO_ENTREGA", label: "Listo para entrega", color: "bg-emerald-500 text-white border-emerald-500", icon: "🏁" },
    { value: "MANTENIMIENTO_SIN_NOTA", label: "Cortesía / Garantía (Sin nota)", color: "bg-teal-600 text-white border-teal-600", icon: "🛠️" },
    { value: "SALIDA_SIN_NOTA", label: "Salida sin reparación", color: "bg-slate-500 text-white border-slate-500", icon: "🚪" },
    { value: "ENTREGADO", label: "Entregado al cliente", color: "bg-emerald-600 text-white border-emerald-600", icon: "✅" },
];

export default function FloorControlDrawer({
    isOpen,
    onClose,
    vehicle,
    onVehicleUpdated,
    onExpedienteSearch,
}: FloorControlDrawerProps) {
    const [activeTab, setActiveTab] = useState<"refacciones" | "externos" | "bitacora">("refacciones");
    const [saving, setSaving] = useState(false);

    // Local editable floor state
    const [currentStatus, setCurrentStatus] = useState<string>("EN_RAMPA");
    const [selectedMechanics, setSelectedMechanics] = useState<string[]>([]);
    const [customMechanicInput, setCustomMechanicInput] = useState("");
    const [showCustomMechanicInput, setShowCustomMechanicInput] = useState(false);

    // Refacciones state
    const [parts, setParts] = useState<PartItem[]>([]);
    const [newPartDesc, setNewPartDesc] = useState("");
    const [newPartCost, setNewPartCost] = useState("");
    const [newPartSupplier, setNewPartSupplier] = useState("");
    const [newPartPhotoUrl, setNewPartPhotoUrl] = useState("");
    const [showAddPart, setShowAddPart] = useState(false);

    // External services state
    const [externals, setExternals] = useState<ExternalServiceItem[]>([]);
    const [newExtDesc, setNewExtDesc] = useState("");
    const [newExtCost, setNewExtCost] = useState("");
    const [newExtVendor, setNewExtVendor] = useState("");
    const [showAddExt, setShowAddExt] = useState(false);

    // Bitacora state
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [newLogText, setNewLogText] = useState("");

    // Lightbox image viewer
    const [zoomImage, setZoomImage] = useState<string | null>(null);

    // Sync from vehicle prop
    useEffect(() => {
        if (!vehicle) return;

        const fData = vehicle.floorData || {};
        setCurrentStatus(fData.status || (vehicle.status === 'salida_sin_nota' ? 'SALIDA_SIN_NOTA' : vehicle.status === 'mantenimiento_sin_nota' ? 'MANTENIMIENTO_SIN_NOTA' : vehicle.status === 'entregado' ? 'ENTREGADO' : 'EN_RAMPA'));

        const mechRaw = fData.mechanic || "";
        const mechs = mechRaw.split(",").map((s: string) => s.trim()).filter(Boolean);
        setSelectedMechanics(mechs);

        setParts(Array.isArray(fData.parts) ? fData.parts : []);
        setExternals(Array.isArray(fData.externalServices) ? fData.externalServices : []);
        setLogs(Array.isArray(fData.log) ? fData.log : []);
    }, [vehicle]);

    if (!isOpen || !vehicle) return null;

    const plates = vehicle.vehicle?.plates || "";
    const cleanPlate = plates.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Toggle mechanic assignment
    const handleToggleMechanic = async (mechName: string) => {
        const next = selectedMechanics.includes(mechName)
            ? selectedMechanics.filter(m => m !== mechName)
            : [...selectedMechanics, mechName];

        setSelectedMechanics(next);
        const mechanicStr = next.join(", ");

        try {
            await fetch("/api/os/recent-vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plate: cleanPlate,
                    status: currentStatus,
                    mechanic: mechanicStr,
                }),
            });

            if (onVehicleUpdated) {
                onVehicleUpdated({
                    ...vehicle,
                    floorData: {
                        ...(vehicle.floorData || {}),
                        mechanic: mechanicStr,
                    },
                });
            }
        } catch (e) {
            console.error("Error al actualizar mecánico:", e);
        }
    };

    const handleAddCustomMechanic = async () => {
        const trimmed = customMechanicInput.trim();
        if (!trimmed) return;
        if (!selectedMechanics.includes(trimmed)) {
            await handleToggleMechanic(trimmed);
        }
        setCustomMechanicInput("");
        setShowCustomMechanicInput(false);
    };

    // Update status
    const handleChangeStatus = async (newStat: string) => {
        setCurrentStatus(newStat);
        setSaving(true);
        try {
            await fetch("/api/os/recent-vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plate: cleanPlate,
                    status: newStat,
                    mechanic: selectedMechanics.join(", "),
                }),
            });

            let mappedStatus = vehicle.status;
            if (newStat === "SALIDA_SIN_NOTA") mappedStatus = "salida_sin_nota";
            else if (newStat === "MANTENIMIENTO_SIN_NOTA") mappedStatus = "mantenimiento_sin_nota";
            else if (newStat === "ENTREGADO") mappedStatus = "entregado";
            else mappedStatus = vehicle.note ? "con_nota" : "en_piso_registrado";

            if (onVehicleUpdated) {
                onVehicleUpdated({
                    ...vehicle,
                    status: mappedStatus,
                    floorData: {
                        ...(vehicle.floorData || {}),
                        status: newStat,
                    },
                });
            }
        } catch (e) {
            console.error("Error al cambiar estatus:", e);
        } finally {
            setSaving(false);
        }
    };

    // Add Part
    const handleSavePart = async () => {
        if (!newPartDesc.trim()) return;
        const costNum = parseFloat(newPartCost) || 0;
        const partObj: PartItem = {
            id: Date.now().toString(),
            description: newPartDesc.trim(),
            cost: costNum,
            supplier: newPartSupplier.trim() || "Local",
            photoUrl: newPartPhotoUrl.trim() || undefined,
            date: new Date().toISOString(),
        };

        const nextParts = [...parts, partObj];
        setParts(nextParts);
        setNewPartDesc("");
        setNewPartCost("");
        setNewPartSupplier("");
        setNewPartPhotoUrl("");
        setShowAddPart(false);

        try {
            await fetch("/api/os/recent-vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plate: cleanPlate,
                    status: currentStatus,
                    mechanic: selectedMechanics.join(", "),
                    newPart: partObj,
                }),
            });

            if (onVehicleUpdated) {
                onVehicleUpdated({
                    ...vehicle,
                    floorData: {
                        ...(vehicle.floorData || {}),
                        parts: nextParts,
                        partsCount: nextParts.length,
                    },
                });
            }
        } catch (e) {
            console.error("Error al guardar refacción:", e);
        }
    };

    // Add External Service
    const handleSaveExternal = async () => {
        if (!newExtDesc.trim()) return;
        const costNum = parseFloat(newExtCost) || 0;
        const extObj: ExternalServiceItem = {
            id: Date.now().toString(),
            description: newExtDesc.trim(),
            cost: costNum,
            vendor: newExtVendor.trim() || "Externo",
            date: new Date().toISOString(),
        };

        const nextExts = [...externals, extObj];
        setExternals(nextExts);
        setNewExtDesc("");
        setNewExtCost("");
        setNewExtVendor("");
        setShowAddExt(false);

        try {
            await fetch("/api/os/recent-vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plate: cleanPlate,
                    status: currentStatus,
                    mechanic: selectedMechanics.join(", "),
                    newExternalService: extObj,
                }),
            });

            if (onVehicleUpdated) {
                onVehicleUpdated({
                    ...vehicle,
                    floorData: {
                        ...(vehicle.floorData || {}),
                        externalServices: nextExts,
                        externalCount: nextExts.length,
                    },
                });
            }
        } catch (e) {
            console.error("Error al guardar servicio externo:", e);
        }
    };

    // Add Log Note
    const handleSaveLog = async () => {
        if (!newLogText.trim()) return;
        const logObj: LogItem = {
            id: Date.now().toString(),
            text: newLogText.trim(),
            author: "Piso",
            timestamp: new Date().toISOString(),
        };

        const nextLogs = [logObj, ...logs];
        setLogs(nextLogs);
        setNewLogText("");

        try {
            await fetch("/api/os/recent-vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plate: cleanPlate,
                    status: currentStatus,
                    mechanic: selectedMechanics.join(", "),
                    newLogEntry: logObj,
                }),
            });

            if (onVehicleUpdated) {
                onVehicleUpdated({
                    ...vehicle,
                    floorData: {
                        ...(vehicle.floorData || {}),
                        log: nextLogs,
                        logCount: nextLogs.length,
                    },
                });
            }
        } catch (e) {
            console.error("Error al guardar bitácora:", e);
        }
    };

    // Prefill Note Action
    const handleGoToNote = () => {
        try {
            const basePrefill = vehicle.prefillJson ? JSON.parse(vehicle.prefillJson) : {};

            // Map parts
            const mappedParts = parts.map(p => ({
                description: `${p.description} (${p.supplier || 'Refacción'})`,
                cost: p.cost,
                quantity: 1,
            }));

            // Map external services as services or sublet
            const mappedServices = externals.map(e => ({
                description: `${e.description} (${e.vendor || 'Servicio externo'})`,
                cost: e.cost,
            }));

            const fullPrefill = {
                ...basePrefill,
                parts: mappedParts,
                services: mappedServices,
                notes: selectedMechanics.length > 0 ? `Mecánico(s) asignado(s): ${selectedMechanics.join(", ")}` : "",
            };

            localStorage.setItem("carmd:prefill:note", JSON.stringify(fullPrefill));
            window.open("/os", "_blank");
        } catch (e) {
            console.error("Error generating note prefill", e);
            window.open("/os", "_blank");
        }
    };

    const totalPartsCost = parts.reduce((acc, p) => acc + (Number(p.cost) || 0), 0);
    const totalExternalCost = externals.reduce((acc, e) => acc + (Number(e.cost) || 0), 0);
    const grandTotal = totalPartsCost + totalExternalCost;

    const phoneClean = (vehicle.client?.phone || "").replace(/\D/g, "");
    const waUrl = phoneClean ? `https://wa.me/52${phoneClean}` : null;

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 transition-opacity"
            />

            {/* Slide-over Drawer */}
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono font-black text-sm tracking-wider bg-slate-900 text-white px-2.5 py-0.5 rounded-lg border border-slate-700 shadow-sm">
                                {plates}
                            </span>
                            <span className="text-xs font-black text-slate-500 uppercase">
                                {vehicle.vehicle?.year} {vehicle.vehicle?.brand} {vehicle.vehicle?.model}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                            <span className="flex items-center gap-1">
                                <Gauge size={12} className="text-slate-400" />
                                {vehicle.vehicle?.km ? `${vehicle.vehicle.km.toLocaleString()} km` : "Sin km"}
                            </span>
                            <span className="flex items-center gap-1">
                                <Fuel size={12} className="text-slate-400" />
                                {vehicle.vehicle?.gas ? `${vehicle.vehicle.gas} tanque` : "—"}
                            </span>
                            <span>• Ingresó: {vehicle.dateDisplay || "Hoy"}</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
                        title="Cerrar panel"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">

                    {/* Cliente & Motivo Card */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-orange-100 text-[#f16315] flex items-center justify-center font-black text-xs">
                                    <User size={15} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800 leading-tight">
                                        {vehicle.client?.name || "Cliente general"}
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        Asesor: {vehicle.advisor || "Taller"}
                                    </p>
                                </div>
                            </div>

                            {waUrl && (
                                <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-sm"
                                >
                                    <Phone size={13} />
                                    <span>WhatsApp</span>
                                </a>
                            )}
                        </div>

                        {vehicle.motivo && (
                            <div className="text-xs bg-white rounded-xl p-3 border border-slate-100">
                                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block mb-0.5">
                                    Motivo de ingreso reportado:
                                </span>
                                <p className="text-slate-700 italic">
                                    "{vehicle.motivo}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Mecánicos Asignados (Multi-select) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Wrench size={13} className="text-[#f16315]" />
                                Mecánico(s) Responsable(s)
                            </label>
                            {selectedMechanics.length > 0 && (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                    {selectedMechanics.join(" + ")}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                            {DEFAULT_MECHANICS.map(mech => {
                                const isSelected = selectedMechanics.includes(mech);
                                return (
                                    <button
                                        key={mech}
                                        onClick={() => handleToggleMechanic(mech)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                            isSelected
                                                ? "bg-[#f16315] text-white shadow-sm shadow-orange-300"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                    >
                                        {isSelected && <Check size={12} />}
                                        <span>{mech}</span>
                                    </button>
                                );
                            })}

                            {/* Mecánicos personalizados seleccionados que no estén en la lista por defecto */}
                            {selectedMechanics
                                .filter(m => !DEFAULT_MECHANICS.includes(m))
                                .map(mech => (
                                    <button
                                        key={mech}
                                        onClick={() => handleToggleMechanic(mech)}
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f16315] text-white shadow-sm shadow-orange-300 flex items-center gap-1.5"
                                    >
                                        <Check size={12} />
                                        <span>{mech}</span>
                                    </button>
                                ))}

                            {/* Botón "+ Otro" */}
                            {!showCustomMechanicInput ? (
                                <button
                                    onClick={() => setShowCustomMechanicInput(true)}
                                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 hover:bg-slate-200 border border-dashed border-slate-300 flex items-center gap-1"
                                >
                                    <Plus size={12} />
                                    <span>Otro</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-1 animate-in fade-in duration-150">
                                    <input
                                        type="text"
                                        placeholder="Nombre..."
                                        value={customMechanicInput}
                                        onChange={(e) => setCustomMechanicInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddCustomMechanic()}
                                        className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg w-28 focus:outline-none focus:border-[#f16315]"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleAddCustomMechanic}
                                        className="p-1 bg-[#f16315] text-white rounded-lg text-xs"
                                    >
                                        <Check size={14} />
                                    </button>
                                    <button
                                        onClick={() => setShowCustomMechanicInput(false)}
                                        className="p-1 bg-slate-200 text-slate-600 rounded-lg text-xs"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Estatus Operativo de Piso */}
                    <div>
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2">
                            Fase / Estatus en Taller
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {FLOOR_STATUS_OPTIONS.map(opt => {
                                const isCurrent = currentStatus === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleChangeStatus(opt.value)}
                                        className={`px-2.5 py-2 rounded-xl text-[11px] font-bold text-left transition-all border flex items-center gap-1.5 ${
                                            isCurrent
                                                ? `${opt.color} shadow-sm`
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        <span>{opt.icon}</span>
                                        <span className="truncate">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tabs: Refacciones / Externos / Bitácora */}
                    <div>
                        <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                            <button
                                onClick={() => setActiveTab("refacciones")}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === "refacciones"
                                        ? "bg-white text-slate-800 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                <span>Refacciones</span>
                                {parts.length > 0 && (
                                    <span className="bg-amber-500 text-white text-[9px] px-1.5 rounded-full">
                                        {parts.length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setActiveTab("externos")}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === "externos"
                                        ? "bg-white text-slate-800 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                <span>Torno / Lavado</span>
                                {externals.length > 0 && (
                                    <span className="bg-indigo-500 text-white text-[9px] px-1.5 rounded-full">
                                        {externals.length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setActiveTab("bitacora")}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === "bitacora"
                                        ? "bg-white text-slate-800 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                <span>Bitácora</span>
                                {logs.length > 0 && (
                                    <span className="bg-slate-400 text-white text-[9px] px-1.5 rounded-full">
                                        {logs.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Contenido Pestaña 1: Refacciones */}
                        {activeTab === "refacciones" && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 uppercase">
                                        Piezas cargadas al auto
                                    </span>
                                    <button
                                        onClick={() => setShowAddPart(!showAddPart)}
                                        className="text-xs font-bold text-[#f16315] hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-lg transition-colors"
                                    >
                                        <Plus size={13} />
                                        <span>Agregar refacción</span>
                                    </button>
                                </div>

                                {/* Formulario Nueva Refacción */}
                                {showAddPart && (
                                    <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100 space-y-2 animate-in fade-in duration-150">
                                        <p className="text-[11px] font-bold text-orange-800 uppercase">
                                            Nueva Refacción
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="Descripción (ej. Balatas delanteras)"
                                            value={newPartDesc}
                                            onChange={(e) => setNewPartDesc(e.target.value)}
                                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#f16315]"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                placeholder="Costo $ MXN"
                                                value={newPartCost}
                                                onChange={(e) => setNewPartCost(e.target.value)}
                                                className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#f16315]"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Proveedor (Autozone, etc.)"
                                                value={newPartSupplier}
                                                onChange={(e) => setNewPartSupplier(e.target.value)}
                                                className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#f16315]"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="URL foto ticket (opcional)"
                                            value={newPartPhotoUrl}
                                            onChange={(e) => setNewPartPhotoUrl(e.target.value)}
                                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#f16315]"
                                        />
                                        <div className="flex justify-end gap-2 pt-1">
                                            <button
                                                onClick={() => setShowAddPart(false)}
                                                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded-lg font-bold"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSavePart}
                                                className="px-3 py-1.5 text-xs bg-[#f16315] hover:bg-orange-600 text-white rounded-lg font-bold shadow-sm"
                                            >
                                                Guardar Pieza
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Lista de Refacciones */}
                                {parts.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <Wrench size={24} className="mx-auto text-slate-300 mb-1" />
                                        <p className="text-xs text-slate-400 font-medium">
                                            No hay refacciones registradas aún.
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            Se agregarán automáticamente cuando Alejandra mande la foto del ticket por WhatsApp.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {parts.map((p, idx) => (
                                            <div
                                                key={p.id || idx}
                                                className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-200 transition-all"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {p.photoUrl ? (
                                                        <button
                                                            onClick={() => setZoomImage(p.photoUrl!)}
                                                            className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 group relative"
                                                            title="Ver foto del ticket"
                                                        >
                                                            <img
                                                                src={p.photoUrl}
                                                                alt="Ticket"
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                            />
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                <ZoomIn size={14} className="text-white" />
                                                            </div>
                                                        </button>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                                                            <Wrench size={16} />
                                                        </div>
                                                    )}

                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 truncate">
                                                            {p.description}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400">
                                                            Proveedor: <span className="font-semibold text-slate-600">{p.supplier || "Taller"}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-xs font-black text-slate-900">
                                                        ${(Number(p.cost) || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                                    </p>
                                                    {p.photoUrl && (
                                                        <button
                                                            onClick={() => setZoomImage(p.photoUrl!)}
                                                            className="text-[10px] text-[#f16315] font-bold hover:underline"
                                                        >
                                                            Ver ticket
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                                            <span className="text-xs font-bold text-amber-900 uppercase">
                                                Total Refacciones:
                                            </span>
                                            <span className="text-sm font-black text-amber-900">
                                                ${totalPartsCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Contenido Pestaña 2: Servicios Externos */}
                        {activeTab === "externos" && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 uppercase">
                                        Torno, Lavado, Alineación (Sublet)
                                    </span>
                                    <button
                                        onClick={() => setShowAddExt(!showAddExt)}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors"
                                    >
                                        <Plus size={13} />
                                        <span>Agregar servicio</span>
                                    </button>
                                </div>

                                {showAddExt && (
                                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2 animate-in fade-in duration-150">
                                        <p className="text-[11px] font-bold text-indigo-900 uppercase">
                                            Nuevo Servicio Externo
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="Descripción (ej. Rectificado de 2 discos)"
                                            value={newExtDesc}
                                            onChange={(e) => setNewExtDesc(e.target.value)}
                                            className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                placeholder="Costo $ MXN"
                                                value={newExtCost}
                                                onChange={(e) => setNewExtCost(e.target.value)}
                                                className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Proveedor (Torno Don Pepe, etc.)"
                                                value={newExtVendor}
                                                onChange={(e) => setNewExtVendor(e.target.value)}
                                                className="text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 pt-1">
                                            <button
                                                onClick={() => setShowAddExt(false)}
                                                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200 rounded-lg font-bold"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveExternal}
                                                className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
                                            >
                                                Guardar Servicio
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {externals.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <p className="text-xs text-slate-400 font-medium">
                                            No hay servicios externos registrados.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {externals.map((e, idx) => (
                                            <div
                                                key={e.id || idx}
                                                className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-3 shadow-sm"
                                            >
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">
                                                        {e.description}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        Proveedor: <span className="font-semibold text-slate-600">{e.vendor || "Externo"}</span>
                                                    </p>
                                                </div>
                                                <p className="text-xs font-black text-slate-900">
                                                    ${(Number(e.cost) || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        ))}

                                        <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between">
                                            <span className="text-xs font-bold text-indigo-900 uppercase">
                                                Total Externos:
                                            </span>
                                            <span className="text-sm font-black text-indigo-900">
                                                ${totalExternalCost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Contenido Pestaña 3: Bitácora */}
                        {activeTab === "bitacora" && (
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Agregar nota rápida sobre el vehículo..."
                                        value={newLogText}
                                        onChange={(e) => setNewLogText(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSaveLog()}
                                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#f16315]"
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSaveLog}
                                            className="px-3 py-1 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900"
                                        >
                                            Publicar Nota
                                        </button>
                                    </div>
                                </div>

                                {logs.length === 0 ? (
                                    <p className="text-center py-6 text-xs text-slate-400">
                                        Sin notas registradas en bitácora.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {logs.map((l, idx) => (
                                            <div key={l.id || idx} className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1">
                                                <p className="text-slate-800 font-medium">{l.text}</p>
                                                <p className="text-[10px] text-slate-400">
                                                    {l.timestamp ? new Date(l.timestamp).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) : "Hoy"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Resumen Total */}
                    {grandTotal > 0 && (
                        <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-lg">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Gasto Acumulado en Piso
                                </p>
                                <p className="text-xs text-slate-300">
                                    {parts.length} refacciones • {externals.length} servicios externos
                                </p>
                            </div>
                            <p className="text-xl font-black text-amber-400">
                                ${grandTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Action Bar */}
                <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
                    {onExpedienteSearch && (
                        <button
                            onClick={() => {
                                onExpedienteSearch(plates);
                                onClose();
                            }}
                            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                            <History size={14} />
                            <span>Expediente</span>
                        </button>
                    )}

                    <button
                        onClick={handleGoToNote}
                        className="flex-1 py-2.5 px-4 bg-[#f16315] hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-300"
                    >
                        <FileText size={15} />
                        <span>Generar Nota con Todo Precargado</span>
                    </button>
                </div>
            </motion.div>

            {/* Modal Zoom Lightbox para foto de tickets */}
            {zoomImage && (
                <div
                    onClick={() => setZoomImage(null)}
                    className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-3xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                    >
                        <div className="p-3 bg-slate-800 text-white flex items-center justify-between text-xs font-bold">
                            <span>Inspección de Ticket de Refacción</span>
                            <button
                                onClick={() => setZoomImage(null)}
                                className="p-1 text-slate-400 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="overflow-auto p-2 flex items-center justify-center bg-black/40">
                            <img
                                src={zoomImage}
                                alt="Ticket en zoom"
                                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                            />
                        </div>
                        <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-800">
                            Usa la rueda del ratón o haz zoom con los dedos para ver a detalle precios y números de parte
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
