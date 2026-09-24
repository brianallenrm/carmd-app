"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Car, User, Phone, Wrench, ShieldCheck, Clock,
    DollarSign, Image as ImageIcon, Plus, Check, ChevronRight,
    ExternalLink, FileText, History, ZoomIn, ZoomOut, AlertCircle,
    RotateCcw, Sparkles, Fuel, Gauge, Trash2, Pencil, Camera,
    Loader2, RotateCw
} from "lucide-react";
import { compressImage, blobToBase64 } from "@/lib/image-utils";

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
    photoUrl?: string;
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
    mode?: 'full' | 'piso';
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
    { value: "TORNO", label: "En rectificación / maquinado", color: "bg-indigo-500 text-white border-indigo-500", icon: "⚙️" },
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
    mode = 'full',
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
    const [newExtPhotoUrl, setNewExtPhotoUrl] = useState("");
    const [showAddExt, setShowAddExt] = useState(false);

    // Bitacora state
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [newLogText, setNewLogText] = useState("");

    // Edit Part state
    const [editingPartId, setEditingPartId] = useState<string | number | null>(null);
    const [editPartDesc, setEditPartDesc] = useState("");
    const [editPartCost, setEditPartCost] = useState("");
    const [editPartSupplier, setEditPartSupplier] = useState("");
    const [editPartPhotoUrl, setEditPartPhotoUrl] = useState("");

    // Edit External Service state
    const [editingExtId, setEditingExtId] = useState<string | number | null>(null);
    const [editExtDesc, setEditExtDesc] = useState("");
    const [editExtCost, setEditExtCost] = useState("");
    const [editExtVendor, setEditExtVendor] = useState("");
    const [editExtPhotoUrl, setEditExtPhotoUrl] = useState("");

    // Ticket Photo Upload states
    // Ticket Photo Upload & AI Analysis states
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [isAnalyzingTicket, setIsAnalyzingTicket] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [aiDetectedBadge, setAiDetectedBadge] = useState<{
        target: 'newPart' | 'editPart' | 'newExt' | 'editExt';
        status?: 'success' | 'empty' | 'error';
        supplier?: string | null;
        description?: string | null;
        cost?: number | null;
        message?: string;
        modelUsed?: string;
    } | null>(null);

    // Lightbox image viewer
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const [zoomRotation, setZoomRotation] = useState<number>(0);

    // Helper to render AI status / result badge
    const renderAiBadge = (target: "newPart" | "editPart" | "newExt" | "editExt") => {
        if (!aiDetectedBadge || aiDetectedBadge.target !== target || isAnalyzingTicket) return null;

        if (aiDetectedBadge.status === "empty") {
            return (
                <div className="flex items-center justify-between gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] font-medium shadow-sm">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <AlertCircle size={13} className="text-amber-600 shrink-0" />
                        <span className="truncate">{aiDetectedBadge.message || "No se detectaron datos legibles. Llénalos a mano."}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAiDetectedBadge(null)}
                        className="text-amber-700 hover:text-amber-900 p-0.5 rounded text-[10px] font-bold shrink-0"
                        title="Cerrar aviso"
                    >
                        ✕
                    </button>
                </div>
            );
        }

        if (aiDetectedBadge.status === "error") {
            return (
                <div className="flex items-center justify-between gap-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-[11px] font-medium shadow-sm">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <AlertCircle size={13} className="text-rose-600 shrink-0" />
                        <span className="truncate">{aiDetectedBadge.message || "Error al conectar con IA. Llénalos a mano."}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAiDetectedBadge(null)}
                        className="text-rose-700 hover:text-rose-900 p-0.5 rounded text-[10px] font-bold shrink-0"
                        title="Cerrar aviso"
                    >
                        ✕
                    </button>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-between gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px] font-medium shadow-sm">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles size={13} className="text-emerald-600 shrink-0" />
                    <span className="truncate">
                        <strong>IA detectó:</strong> {aiDetectedBadge.supplier ? `${aiDetectedBadge.supplier} • ` : ""}{aiDetectedBadge.description || ""}{aiDetectedBadge.cost ? ` • $${aiDetectedBadge.cost}` : ""}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setAiDetectedBadge(null)}
                    className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded text-[10px] font-bold shrink-0"
                    title="Cerrar aviso"
                >
                    ✕
                </button>
            </div>
        );
    };

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

    // Helper to upload ticket photos via R2 and analyze with Gemini Vision AI
    const handleUploadPhotoFile = async (
        e: React.ChangeEvent<HTMLInputElement>,
        onSuccess: (url: string) => void,
        tag: string = "ticket",
        aiContext?: {
            type: "refaccion" | "rectificacion";
            target: "newPart" | "editPart" | "newExt" | "editExt";
        }
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingPhoto(true);
        setUploadError(null);
        if (aiContext) {
            setIsAnalyzingTicket(true);
            setAiDetectedBadge(null);
        }

        try {
            // Optimized compression: 1200x1200 at 0.70 is fast to upload on mobile and pin-sharp for OCR
            const { blob, actualFormat } = await compressImage(file, {
                maxWidth: 1200,
                maxHeight: 1200,
                quality: 0.70,
                format: "image/webp",
            });

            const base64 = await blobToBase64(blob);
            const ext = actualFormat === "image/webp" ? "webp" : "jpg";
            const platePrefix = cleanPlate || "SIN_PLACA";
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            const datePrefix = `${yyyy}-${mm}-${dd}`;
            const filename = `${datePrefix}_${tag}_${Date.now()}.${ext}`;
            const folder = `tickets/${platePrefix}`;

            // Step 1: Upload image to Cloudflare R2 inside tickets/[PLACAS]/
            const res = await fetch("/api/photos/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: base64, filename, folder }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            if (!data.url) {
                throw new Error("No se recibió la URL de la imagen");
            }

            // Immediately set photo URL in UI so preview is visible right away
            onSuccess(data.url);
            setIsUploadingPhoto(false);

            // Step 2: Concurrently analyze with Gemini Vision AI using the uploaded URL
            // (Uses negligible mobile data, as the phone only sends the lightweight URL payload)
            if (aiContext) {
                try {
                    const aiRes = await fetch("/api/os/tickets/analyze", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            imageUrl: data.url,
                            type: aiContext.type
                        })
                    });

                    if (aiRes.ok) {
                        const aiData = await aiRes.json();
                        if (aiData.success && aiData.data) {
                            const { supplier, description, cost } = aiData.data;
                            const hasData = Boolean(supplier || description || (cost !== null && cost !== undefined));

                            if (hasData) {
                                if (aiContext.target === "newPart") {
                                    if (supplier) setNewPartSupplier(supplier);
                                    if (description) setNewPartDesc(description);
                                    if (cost !== null && cost !== undefined) setNewPartCost(String(cost));
                                } else if (aiContext.target === "editPart") {
                                    if (supplier) setEditPartSupplier(supplier);
                                    if (description) setEditPartDesc(description);
                                    if (cost !== null && cost !== undefined) setEditPartCost(String(cost));
                                } else if (aiContext.target === "newExt") {
                                    if (supplier) setNewExtVendor(supplier);
                                    if (description) setNewExtDesc(description);
                                    if (cost !== null && cost !== undefined) setNewExtCost(String(cost));
                                } else if (aiContext.target === "editExt") {
                                    if (supplier) setEditExtVendor(supplier);
                                    if (description) setEditExtDesc(description);
                                    if (cost !== null && cost !== undefined) setEditExtCost(String(cost));
                                }

                                setAiDetectedBadge({
                                    target: aiContext.target,
                                    status: "success",
                                    supplier,
                                    description,
                                    cost,
                                    modelUsed: aiData.modelUsed
                                });
                            } else {
                                setAiDetectedBadge({
                                    target: aiContext.target,
                                    status: "empty",
                                    message: aiData.data.notes || "No se detectaron datos legibles en el ticket. Puedes llenarlos manualmente."
                                });
                            }
                        } else {
                            setAiDetectedBadge({
                                target: aiContext.target,
                                status: "empty",
                                message: "No se pudieron extraer datos del ticket. Puedes llenarlos manualmente."
                            });
                        }
                    } else {
                        setAiDetectedBadge({
                            target: aiContext.target,
                            status: "error",
                            message: "No se pudo completar el análisis del ticket. Puedes ingresar los datos a mano."
                        });
                    }
                } catch (aiErr: any) {
                    console.warn("[Ticket AI] Error en análisis automático:", aiErr);
                    setAiDetectedBadge({
                        target: aiContext.target,
                        status: "error",
                        message: "Fallo de conexión al analizar el ticket con IA. Puedes ingresar los datos a mano."
                    });
                } finally {
                    setIsAnalyzingTicket(false);
                }
            }
        } catch (err: any) {
            console.error("Error al procesar/subir foto de ticket:", err);
            setUploadError(err.message || "Error al subir la imagen");
            setIsAnalyzingTicket(false);
        } finally {
            setIsUploadingPhoto(false);
            e.target.value = "";
        }
    };

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
        setAiDetectedBadge(null);

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

    // Delete Part
    const handleDeletePart = async (partId: string | number) => {
        const nextParts = parts.filter(p => p.id !== partId);
        setParts(nextParts);

        try {
            await fetch("/api/os/recent-vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plate: cleanPlate,
                    status: currentStatus,
                    mechanic: selectedMechanics.join(", "),
                    parts: nextParts,
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
            console.error("Error al eliminar refacción:", e);
        }
    };

    // Start / Save Edit Part
    const startEditPart = (p: PartItem) => {
        setEditingPartId(p.id);
        setEditPartDesc(p.description);
        setEditPartCost(String(p.cost || ""));
        setEditPartSupplier(p.supplier || "");
        setEditPartPhotoUrl(p.photoUrl || "");
    };

    const handleUpdatePart = async (partId: string | number) => {
        if (!editPartDesc.trim()) return;
        const costNum = parseFloat(editPartCost) || 0;
        const nextParts = parts.map(p =>
            p.id === partId
                ? {
                    ...p,
                    description: editPartDesc.trim(),
                    cost: costNum,
                    supplier: editPartSupplier.trim() || "Taller",
                    photoUrl: editPartPhotoUrl.trim() || undefined,
                }
                : p
        );

        setParts(nextParts);
        setEditingPartId(null);
        setEditPartPhotoUrl("");
        setAiDetectedBadge(null);

        try {
            await fetch("/api/os/recent-vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plate: cleanPlate,
                    status: currentStatus,
                    mechanic: selectedMechanics.join(", "),
                    parts: nextParts,
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
            console.error("Error al actualizar refacción:", e);
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
            photoUrl: newExtPhotoUrl.trim() || undefined,
            date: new Date().toISOString(),
        };

        const nextExts = [...externals, extObj];
        setExternals(nextExts);
        setNewExtDesc("");
        setNewExtCost("");
        setNewExtVendor("");
        setNewExtPhotoUrl("");
        setShowAddExt(false);
        setAiDetectedBadge(null);

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

    // Delete External Service
    const handleDeleteExternal = async (extId: string | number) => {
        const nextExts = externals.filter(e => e.id !== extId);
        setExternals(nextExts);

        try {
            await fetch("/api/os/recent-vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plate: cleanPlate,
                    status: currentStatus,
                    mechanic: selectedMechanics.join(", "),
                    externalServices: nextExts,
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
            console.error("Error al eliminar servicio externo:", e);
        }
    };

    // Start / Save Edit External Service
    const startEditExternal = (e: ExternalServiceItem) => {
        setEditingExtId(e.id);
        setEditExtDesc(e.description);
        setEditExtCost(String(e.cost || ""));
        setEditExtVendor(e.vendor || "");
        setEditExtPhotoUrl(e.photoUrl || "");
        setAiDetectedBadge(null);
    };

    const handleUpdateExternal = async (extId: string | number) => {
        if (!editExtDesc.trim()) return;
        const costNum = parseFloat(editExtCost) || 0;
        const nextExts = externals.map(e =>
            e.id === extId
                ? {
                    ...e,
                    description: editExtDesc.trim(),
                    cost: costNum,
                    vendor: editExtVendor.trim() || "Externo",
                    photoUrl: editExtPhotoUrl.trim() || undefined,
                }
                : e
        );

        setExternals(nextExts);
        setEditingExtId(null);
        setEditExtPhotoUrl("");
        setAiDetectedBadge(null);

        try {
            await fetch("/api/os/recent-vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plate: cleanPlate,
                    status: currentStatus,
                    mechanic: selectedMechanics.join(", "),
                    externalServices: nextExts,
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
            console.error("Error al actualizar servicio externo:", e);
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
                description: `${e.description} (${e.vendor || 'Rectificación / Sublet'})`,
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

    const allTickets = [
        ...parts.filter(p => p.photoUrl).map(p => ({ url: p.photoUrl!, label: p.description, cost: p.cost, type: 'refaccion' })),
        ...externals.filter(e => e.photoUrl).map(e => ({ url: e.photoUrl!, label: e.description, cost: e.cost, type: 'rectificacion' })),
    ];

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
                <div className="px-3.5 py-3 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="font-mono font-black text-sm tracking-wider bg-slate-900 text-white px-2.5 py-0.5 rounded-lg border border-slate-700 shadow-sm">
                                {plates}
                            </span>
                            <span className="text-xs font-black text-slate-500 uppercase truncate max-w-[180px]">
                                {vehicle.vehicle?.year} {vehicle.vehicle?.brand} {vehicle.vehicle?.model}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium flex-wrap">
                            <span className="flex items-center gap-1">
                                <Gauge size={11} className="text-slate-400" />
                                {vehicle.vehicle?.km ? `${vehicle.vehicle.km.toLocaleString()} km` : "Sin km"}
                            </span>
                            <span className="flex items-center gap-1">
                                <Fuel size={11} className="text-slate-400" />
                                {vehicle.vehicle?.gas ? `${vehicle.vehicle.gas} tanque` : "—"}
                            </span>
                            <span>• Ingresó: {vehicle.dateDisplay || "Hoy"}</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors flex-shrink-0"
                        title="Cerrar panel"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 sm:space-y-6">

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

                            {mode !== 'piso' && waUrl && (
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
                                        className="px-2.5 py-1 text-base sm:text-xs border border-slate-300 rounded-lg w-28 focus:outline-none focus:border-[#f16315]"
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

                    {/* Galería Rápida de Tickets del Vehículo (si tiene fotos subidas) */}
                    {allTickets.length > 0 && (
                        <div className="p-3 bg-gradient-to-r from-amber-50/90 via-orange-50/90 to-amber-50/90 border border-amber-200/90 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
                                    <Camera size={13} className="text-[#f16315]" />
                                    Fotos de Tickets del Auto ({allTickets.length})
                                </span>
                                <span className="text-[10px] text-amber-800 font-bold">
                                    Toca para inspeccionar
                                </span>
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                                {allTickets.map((t, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            setZoomImage(t.url);
                                            setZoomRotation(0);
                                        }}
                                        className="flex-shrink-0 group relative w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-sm hover:scale-105 hover:shadow-md transition-all cursor-pointer"
                                        title={`${t.label} - $${Number(t.cost || 0).toLocaleString()}`}
                                    >
                                        <img src={t.url} alt={t.label} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <ZoomIn size={14} className="text-white" />
                                        </div>
                                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white font-bold text-center truncate px-0.5">
                                            ${Number(t.cost || 0).toLocaleString()}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tabs: Refacciones / Rectificación / Bitácora */}
                    <div>
                        <div className="flex bg-slate-100 p-0.5 sm:p-1 rounded-xl mb-4">
                            <button
                                onClick={() => setActiveTab("refacciones")}
                                className={`flex-1 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
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
                                className={`flex-1 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
                                    activeTab === "externos"
                                        ? "bg-white text-slate-800 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                <span className="sm:hidden">Rectif.</span>
                                <span className="hidden sm:inline">Rectificación</span>
                                {externals.length > 0 && (
                                    <span className="bg-indigo-500 text-white text-[9px] px-1.5 rounded-full">
                                        {externals.length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setActiveTab("bitacora")}
                                className={`flex-1 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 ${
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
                                            className="w-full text-base sm:text-xs p-2.5 sm:p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#f16315]"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                placeholder="Costo $ MXN"
                                                value={newPartCost}
                                                onChange={(e) => setNewPartCost(e.target.value)}
                                                className="text-base sm:text-xs p-2.5 sm:p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#f16315]"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Proveedor (Autozone, etc.)"
                                                value={newPartSupplier}
                                                onChange={(e) => setNewPartSupplier(e.target.value)}
                                                className="text-base sm:text-xs p-2.5 sm:p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#f16315]"
                                            />
                                        </div>
                                        {/* Subir foto ticket */}
                                        <div className="space-y-1.5 pt-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                                                <span>Foto del Ticket / Factura</span>
                                                {newPartPhotoUrl && (
                                                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                                        <Check size={11} /> Ticket adjuntado
                                                    </span>
                                                )}
                                            </label>

                                            {newPartPhotoUrl ? (
                                                <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setZoomImage(newPartPhotoUrl);
                                                            setZoomRotation(0);
                                                        }}
                                                        className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 group relative cursor-pointer"
                                                        title="Ver ticket"
                                                    >
                                                        <img src={newPartPhotoUrl} alt="Ticket" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <ZoomIn size={14} className="text-white" />
                                                        </div>
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 truncate">Ticket adjunto</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setZoomImage(newPartPhotoUrl);
                                                                setZoomRotation(0);
                                                            }}
                                                            className="text-[11px] text-[#f16315] font-bold hover:underline block text-left"
                                                        >
                                                            Ver foto completa
                                                        </button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewPartPhotoUrl("")}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Quitar foto"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <label className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 border-dashed text-xs font-bold transition-all cursor-pointer ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' : 'border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100/70 hover:border-amber-400'}`}>
                                                            <Camera size={15} className="text-[#f16315]" />
                                                            <span>Tomar Foto</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                capture="environment"
                                                                disabled={isUploadingPhoto}
                                                                className="hidden"
                                                                onChange={(e) => handleUploadPhotoFile(e, (url) => setNewPartPhotoUrl(url), "refaccion", { type: "refaccion", target: "newPart" })}
                                                            />
                                                        </label>
                                                        <label className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 border-dashed text-xs font-bold transition-all cursor-pointer ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' : 'border-slate-200 bg-white text-slate-700 hover:border-[#f16315] hover:text-[#f16315]'}`}>
                                                            <ImageIcon size={15} />
                                                            <span>Subir Foto</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                disabled={isUploadingPhoto}
                                                                className="hidden"
                                                                onChange={(e) => handleUploadPhotoFile(e, (url) => setNewPartPhotoUrl(url), "refaccion", { type: "refaccion", target: "newPart" })}
                                                            />
                                                        </label>
                                                    </div>
                                                    {isUploadingPhoto && (
                                                        <div className="flex items-center justify-center gap-2 p-2 bg-amber-50 rounded-lg text-amber-800 text-xs font-medium animate-pulse">
                                                            <Loader2 size={13} className="animate-spin text-[#f16315]" />
                                                            <span>Subiendo ticket a la nube...</span>
                                                        </div>
                                                    )}
                                                    {uploadError && (
                                                        <p className="text-[11px] text-rose-500 font-semibold px-1">{uploadError}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* AI Status / Result feedback */}
                                            {isAnalyzingTicket && (
                                                <div className="flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/70 rounded-lg text-purple-900 text-xs font-semibold animate-pulse shadow-sm">
                                                    <Sparkles size={14} className="animate-spin text-purple-600 shrink-0" />
                                                    <span>Leyendo ticket con IA (Gemini 3.5)...</span>
                                                </div>
                                            )}

                                            {renderAiBadge("newPart")}
                                        </div>
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
                                            Toma foto del ticket arriba o súbela desde tu galería.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {parts.map((p, idx) => (
                                            editingPartId === p.id ? (
                                                <div key={p.id || idx} className="p-3 bg-amber-50/70 border border-amber-300 rounded-xl space-y-2 animate-in fade-in duration-150">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-bold text-amber-900 uppercase">
                                                            Editar Refacción
                                                        </span>
                                                        <span className="text-[10px] text-amber-700 font-medium">Modo edición</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Descripción (ej. Balatas delanteras)"
                                                        value={editPartDesc}
                                                        onChange={(e) => setEditPartDesc(e.target.value)}
                                                        className="w-full text-base sm:text-xs p-2.5 sm:p-2 bg-white border border-amber-200 rounded-lg focus:outline-none focus:border-[#f16315]"
                                                    />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            type="number"
                                                            placeholder="Costo $ MXN"
                                                            value={editPartCost}
                                                            onChange={(e) => setEditPartCost(e.target.value)}
                                                            className="text-base sm:text-xs p-2.5 sm:p-2 bg-white border border-amber-200 rounded-lg focus:outline-none focus:border-[#f16315]"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Proveedor (AutoZone, etc.)"
                                                            value={editPartSupplier}
                                                            onChange={(e) => setEditPartSupplier(e.target.value)}
                                                            className="text-base sm:text-xs p-2.5 sm:p-2 bg-white border border-amber-200 rounded-lg focus:outline-none focus:border-[#f16315]"
                                                        />
                                                    </div>

                                                    {/* Subir / Editar foto ticket */}
                                                    <div className="space-y-1.5 pt-1">
                                                        <label className="text-[10px] font-bold text-amber-900 uppercase flex items-center justify-between">
                                                            <span>Foto del Ticket / Factura</span>
                                                            {editPartPhotoUrl && (
                                                                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                                                    <Check size={11} /> Ticket adjuntado
                                                                </span>
                                                            )}
                                                        </label>

                                                        {editPartPhotoUrl ? (
                                                            <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-amber-200">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setZoomImage(editPartPhotoUrl);
                                                                        setZoomRotation(0);
                                                                    }}
                                                                    className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 group relative cursor-pointer"
                                                                    title="Ver ticket"
                                                                >
                                                                    <img src={editPartPhotoUrl} alt="Ticket" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                        <ZoomIn size={14} className="text-white" />
                                                                    </div>
                                                                </button>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-slate-800 truncate">Ticket actual</p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setZoomImage(editPartPhotoUrl);
                                                                            setZoomRotation(0);
                                                                        }}
                                                                        className="text-[11px] text-[#f16315] font-bold hover:underline block text-left"
                                                                    >
                                                                        Ver foto completa
                                                                    </button>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditPartPhotoUrl("")}
                                                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                                    title="Quitar foto"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1.5">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <label className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border-2 border-dashed text-xs font-bold transition-all cursor-pointer ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' : 'border-amber-300 bg-white text-amber-900 hover:bg-amber-100/70 hover:border-amber-400'}`}>
                                                                        <Camera size={14} className="text-[#f16315]" />
                                                                        <span>Tomar Foto</span>
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            capture="environment"
                                                                            disabled={isUploadingPhoto}
                                                                            className="hidden"
                                                                            onChange={(e) => handleUploadPhotoFile(e, (url) => setEditPartPhotoUrl(url), "refaccion", { type: "refaccion", target: "editPart" })}
                                                                        />
                                                                    </label>
                                                                    <label className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border-2 border-dashed text-xs font-bold transition-all cursor-pointer ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' : 'border-slate-200 bg-white text-slate-700 hover:border-[#f16315] hover:text-[#f16315]'}`}>
                                                                        <ImageIcon size={14} />
                                                                        <span>Subir Foto</span>
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            disabled={isUploadingPhoto}
                                                                            className="hidden"
                                                                            onChange={(e) => handleUploadPhotoFile(e, (url) => setEditPartPhotoUrl(url), "refaccion", { type: "refaccion", target: "editPart" })}
                                                                        />
                                                                    </label>
                                                                </div>
                                                                {isUploadingPhoto && (
                                                                    <div className="flex items-center justify-center gap-2 p-2 bg-amber-100/70 rounded-lg text-amber-900 text-xs font-medium animate-pulse">
                                                                        <Loader2 size={13} className="animate-spin text-[#f16315]" />
                                                                        <span>Subiendo ticket a la nube...</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                            {/* AI Status / Result feedback */}
                                                            {isAnalyzingTicket && (
                                                                <div className="flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/70 rounded-lg text-purple-900 text-xs font-semibold animate-pulse shadow-sm">
                                                                    <Sparkles size={14} className="animate-spin text-purple-600 shrink-0" />
                                                                    <span>Leyendo ticket con IA (Gemini 3.5)...</span>
                                                                </div>
                                                            )}

                                                            {renderAiBadge("editPart")}
                                                        </div>
                                                    <div className="flex justify-end gap-2 pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingPartId(null)}
                                                            className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded-lg font-bold"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdatePart(p.id)}
                                                            className="px-3 py-1 text-xs bg-[#f16315] hover:bg-[#d95510] text-white rounded-lg font-bold shadow-sm"
                                                        >
                                                            Guardar Cambios
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    key={p.id || idx}
                                                    className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-200 transition-all"
                                                >
                                                    <div
                                                        onClick={() => startEditPart(p)}
                                                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                                                        title="Click para editar refacción"
                                                    >
                                                        {p.photoUrl ? (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setZoomImage(p.photoUrl!);
                                                                }}
                                                                className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 group/img relative"
                                                                title="Ver foto del ticket"
                                                            >
                                                                <img
                                                                    src={p.photoUrl}
                                                                    alt="Ticket"
                                                                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                                                                />
                                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                                                    <ZoomIn size={14} className="text-white" />
                                                                </div>
                                                            </button>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 font-bold text-xs group-hover:bg-amber-100 transition-colors">
                                                                <Wrench size={16} />
                                                            </div>
                                                        )}

                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#f16315] transition-colors">
                                                                {p.description}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400">
                                                                Proveedor: <span className="font-semibold text-slate-600">{p.supplier || "Taller"}</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        <div className="text-right">
                                                            <p className="text-xs font-black text-slate-900">
                                                                ${(Number(p.cost) || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                                            </p>
                                                            {p.photoUrl && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setZoomImage(p.photoUrl!)}
                                                                    className="text-[10px] text-[#f16315] font-bold hover:underline block"
                                                                >
                                                                    Ver ticket
                                                                </button>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => startEditPart(p)}
                                                            className="p-1.5 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors ml-1"
                                                            title="Editar refacción"
                                                        >
                                                            <Pencil size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeletePart(p.id)}
                                                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Eliminar refacción"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )
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

                        {/* Contenido Pestaña 2: Servicios Externos / Rectificación */}
                        {activeTab === "externos" && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-500 uppercase">
                                        Rectificación, Lavado, Alineación (Sublet)
                                    </span>
                                    <button
                                        onClick={() => setShowAddExt(!showAddExt)}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors"
                                    >
                                        <Plus size={13} />
                                        <span>Agregar rectificación / servicio</span>
                                    </button>
                                </div>

                                {showAddExt && (
                                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2 animate-in fade-in duration-150">
                                        <p className="text-[11px] font-bold text-indigo-900 uppercase">
                                            Nuevo Servicio de Rectificación / Externo
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="Descripción (ej. Rectificado de discos, cabeza de motor)"
                                            value={newExtDesc}
                                            onChange={(e) => setNewExtDesc(e.target.value)}
                                            className="w-full text-base sm:text-xs p-2.5 sm:p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                placeholder="Costo $ MXN"
                                                value={newExtCost}
                                                onChange={(e) => setNewExtCost(e.target.value)}
                                                className="text-base sm:text-xs p-2.5 sm:p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Proveedor (Rectificación Don Pepe, etc.)"
                                                value={newExtVendor}
                                                onChange={(e) => setNewExtVendor(e.target.value)}
                                                className="text-base sm:text-xs p-2.5 sm:p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                            />
                                        </div>

                                        {/* Subir foto ticket / remisión */}
                                        <div className="space-y-1.5 pt-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between">
                                                <span>Ticket / Remisión (Opcional)</span>
                                                {newExtPhotoUrl && (
                                                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                                        <Check size={11} /> Ticket adjuntado
                                                    </span>
                                                )}
                                            </label>

                                            {newExtPhotoUrl ? (
                                                <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-indigo-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setZoomImage(newExtPhotoUrl);
                                                            setZoomRotation(0);
                                                        }}
                                                        className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 group relative cursor-pointer"
                                                        title="Ver comprobante"
                                                    >
                                                        <img src={newExtPhotoUrl} alt="Comprobante" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <ZoomIn size={14} className="text-white" />
                                                        </div>
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 truncate">Comprobante listo</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setZoomImage(newExtPhotoUrl);
                                                                setZoomRotation(0);
                                                            }}
                                                            className="text-[11px] text-indigo-600 font-bold hover:underline block text-left"
                                                        >
                                                            Ver foto completa
                                                        </button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewExtPhotoUrl("")}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                        title="Quitar foto"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <label className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 border-dashed text-xs font-bold transition-all cursor-pointer ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' : 'border-indigo-300 bg-indigo-50/70 text-indigo-900 hover:bg-indigo-100/70 hover:border-indigo-400'}`}>
                                                            <Camera size={15} className="text-indigo-600" />
                                                            <span>Tomar Foto</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                capture="environment"
                                                                disabled={isUploadingPhoto}
                                                                className="hidden"
                                                                onChange={(e) => handleUploadPhotoFile(e, (url) => setNewExtPhotoUrl(url), "rectificacion", { type: "rectificacion", target: "newExt" })}
                                                            />
                                                        </label>
                                                        <label className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border-2 border-dashed text-xs font-bold transition-all cursor-pointer ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-500 hover:text-indigo-600'}`}>
                                                            <ImageIcon size={15} />
                                                            <span>Subir Foto</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                disabled={isUploadingPhoto}
                                                                className="hidden"
                                                                onChange={(e) => handleUploadPhotoFile(e, (url) => setNewExtPhotoUrl(url), "rectificacion", { type: "rectificacion", target: "newExt" })}
                                                            />
                                                        </label>
                                                    </div>
                                                    {isUploadingPhoto && (
                                                        <div className="flex items-center justify-center gap-2 p-2 bg-indigo-50 rounded-lg text-indigo-800 text-xs font-medium animate-pulse">
                                                            <Loader2 size={13} className="animate-spin text-indigo-600" />
                                                            <span>Subiendo comprobante a la nube...</span>
                                                        </div>
                                                    )}
                                                    {uploadError && (
                                                        <p className="text-[11px] text-rose-500 font-semibold px-1">{uploadError}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* AI Status / Result feedback */}
                                            {isAnalyzingTicket && (
                                                <div className="flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/70 rounded-lg text-purple-900 text-xs font-semibold animate-pulse shadow-sm">
                                                    <Sparkles size={14} className="animate-spin text-purple-600 shrink-0" />
                                                    <span>Leyendo comprobante con IA (Gemini 3.5)...</span>
                                                </div>
                                            )}

                                            {renderAiBadge("newExt")}
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
                                            No hay servicios de rectificación o externos registrados.
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            Puedes agregar rectificados, lavados o maquinados aquí.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {externals.map((e, idx) => (
                                            editingExtId === e.id ? (
                                                <div key={e.id || idx} className="p-3 bg-indigo-50/70 border border-indigo-300 rounded-xl space-y-2 animate-in fade-in duration-150">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-bold text-indigo-900 uppercase">
                                                            Editar Rectificación / Externo
                                                        </span>
                                                        <span className="text-[10px] text-indigo-700 font-medium">Modo edición</span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="Descripción (ej. Rectificado de discos)"
                                                        value={editExtDesc}
                                                        onChange={(ev) => setEditExtDesc(ev.target.value)}
                                                        className="w-full text-base sm:text-xs p-2.5 sm:p-2 bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                                    />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <input
                                                            type="number"
                                                            placeholder="Costo $ MXN"
                                                            value={editExtCost}
                                                            onChange={(ev) => setEditExtCost(ev.target.value)}
                                                            className="text-base sm:text-xs p-2.5 sm:p-2 bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Proveedor (Rectificación Don Pepe, etc.)"
                                                            value={editExtVendor}
                                                            onChange={(ev) => setEditExtVendor(ev.target.value)}
                                                            className="text-base sm:text-xs p-2.5 sm:p-2 bg-white border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500"
                                                        />
                                                    </div>

                                                    {/* Subir / Editar foto ticket externo */}
                                                    <div className="space-y-1.5 pt-1">
                                                        <label className="text-[10px] font-bold text-indigo-900 uppercase flex items-center justify-between">
                                                            <span>Foto del Ticket / Remisión</span>
                                                            {editExtPhotoUrl && (
                                                                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                                                    <Check size={11} /> Ticket adjuntado
                                                                </span>
                                                            )}
                                                        </label>

                                                        {editExtPhotoUrl ? (
                                                            <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-indigo-200">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setZoomImage(editExtPhotoUrl);
                                                                        setZoomRotation(0);
                                                                    }}
                                                                    className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 group relative cursor-pointer"
                                                                    title="Ver comprobante"
                                                                >
                                                                    <img src={editExtPhotoUrl} alt="Comprobante" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                                        <ZoomIn size={14} className="text-white" />
                                                                    </div>
                                                                </button>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold text-slate-800 truncate">Comprobante actual</p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setZoomImage(editExtPhotoUrl);
                                                                            setZoomRotation(0);
                                                                        }}
                                                                        className="text-[11px] text-indigo-600 font-bold hover:underline block text-left"
                                                                    >
                                                                        Ver foto completa
                                                                    </button>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditExtPhotoUrl("")}
                                                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                                    title="Quitar foto"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-1.5">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <label className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border-2 border-dashed text-xs font-bold transition-all cursor-pointer ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' : 'border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-100/70 hover:border-indigo-400'}`}>
                                                                        <Camera size={14} className="text-indigo-600" />
                                                                        <span>Tomar Foto</span>
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            capture="environment"
                                                                            disabled={isUploadingPhoto}
                                                                            className="hidden"
                                                                            onChange={(e) => handleUploadPhotoFile(e, (url) => setEditExtPhotoUrl(url), "rectificacion", { type: "rectificacion", target: "editExt" })}
                                                                        />
                                                                    </label>
                                                                    <label className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border-2 border-dashed text-xs font-bold transition-all cursor-pointer ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-500 hover:text-indigo-600'}`}>
                                                                        <ImageIcon size={14} />
                                                                        <span>Subir Foto</span>
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            disabled={isUploadingPhoto}
                                                                            className="hidden"
                                                                            onChange={(e) => handleUploadPhotoFile(e, (url) => setEditExtPhotoUrl(url), "rectificacion", { type: "rectificacion", target: "editExt" })}
                                                                        />
                                                                    </label>
                                                                </div>
                                                                {isUploadingPhoto && (
                                                                    <div className="flex items-center justify-center gap-2 p-2 bg-indigo-100/70 rounded-lg text-indigo-900 text-xs font-medium animate-pulse">
                                                                        <Loader2 size={13} className="animate-spin text-indigo-600" />
                                                                        <span>Subiendo comprobante a la nube...</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* AI Status / Result feedback */}
                                                        {isAnalyzingTicket && (
                                                            <div className="flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/70 rounded-lg text-purple-900 text-xs font-semibold animate-pulse shadow-sm">
                                                                <Sparkles size={14} className="animate-spin text-purple-600 shrink-0" />
                                                                <span>Leyendo comprobante con IA (Gemini 3.5)...</span>
                                                            </div>
                                                        )}

                                                        {renderAiBadge("editExt")}
                                                    </div>

                                                    <div className="flex justify-end gap-2 pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingExtId(null)}
                                                            className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded-lg font-bold"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateExternal(e.id)}
                                                            className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
                                                        >
                                                            Guardar Cambios
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    key={e.id || idx}
                                                    className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-200 transition-all"
                                                >
                                                    <div
                                                        onClick={() => startEditExternal(e)}
                                                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                                                        title="Click para editar servicio"
                                                    >
                                                        {e.photoUrl ? (
                                                            <button
                                                                type="button"
                                                                onClick={(ev) => {
                                                                    ev.stopPropagation();
                                                                    setZoomImage(e.photoUrl!);
                                                                    setZoomRotation(0);
                                                                }}
                                                                className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 group/img relative"
                                                                title="Ver ticket de rectificación"
                                                            >
                                                                <img
                                                                    src={e.photoUrl}
                                                                    alt="Ticket"
                                                                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                                                                />
                                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                                                    <ZoomIn size={14} className="text-white" />
                                                                </div>
                                                            </button>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold text-xs group-hover:bg-indigo-100 transition-colors">
                                                                <Wrench size={16} />
                                                            </div>
                                                        )}

                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                                                                {e.description}
                                                            </p>
                                                            <p className="text-[10px] text-slate-400">
                                                                Proveedor: <span className="font-semibold text-slate-600">{e.vendor || "Externo"}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        <div className="text-right">
                                                            <p className="text-xs font-black text-slate-900">
                                                                ${(Number(e.cost) || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                                            </p>
                                                            {e.photoUrl && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setZoomImage(e.photoUrl!);
                                                                        setZoomRotation(0);
                                                                    }}
                                                                    className="text-[10px] text-indigo-600 font-bold hover:underline block"
                                                                >
                                                                    Ver ticket
                                                                </button>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => startEditExternal(e)}
                                                            className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors ml-1"
                                                            title="Editar servicio"
                                                        >
                                                            <Pencil size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteExternal(e.id)}
                                                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                            title="Eliminar servicio"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        ))}

                                        <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between">
                                            <span className="text-xs font-bold text-indigo-900 uppercase">
                                                Total Rectificación / Externos:
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
                                        className="w-full text-base sm:text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#f16315]"
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
                                    {parts.length} refacciones • {externals.length} rectificación / externos
                                </p>
                            </div>
                            <p className="text-xl font-black text-amber-400">
                                ${grandTotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Action Bar */}
                <div className="px-3.5 py-3 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-3">
                    {mode !== 'piso' && onExpedienteSearch && (
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

                    {mode === 'piso' ? (
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
                        >
                            <Check size={17} className="text-emerald-400" />
                            <span>Listo / Cerrar Ficha</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleGoToNote}
                            className="flex-1 py-2.5 px-4 bg-[#f16315] hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-300"
                        >
                            <FileText size={15} />
                            <span>Generar Nota con Todo Precargado</span>
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Modal Zoom Lightbox para foto de tickets */}
            {zoomImage && (
                <div
                    onClick={() => {
                        setZoomImage(null);
                        setZoomRotation(0);
                    }}
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-150"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-3xl max-h-[92vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-800"
                    >
                        <div className="p-3 bg-slate-800 text-white flex items-center justify-between text-xs font-bold border-b border-slate-700/80">
                            <span className="flex items-center gap-1.5">
                                <Camera size={14} className="text-[#f16315]" />
                                Inspección de Ticket / Comprobante
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setZoomRotation((r) => (r + 90) % 360)}
                                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-white transition-colors flex items-center gap-1 shadow-sm"
                                    title="Girar imagen 90 grados"
                                >
                                    <RotateCw size={13} />
                                    <span>Girar 90°</span>
                                </button>
                                <a
                                    href={zoomImage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold text-white transition-colors flex items-center gap-1 shadow-sm"
                                    title="Abrir imagen original"
                                >
                                    <ExternalLink size={13} />
                                    <span>Original</span>
                                </a>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setZoomImage(null);
                                        setZoomRotation(0);
                                    }}
                                    className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-auto p-4 flex items-center justify-center bg-black/60 flex-1 min-h-[300px]">
                            <img
                                src={zoomImage}
                                alt="Ticket en zoom"
                                style={{ transform: `rotate(${zoomRotation}deg)` }}
                                className="max-w-full max-h-[72vh] object-contain rounded-lg transition-transform duration-200 shadow-2xl"
                            />
                        </div>
                        <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-800 border-t border-slate-700/80">
                            Gira la imagen si el ticket fue tomado en horizontal, o haz clic en "Original" para ver a máxima resolución.
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
