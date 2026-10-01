"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Car, User, Phone, Wrench, ShieldCheck, Clock,
    DollarSign, Image as ImageIcon, Plus, Check, ChevronRight,
    ExternalLink, FileText, History, ZoomIn, ZoomOut, AlertCircle,
    RotateCcw, Sparkles, Fuel, Gauge, Trash2, Pencil, Camera,
    Loader2, RotateCw, Copy, Share2
} from "lucide-react";
import { compressImage, blobToBase64 } from "@/lib/image-utils";
import { generateTrackerToken } from "@/lib/tracker-token";
import {
    WORKSHOP_PIPELINE,
    RESOLUTION_STATUSES,
    getFloorStage,
    FloorStageConfig
} from "@/types/floor-pipeline";

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

    // Multi-part detection modal state
    const [multiPartModal, setMultiPartModal] = useState<{
        isOpen: boolean;
        target: "newPart" | "newExt";
        supplier: string;
        photoUrl: string;
        items: Array<{
            id: string;
            description: string;
            cost: number;
            selected: boolean;
        }>;
    } | null>(null);

    // Car Tracker sharing states
    const [copiedLink, setCopiedLink] = useState(false);
    const [currentOrigin, setCurrentOrigin] = useState("https://carmd.com.mx");

    useEffect(() => {
        if (typeof window !== "undefined" && window.location.origin) {
            setCurrentOrigin(window.location.origin);
        }
    }, []);

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
        const isConNota = vehicle.status === 'con_nota' || vehicle.status === 'entregado';
        setCurrentStatus(
            isConNota
                ? 'ENTREGADO'
                : (fData.status || (vehicle.status === 'salida_sin_nota' ? 'SALIDA_SIN_NOTA' : vehicle.status === 'mantenimiento_sin_nota' ? 'MANTENIMIENTO_SIN_NOTA' : vehicle.status === 'diagnostico_sin_nota' ? 'DIAGNOSTICO_SIN_NOTA' : 'EN_RAMPA'))
        );

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
                            const { supplier, description, cost, items } = aiData.data;
                            const hasData = Boolean(supplier || description || (cost !== null && cost !== undefined));

                            // Si se detectaron múltiples partidas (> 1) y el usuario está agregando una nueva refacción o servicio
                            const validItems = Array.isArray(items) && items.length > 1
                                ? items.filter((it: any) => it.description && it.cost > 0)
                                : [];

                            if (validItems.length > 1 && (aiContext.target === "newPart" || aiContext.target === "newExt")) {
                                setMultiPartModal({
                                    isOpen: true,
                                    target: aiContext.target,
                                    supplier: supplier || (aiContext.target === "newPart" ? "Refaccionaria" : "Torno / Externo"),
                                    photoUrl: data.url,
                                    items: validItems.map((it: any, i: number) => ({
                                        id: `item-${Date.now()}-${i}`,
                                        description: it.description,
                                        cost: Number(it.cost) || 0,
                                        selected: true
                                    }))
                                });

                                // También pre-llenamos el formulario individual como respaldo
                                if (aiContext.target === "newPart") {
                                    if (supplier) setNewPartSupplier(supplier);
                                    if (description) setNewPartDesc(description);
                                    if (cost !== null && cost !== undefined) setNewPartCost(String(cost));
                                } else if (aiContext.target === "newExt") {
                                    if (supplier) setNewExtVendor(supplier);
                                    if (description) setNewExtDesc(description);
                                    if (cost !== null && cost !== undefined) setNewExtCost(String(cost));
                                }

                                setAiDetectedBadge({
                                    target: aiContext.target,
                                    status: "success",
                                    supplier,
                                    description: `${validItems.length} conceptos detectados en ticket`,
                                    cost,
                                    modelUsed: aiData.modelUsed
                                });
                                return;
                            }

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
            else if (newStat === "DIAGNOSTICO_SIN_NOTA") mappedStatus = "diagnostico_sin_nota";
            else if (newStat === "ENTREGADO") mappedStatus = "entregado";
            else mappedStatus = vehicle.status === 'con_nota' ? "con_nota" : (vehicle.status === 'en_piso_nuevo' ? 'en_piso_nuevo' : 'en_piso_registrado');

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

    // Handlers for Multi-Part Ticket Breakdown
    const handleToggleMultiPart = (id: string) => {
        if (!multiPartModal) return;
        setMultiPartModal({
            ...multiPartModal,
            items: multiPartModal.items.map(it =>
                it.id === id ? { ...it, selected: !it.selected } : it
            )
        });
    };

    const handleConfirmMultiParts = async () => {
        if (!multiPartModal) return;
        const selected = multiPartModal.items.filter(it => it.selected && it.description.trim() && it.cost > 0);
        if (selected.length === 0) return;

        if (multiPartModal.target === "newPart") {
            const newItems: PartItem[] = selected.map((it, idx) => ({
                id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
                description: it.description.trim(),
                cost: it.cost,
                supplier: multiPartModal.supplier.trim() || "Local",
                photoUrl: multiPartModal.photoUrl || undefined,
                date: new Date().toISOString(),
            }));

            const nextParts = [...parts, ...newItems];
            setParts(nextParts);
            setNewPartDesc("");
            setNewPartCost("");
            setNewPartSupplier("");
            setNewPartPhotoUrl("");
            setShowAddPart(false);
            setMultiPartModal(null);

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
                console.error("Error al guardar múltiples refacciones:", e);
            }
        } else {
            const newItems: ExternalServiceItem[] = selected.map((it, idx) => ({
                id: `${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
                description: it.description.trim(),
                cost: it.cost,
                vendor: multiPartModal.supplier.trim() || "Torno / Externo",
                photoUrl: multiPartModal.photoUrl || undefined,
                date: new Date().toISOString(),
            }));

            const nextExternals = [...externals, ...newItems];
            setExternals(nextExternals);
            setNewExtDesc("");
            setNewExtCost("");
            setNewExtVendor("");
            setNewExtPhotoUrl("");
            setShowAddExt(false);
            setMultiPartModal(null);

            try {
                await fetch("/api/os/recent-vehicles", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        plate: cleanPlate,
                        status: currentStatus,
                        mechanic: selectedMechanics.join(", "),
                        externalServices: nextExternals,
                    }),
                });

                if (onVehicleUpdated) {
                    onVehicleUpdated({
                        ...vehicle,
                        floorData: {
                            ...(vehicle.floorData || {}),
                            externalServices: nextExternals,
                            externalCount: nextExternals.length,
                        },
                    });
                }
            } catch (e) {
                console.error("Error al guardar múltiples servicios externos:", e);
            }
        }
    };

    const handleConsolidateMultiParts = () => {
        if (!multiPartModal) return;
        const selected = multiPartModal.items.filter(it => it.selected);
        const combinedDesc = selected.map(it => it.description).join(", ");
        const totalCost = selected.reduce((sum, it) => sum + it.cost, 0);

        if (multiPartModal.target === "newPart") {
            setNewPartSupplier(multiPartModal.supplier);
            setNewPartDesc(combinedDesc);
            setNewPartCost(totalCost > 0 ? String(totalCost) : "");
            setNewPartPhotoUrl(multiPartModal.photoUrl);
            setShowAddPart(true);
        } else {
            setNewExtVendor(multiPartModal.supplier);
            setNewExtDesc(combinedDesc);
            setNewExtCost(totalCost > 0 ? String(totalCost) : "");
            setNewExtPhotoUrl(multiPartModal.photoUrl);
            setShowAddExt(true);
        }
        setMultiPartModal(null);
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

    const trackerToken = vehicle?.floorData?.token || generateTrackerToken(cleanPlate, vehicle?.dateRaw || '');
    const trackerUrl = `${currentOrigin}/status/${trackerToken}`;
    const clientFirstName = (vehicle.client?.name || "").trim().split(" ")[0] || "Cliente";
    const carName = `${vehicle.vehicle?.brand || ""} ${vehicle.vehicle?.model || ""}`.trim();
    const shareMessage = `Hola ${clientFirstName}, te comparto tu enlace exclusivo de CarMD para seguir en vivo el avance y estatus de tu ${carName} (${cleanPlate}):\n\n${trackerUrl}\n\n¡Seguimos trabajando en tu auto! 🚗🔧`;
    const waTrackerUrl = phoneClean
        ? `https://wa.me/52${phoneClean}?text=${encodeURIComponent(shareMessage)}`
        : null;

    const handleCopyTrackerLink = () => {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(trackerUrl);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        }
    };

    return (
        <>
            {/* Backdrop — en piso mode el modal ya cubre todo, solo se usa en full mode */}
            {mode !== 'piso' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 transition-opacity"
                />
            )}

            {/* 
                piso mode  → full-screen modal que sube desde abajo (inset-0 = cobertura total, sin filtraciones iOS)
                full mode  → panel lateral desde la derecha (comportamiento original) 
            */}
            <motion.div
                initial={mode === 'piso' ? { y: "100%" } : { x: "100%" }}
                animate={mode === 'piso' ? { y: 0 } : { x: 0 }}
                exit={mode === 'piso' ? { y: "100%" } : { x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className={
                    mode === 'piso'
                        ? "fixed inset-0 z-[60] bg-white flex flex-col overflow-hidden"
                        : "fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-hidden"
                }
            >
                {/* Handle de arrastre (solo modo piso — indica que se puede deslizar para cerrar) */}
                {mode === 'piso' && (
                    <div
                        onClick={onClose}
                        className="flex-shrink-0 flex justify-center items-center h-6 bg-slate-50 cursor-pointer active:bg-slate-100 transition-colors"
                        title="Toca para cerrar"
                    >
                        <div className="w-10 h-1 bg-slate-300 rounded-full" />
                    </div>
                )}
                {/* Header */}
                <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-white flex items-start justify-between gap-3 shadow-2xs">
                    <div className="flex-1 min-w-0">
                        {/* Modelo y Año en grande + Placa al mismo nivel de relevancia */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">
                                {vehicle.vehicle?.brand || "Auto"} {vehicle.vehicle?.model || ""} {vehicle.vehicle?.year || ""}
                            </h2>
                            <span className="font-mono font-black text-xs sm:text-sm tracking-wider bg-slate-900 text-white px-2.5 py-1 rounded-lg border border-slate-800 shadow-xs flex-shrink-0">
                                {plates}
                            </span>
                        </div>

                        {/* Metadatos técnicos rápidos */}
                        <div className="flex items-center gap-2 sm:gap-2.5 text-[11px] text-slate-500 font-medium mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                <Gauge size={12} className="text-slate-400" />
                                {vehicle.vehicle?.km ? `${vehicle.vehicle.km.toLocaleString()} km` : "Sin km"}
                            </span>
                            <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                <Fuel size={12} className="text-slate-400" />
                                {vehicle.vehicle?.gas ? `${vehicle.vehicle.gas} tanque` : "—"}
                            </span>
                            <span className="text-slate-400">
                                • Ingresó: <strong className="text-slate-600 font-semibold">{vehicle.dateDisplay || "Hoy"}</strong>
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0 -mr-1"
                        title="Cerrar panel"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 sm:space-y-6">

                    {/* Cliente & Motivo Card — Rediseño visual premium */}
                    <div className="bg-gradient-to-b from-white to-slate-50/80 rounded-2xl p-4 sm:p-4.5 border border-slate-200/90 shadow-xs space-y-3.5">
                        {/* Fila Cliente & Asesor */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-[#f16315] text-white flex items-center justify-center font-black text-sm shadow-sm shadow-orange-500/20 flex-shrink-0">
                                    <User size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-slate-900 truncate leading-tight">
                                        {vehicle.client?.name || "Cliente general"}
                                    </p>
                                    {vehicle.client?.phone ? (
                                        <p className="text-[11px] font-mono font-medium text-slate-500 mt-0.5">
                                            Tel: {vehicle.client.phone}
                                        </p>
                                    ) : (
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Sin teléfono registrado
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Asesor y botón WhatsApp */}
                            <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                                <span className="text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200/90 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                                    <span>Asesor:</span>
                                    <strong className="text-amber-950 font-black">{vehicle.advisor || "Taller"}</strong>
                                </span>

                                {mode !== 'piso' && waUrl && (
                                    <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
                                    >
                                        <Phone size={12} />
                                        <span>WhatsApp</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Car Tracker del Cliente (Enlace Único) */}
                        <div className="bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-orange-50/90 border border-orange-200/90 rounded-2xl p-3.5 space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-[#f16315]" />
                                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                        Car Tracker del Cliente
                                    </span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-orange-900 bg-orange-100/90 px-2 py-0.5 rounded-full border border-orange-200">
                                    {trackerToken}
                                </span>
                            </div>

                            <p className="text-[11px] text-slate-600 leading-snug">
                                Enlace único y seguro para que el cliente consulte el avance en vivo desde su celular.
                            </p>

                            <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                {waTrackerUrl ? (
                                    <a
                                        href={waTrackerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                                    >
                                        <Phone size={13} />
                                        <span>Enviar por WhatsApp</span>
                                    </a>
                                ) : (
                                    <span className="text-[11px] text-slate-400 italic">
                                        Sin WhatsApp registrado
                                    </span>
                                )}

                                <button
                                    type="button"
                                    onClick={handleCopyTrackerLink}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                >
                                    {copiedLink ? (
                                        <>
                                            <Check size={13} className="text-emerald-600" />
                                            <span className="text-emerald-700">¡Copiado!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={13} />
                                            <span>Copiar Link</span>
                                        </>
                                    )}
                                </button>

                                <a
                                    href={trackerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-white/80 rounded-xl text-xs font-bold transition-all"
                                    title="Ver pantalla del cliente en nueva pestaña"
                                >
                                    <ExternalLink size={13} />
                                    <span>Ver como Cliente</span>
                                </a>
                            </div>
                        </div>

                        {/* Motivo de ingreso reportado */}
                        <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                                <FileText size={12} className="text-[#f16315]" />
                                <span>Motivo de Ingreso Reportado</span>
                            </div>
                            <div className="bg-white rounded-xl p-3 border-l-4 border-l-[#f16315] border border-slate-200/80 shadow-2xs">
                                <p className="text-xs text-slate-800 font-medium leading-relaxed italic">
                                    {vehicle.motivo ? `"${vehicle.motivo}"` : "Sin motivo específico registrado al momento de recepción."}
                                </p>
                            </div>
                        </div>
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

                    {/* Estatus Operativo de Piso / Car Tracker */}
                    <div className="space-y-3 bg-slate-50/70 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80">
                        {/* Header con avance general */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles size={13} className="text-[#f16315]" />
                                    Fase / Progreso (Car Tracker)
                                </label>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    Toca la etapa para avanzar el auto en el pipeline
                                </p>
                            </div>

                            {/* Badge de la etapa activa */}
                            {(() => {
                                const stage = getFloorStage(currentStatus);
                                return (
                                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${stage.badgeBg} ${stage.badgeText} ${stage.badgeBorder}`}>
                                        <span>{stage.icon}</span>
                                        <span>{stage.label}</span>
                                        {!stage.isResolution && (
                                            <span className="font-mono text-[10px] opacity-80">
                                                · {stage.progress}%
                                            </span>
                                        )}
                                    </span>
                                );
                            })()}
                        </div>

                        {/* Barra de Progreso del Pipeline */}
                        {(() => {
                            const stage = getFloorStage(currentStatus);
                            if (stage.isResolution) return null;
                            return (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                        <span>Avance del servicio</span>
                                        <span className="text-[#f16315]">{stage.progress}% completado</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden p-0.5">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 via-[#f16315] to-emerald-500 rounded-full transition-all duration-300"
                                            style={{ width: `${stage.progress}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Las 7 Etapas Activas del Pipeline (Secuenciales) */}
                        <div className="space-y-1.5">
                            {WORKSHOP_PIPELINE.map((stage) => {
                                const isCurrent = currentStatus === stage.id;
                                const activeStage = getFloorStage(currentStatus);
                                const isPast =
                                    !activeStage.isResolution &&
                                    activeStage.step !== undefined &&
                                    stage.step !== undefined &&
                                    stage.step < activeStage.step;

                                return (
                                    <button
                                        key={stage.id}
                                        type="button"
                                        onClick={() => handleChangeStatus(stage.id)}
                                        className={`w-full p-2.5 rounded-xl text-left transition-all border flex items-center justify-between gap-3 ${
                                            isCurrent
                                                ? `${stage.activeBg} ${stage.activeText} ${stage.activeBorder} shadow-sm font-bold ring-2 ring-orange-400/30`
                                                : isPast
                                                ? "bg-emerald-50/70 text-emerald-900 border-emerald-200/80 hover:bg-emerald-50"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {/* Indicador de paso */}
                                            <span
                                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                                                    isCurrent
                                                        ? "bg-white/20 text-white"
                                                        : isPast
                                                        ? "bg-emerald-200 text-emerald-800"
                                                        : "bg-slate-100 text-slate-500"
                                                }`}
                                            >
                                                {isPast ? <Check size={12} /> : stage.step}
                                            </span>

                                            <span className="text-sm flex-shrink-0">{stage.icon}</span>

                                            <div className="min-w-0">
                                                <p className="text-xs font-bold truncate leading-tight">
                                                    {stage.label}
                                                </p>
                                                {isCurrent && (
                                                    <p className="text-[10px] text-white/80 mt-0.5 truncate">
                                                        Etapa activa actualmente en taller
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <span
                                            className={`text-[10px] font-mono font-bold flex-shrink-0 px-2 py-0.5 rounded-md ${
                                                isCurrent
                                                    ? "bg-white/20 text-white"
                                                    : "bg-slate-100 text-slate-500"
                                            }`}
                                        >
                                            {stage.progress}%
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Bloque Separado: Resoluciones de Salida y Casos Especiales */}
                        <div className="pt-2 border-t border-slate-200/80">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                                Resoluciones de Salida / Casos Especiales
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                {RESOLUTION_STATUSES.map((res) => {
                                    const isCurrent = currentStatus === res.id;
                                    return (
                                        <button
                                            key={res.id}
                                            type="button"
                                            onClick={() => handleChangeStatus(res.id)}
                                            className={`p-2 rounded-xl text-left transition-all border flex items-center gap-2 ${
                                                isCurrent
                                                    ? `${res.activeBg} ${res.activeText} ${res.activeBorder} shadow-sm font-bold ring-2 ring-slate-400/30`
                                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                            }`}
                                        >
                                            <span className="text-sm flex-shrink-0">{res.icon}</span>
                                            <span className="text-[11px] font-bold truncate leading-tight">
                                                {res.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
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

            {/* Modal para Desglose de Múltiples Conceptos de Ticket */}
            {multiPartModal && multiPartModal.isOpen && (
                <div
                    onClick={() => setMultiPartModal(null)}
                    className="fixed inset-0 z-[65] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
                    >
                        {/* Header del Modal */}
                        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-2 bg-[#f16315] text-white rounded-xl flex-shrink-0 shadow-sm">
                                    <Sparkles size={16} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-black uppercase tracking-wide truncate">
                                        Desglose de Ticket Detectado
                                    </h3>
                                    <p className="text-[11px] text-slate-300 truncate">
                                        Comercio: <strong className="text-white font-bold">{multiPartModal.supplier || "Comprobante"}</strong>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMultiPartModal(null)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Contenido / Checklist */}
                        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 flex-1">
                            {/* Banner de Ayuda Rápida */}
                            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs">
                                <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold">
                                        Se detectaron {multiPartModal.items.length} conceptos en este ticket
                                    </p>
                                    <p className="text-[11px] text-amber-800/90 mt-0.5">
                                        Marca qué conceptos corresponden a este auto. Si alguna pieza era de otro vehículo, simplemente desmárcala.
                                    </p>
                                </div>
                            </div>

                            {/* Vista previa miniatura del ticket */}
                            {multiPartModal.photoUrl && (
                                <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setZoomImage(multiPartModal.photoUrl);
                                            setZoomRotation(0);
                                        }}
                                        className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-300 flex-shrink-0 group cursor-pointer"
                                        title="Toca para ver ticket completo"
                                    >
                                        <img
                                            src={multiPartModal.photoUrl}
                                            alt="Ticket"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <ZoomIn size={14} className="text-white" />
                                        </div>
                                    </button>
                                    <div className="text-[11px] text-slate-500 min-w-0">
                                        <span className="font-bold text-slate-700 block truncate">
                                            Foto del comprobante vinculada
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            Todas las partidas seleccionadas compartirán este ticket
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Lista de Conceptos con Checkbox */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                                    Partidas encontradas:
                                </label>

                                {multiPartModal.items.map((item, idx) => {
                                    const isChecked = item.selected;
                                    return (
                                        <div
                                            key={item.id || idx}
                                            onClick={() => handleToggleMultiPart(item.id)}
                                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                isChecked
                                                    ? "bg-orange-50/70 border-orange-300 text-slate-900 shadow-2xs"
                                                    : "bg-slate-50/70 border-slate-200 text-slate-400 opacity-60"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleToggleMultiPart(item.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4 rounded text-[#f16315] focus:ring-[#f16315] border-slate-300 flex-shrink-0 cursor-pointer"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-xs font-bold truncate leading-tight ${isChecked ? "text-slate-800" : "text-slate-400 line-through"}`}>
                                                        {item.description}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        Partida #{idx + 1}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right flex-shrink-0">
                                                <span className={`text-xs font-mono font-black ${isChecked ? "text-[#f16315]" : "text-slate-400"}`}>
                                                    ${item.cost.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer con Totales y Botones de Acción */}
                        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
                            {/* Resumen Total Seleccionado */}
                            {(() => {
                                const selectedItems = multiPartModal.items.filter(it => it.selected);
                                const totalSelected = selectedItems.reduce((acc, it) => acc + it.cost, 0);

                                return (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-slate-600">
                                            Total seleccionado ({selectedItems.length} de {multiPartModal.items.length}):
                                        </span>
                                        <span className="font-mono font-black text-sm text-slate-900">
                                            ${totalSelected.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                );
                            })()}

                            {/* Botón Principal: Cargar partidas individuales */}
                            <div className="flex flex-col gap-2">
                                <button
                                    type="button"
                                    onClick={handleConfirmMultiParts}
                                    disabled={multiPartModal.items.filter(it => it.selected).length === 0}
                                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Check size={15} />
                                    <span>
                                        Cargar {multiPartModal.items.filter(it => it.selected).length} partidas individuales
                                    </span>
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleConsolidateMultiParts}
                                        className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-[11px] font-bold transition-all truncate"
                                        title="Junta los conceptos en un solo renglón con la suma del costo"
                                    >
                                        Dejar como 1 solo paquete combinado
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMultiPartModal(null)}
                                        className="py-2 px-3 text-slate-400 hover:text-slate-600 text-[11px] font-bold"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Zoom Lightbox para foto de tickets */}
            {zoomImage && (
                <div
                    onClick={() => {
                        setZoomImage(null);
                        setZoomRotation(0);
                    }}
                    className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-150"
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
