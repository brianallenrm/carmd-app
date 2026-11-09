"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    CircleDashed,
    Camera,
    Loader2,
    RotateCw,
    Trash2,
    UserCheck,
    Sparkles,
    Check,
    Gauge,
    Wrench,
    Disc,
    Droplet,
    Activity,
    Wind,
    Eye,
    Car,
    FileText
} from "lucide-react";
import {
    QualityInspectionData,
    createDefaultQualityInspection,
    isQualityInspectionApproved
} from "@/types/quality-inspection";
import { compressImage, blobToBase64 } from "@/lib/image-utils";

interface QualityInspectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    plate: string;
    vehicleName?: string;
    technicians?: string[];
    initialData?: QualityInspectionData | null;
    onSave: (data: QualityInspectionData) => Promise<void> | void;
}

const DEFAULT_INSPECTORS = ["Alejandra", "Alejandro", "Daniel"];
const DEFAULT_ASSISTANTS = [
    "Sin Auxiliar (Solo)",
    "Josué",
    "Juan Pablo",
    "Rubén",
    "Israel"
];

export default function QualityInspectionModal({
    isOpen,
    onClose,
    plate,
    vehicleName = "Vehículo",
    technicians = [],
    initialData,
    onSave,
}: QualityInspectionModalProps) {
    const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");

    const [data, setData] = useState<QualityInspectionData>(() => {
        if (initialData) return initialData;
        const defaultTech = technicians.length > 0 ? technicians[0] : "";
        return createDefaultQualityInspection(cleanPlate, defaultTech);
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [photoRotation, setPhotoRotation] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync if initialData changes
    React.useEffect(() => {
        if (initialData) {
            setData(initialData);
        } else {
            const defaultTech = technicians.length > 0 ? technicians[0] : "";
            setData(createDefaultQualityInspection(cleanPlate, defaultTech));
        }
    }, [initialData, cleanPlate, technicians]);

    if (!isOpen) return null;

    // Critical toggles
    const toggleCritical = (key: keyof QualityInspectionData["critical"]) => {
        if (key === "wheelsDetail") return;
        setData((prev) => ({
            ...prev,
            critical: {
                ...prev.critical,
                [key]: !prev.critical[key],
            },
        }));
    };

    // Wheels sub-toggles
    const toggleWheel = (wheel: keyof QualityInspectionData["critical"]["wheelsDetail"]) => {
        setData((prev) => {
            const nextDetail = {
                ...prev.critical.wheelsDetail,
                [wheel]: !prev.critical.wheelsDetail[wheel],
            };
            const allWheelsOk =
                nextDetail.frontLeft &&
                nextDetail.frontRight &&
                nextDetail.rearLeft &&
                nextDetail.rearRight;

            return {
                ...prev,
                critical: {
                    ...prev.critical,
                    wheelsDetail: nextDetail,
                    wheelsTorqued: allWheelsOk,
                },
            };
        });
    };

    const toggleAllWheels = () => {
        const currentlyAllOk =
            data.critical.wheelsDetail.frontLeft &&
            data.critical.wheelsDetail.frontRight &&
            data.critical.wheelsDetail.rearLeft &&
            data.critical.wheelsDetail.rearRight;

        const nextVal = !currentlyAllOk;
        setData((prev) => ({
            ...prev,
            critical: {
                ...prev.critical,
                wheelsTorqued: nextVal,
                wheelsDetail: {
                    frontLeft: nextVal,
                    frontRight: nextVal,
                    rearLeft: nextVal,
                    rearRight: nextVal,
                },
            },
        }));
    };

    // Aesthetic toggles
    const toggleAesthetic = (key: keyof QualityInspectionData["aesthetic"]) => {
        setData((prev) => ({
            ...prev,
            aesthetic: {
                ...prev.aesthetic,
                [key]: !prev.aesthetic[key],
            },
        }));
    };

    // Mark all aesthetic as OK
    const markAllAestheticOk = () => {
        setData((prev) => ({
            ...prev,
            aesthetic: {
                cleanInteriorNoGrease: true,
                belongingsReturned: true,
                washAndVacuumDone: true,
                toolsAndSpareSecured: true,
            },
        }));
    };

    // Photo upload handler
    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setPhotoError(null);
        setIsUploadingPhoto(true);

        try {
            const { blob, dataUrl, actualFormat } = await compressImage(file, {
                maxWidth: 1200,
                maxHeight: 900,
                quality: 0.75,
                format: "image/webp",
            });

            // Optimistic preview
            setData((prev) => ({ ...prev, dashboardPhotoUrl: dataUrl }));

            const base64 = await blobToBase64(blob);
            const ext = actualFormat === "image/webp" ? "webp" : "jpg";
            const filename = `${cleanPlate}_tablero_calidad_${Date.now()}.${ext}`;

            const res = await fetch("/api/photos/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: base64,
                    filename,
                    folder: `calidad/${cleanPlate}`,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Error ${res.status}`);
            }

            const resData = await res.json();
            if (resData.url) {
                setData((prev) => ({ ...prev, dashboardPhotoUrl: resData.url }));
            }
        } catch (err: any) {
            console.error("Error al subir foto de calidad:", err);
            setPhotoError(err.message || "Error al subir foto");
        } finally {
            setIsUploadingPhoto(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Validation checks
    const wheelsAllOk =
        data.critical.wheelsDetail.frontLeft &&
        data.critical.wheelsDetail.frontRight &&
        data.critical.wheelsDetail.rearLeft &&
        data.critical.wheelsDetail.rearRight;

    const criticalItems = [
        { label: "Torque de 4 ruedas", ok: wheelsAllOk },
        { label: "Nivel de aceite y tapón", ok: data.critical.oilAndFilterOk },
        { label: "Líquido de frenos y pedal firme", ok: data.critical.brakeFluidAndPedalOk },
        { label: "Anticongelante y tapón hermético", ok: data.critical.coolantCapOk },
        { label: "Presión de llantas verificada", ok: data.critical.tirePressureOk },
        { label: "Prueba de ruta sin testigos", ok: data.critical.roadTestAndDashboardOk },
    ];

    const missingCriticalCount = criticalItems.filter((i) => !i.ok).length;
    const canApprove = missingCriticalCount === 0 && Boolean(data.inspector?.trim());

    const renderCommitmentStatement = () => {
        const tech = data.technician?.trim();
        const asst = data.assistantTechnician?.trim();
        const hasAssistant = asst && asst !== "Sin Auxiliar (Solo)" && asst !== "Sin Auxiliar" && asst !== "Solo";
        const insp = data.inspector?.trim();

        const roleForInsp = (name?: string) => (name?.toLowerCase() === "alejandra" ? "Inspectora de Salida" : "Inspector de Salida");

        if (tech && insp && tech.toLowerCase() === insp.toLowerCase() && !hasAssistant) {
            return (
                <span>
                    <strong>Compromiso de entrega:</strong> Yo, <strong className="text-slate-900">{insp}</strong> (Técnico e Inspector), certifico haber realizado y verificado personalmente el torque de las 4 ruedas y puntos de seguridad de esta unidad, asumiendo la responsabilidad directa por la protección y tranquilidad de las personas a bordo.
                </span>
            );
        }

        if (tech && hasAssistant && insp) {
            return (
                <span>
                    <strong>Compromiso de entrega:</strong> Nosotros, <strong className="text-slate-900">{tech}</strong> (Técnico Mecánico), <strong className="text-slate-900">{asst}</strong> (Auxiliar Técnico) y <strong className="text-slate-900">{insp}</strong> ({roleForInsp(insp)}), certificamos haber realizado y verificado físicamente el torque de 4 ruedas y puntos de seguridad de esta unidad, garantizando la protección y tranquilidad de las personas a bordo.
                </span>
            );
        }

        if (tech && insp) {
            return (
                <span>
                    <strong>Compromiso de entrega:</strong> Nosotros, <strong className="text-slate-900">{tech}</strong> (Técnico Mecánico) y <strong className="text-slate-900">{insp}</strong> ({roleForInsp(insp)}), certificamos haber realizado y verificado físicamente el torque de 4 ruedas y puntos de seguridad de esta unidad, garantizando la protección y tranquilidad de las personas a bordo.
                </span>
            );
        }

        if (tech && hasAssistant) {
            return (
                <span>
                    <strong>Compromiso de entrega:</strong> Nosotros, <strong className="text-slate-900">{tech}</strong> (Técnico) y <strong className="text-slate-900">{asst}</strong> (Auxiliar), certificamos haber realizado físicamente el torque de 4 ruedas y la revisión técnica de esta unidad.
                </span>
            );
        }

        if (insp) {
            return (
                <span>
                    <strong>Compromiso de entrega:</strong> Yo, <strong className="text-slate-900">{insp}</strong> ({roleForInsp(insp)}), certifico haber verificado físicamente el torque de 4 ruedas y puntos de seguridad de esta unidad, garantizando la protección y tranquilidad de las personas a bordo.
                </span>
            );
        }

        if (tech) {
            return (
                <span>
                    <strong>Compromiso de entrega:</strong> Yo, <strong className="text-slate-900">{tech}</strong> (Técnico Mecánico), certifico haber realizado el torque de 4 ruedas y la revisión técnica de esta unidad.
                </span>
            );
        }

        return (
            <span>
                <strong>Compromiso de entrega:</strong> El equipo responsable certifica haber verificado físicamente el torque de 4 ruedas y puntos de seguridad de esta unidad, garantizando la protección y tranquilidad de las personas a bordo.
            </span>
        );
    };

    const handleSave = async (approved: boolean) => {
        setIsSaving(true);
        try {
            const finalData: QualityInspectionData = {
                ...data,
                plate: cleanPlate,
                status: approved ? "aprobado" : "pendiente",
                timestamp: new Date().toISOString(),
            };
            await onSave(finalData);
            onClose();
        } catch (e) {
            console.error("Error al guardar inspección de calidad:", e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[75] bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header del Modal */}
                <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-[#f16315] text-white rounded-xl flex-shrink-0 shadow-sm">
                            <ShieldCheck size={18} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-black uppercase tracking-wide truncate">
                                Control de Calidad y Salida
                            </h3>
                            <p className="text-[11px] text-slate-300 truncate">
                                {vehicleName} · Placas: <strong className="text-white font-mono">{cleanPlate}</strong>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Banner de Aviso de Seguridad */}
                <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-start gap-2.5">
                    <ShieldCheck size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
                    <div className="text-[11px] text-amber-900 leading-snug">
                        <span className="font-bold block">Compromiso con la Seguridad</span>
                        Recuerda que somos responsables de la seguridad y de las personas a bordo de este vehículo. Verifica con calma cada punto antes de autorizar la salida.
                    </div>
                </div>

                {/* Contenido / Checklist con scroll */}
                <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">

                    {/* ======================================================== */}
                    {/* BLOQUE 1: SEGURIDAD CRÍTICA                              */}
                    {/* ======================================================== */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                                <AlertTriangle size={13} className="text-amber-600" />
                                1. Puntos Críticos de Seguridad en Ruta
                            </label>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${missingCriticalCount === 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"}`}>
                                {missingCriticalCount === 0 ? "Todo Verificado ✓" : `Faltan ${missingCriticalCount}`}
                            </span>
                        </div>

                        {/* TARJETA ESPECIAL: TORQUE DE BIRLOS EN LAS 4 RUEDAS */}
                        <div className={`p-3.5 rounded-xl border-2 transition-all shadow-xs ${wheelsAllOk ? "bg-emerald-50/70 border-emerald-300" : "bg-white border-red-200 shadow-sm"}`}>
                            <div className="flex items-center justify-between mb-2.5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`p-2 rounded-xl flex-shrink-0 ${wheelsAllOk ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                                        <Disc size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-xs font-black uppercase tracking-tight text-slate-900 block truncate">
                                            Torque de Birlos en las 4 Ruedas
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            Apretados con torquímetro / maneral
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={toggleAllWheels}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${wheelsAllOk ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                >
                                    {wheelsAllOk ? <Check size={12} /> : null}
                                    <span>{wheelsAllOk ? "4 Listas" : "Marcar 4"}</span>
                                </button>
                            </div>

                            {/* Grid 2x2 para cada rueda */}
                            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200/60">
                                <WheelSubToggle
                                    label="Delantera Izquierda"
                                    code="DEL-IZQ"
                                    active={data.critical.wheelsDetail.frontLeft}
                                    onClick={() => toggleWheel("frontLeft")}
                                />
                                <WheelSubToggle
                                    label="Delantera Derecha"
                                    code="DEL-DER"
                                    active={data.critical.wheelsDetail.frontRight}
                                    onClick={() => toggleWheel("frontRight")}
                                />
                                <WheelSubToggle
                                    label="Trasera Izquierda"
                                    code="TRAS-IZQ"
                                    active={data.critical.wheelsDetail.rearLeft}
                                    onClick={() => toggleWheel("rearLeft")}
                                />
                                <WheelSubToggle
                                    label="Trasera Derecha"
                                    code="TRAS-DER"
                                    active={data.critical.wheelsDetail.rearRight}
                                    onClick={() => toggleWheel("rearRight")}
                                />
                            </div>
                        </div>

                        {/* CUADRÍCULA DE OTROS 5 PUNTOS CRÍTICOS (ESTILO FUNCTIONAL INSPECTION) */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <CriticalCardToggle
                                icon={Droplet}
                                title="Aceite / Filtro"
                                subtitle="Nivel y tapón apretado"
                                active={data.critical.oilAndFilterOk}
                                onClick={() => toggleCritical("oilAndFilterOk")}
                            />
                            <CriticalCardToggle
                                icon={Disc}
                                title="Líquido Frenos"
                                subtitle="Nivel y pedal firme"
                                active={data.critical.brakeFluidAndPedalOk}
                                onClick={() => toggleCritical("brakeFluidAndPedalOk")}
                            />
                            <CriticalCardToggle
                                icon={Droplet}
                                title="Anticongelante"
                                subtitle="Tapón hermético"
                                active={data.critical.coolantCapOk}
                                onClick={() => toggleCritical("coolantCapOk")}
                            />
                            <CriticalCardToggle
                                icon={Wind}
                                title="Presión Llantas"
                                subtitle="4 ruedas + refacción"
                                active={data.critical.tirePressureOk}
                                onClick={() => toggleCritical("tirePressureOk")}
                            />
                            <CriticalCardToggle
                                icon={Activity}
                                title="Prueba de Ruta"
                                subtitle="Sin ruidos ni testigos"
                                active={data.critical.roadTestAndDashboardOk}
                                onClick={() => toggleCritical("roadTestAndDashboardOk")}
                                className="col-span-2 sm:col-span-2"
                            />
                        </div>
                    </div>

                    {/* ======================================================== */}
                    {/* BLOQUE 2: CALIDAD, ESTÉTICA E INTERIORES                 */}
                    {/* ======================================================== */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                                <Sparkles size={13} className="text-amber-500" />
                                2. Calidad, Estética y Transparencia
                            </label>
                            <button
                                type="button"
                                onClick={markAllAestheticOk}
                                className="text-[10px] font-bold text-[#f16315] hover:underline"
                            >
                                Marcar todo OK
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            <AestheticRowToggle
                                label="Cero grasa en volante, palanca y asientos"
                                active={data.aesthetic.cleanInteriorNoGrease}
                                onClick={() => toggleAesthetic("cleanInteriorNoGrease")}
                            />
                            <AestheticRowToggle
                                label="Pertenencias de inventario devueltas"
                                active={data.aesthetic.belongingsReturned}
                                onClick={() => toggleAesthetic("belongingsReturned")}
                            />
                            <AestheticRowToggle
                                label="Lavado exterior y aspirado concluido"
                                active={data.aesthetic.washAndVacuumDone}
                                onClick={() => toggleAesthetic("washAndVacuumDone")}
                            />
                            <AestheticRowToggle
                                label="Herramienta, gato y refacción guardados"
                                active={data.aesthetic.toolsAndSpareSecured}
                                onClick={() => toggleAesthetic("toolsAndSpareSecured")}
                            />
                        </div>
                    </div>

                    {/* ======================================================== */}
                    {/* BLOQUE 3: EVIDENCIA FOTOGRÁFICA (TABLERO ENCENDIDO)      */}
                    {/* ======================================================== */}
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                                <Camera size={13} className="text-slate-600" />
                                3. Evidencia: Foto del Tablero Encendido
                            </label>
                            <span className="text-[10px] text-slate-400 font-medium">
                                Certifica KM y testigos
                            </span>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoSelect}
                            className="hidden"
                        />

                        {data.dashboardPhotoUrl ? (
                            <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-3">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-black flex-shrink-0 border border-slate-300">
                                    <img
                                        src={data.dashboardPhotoUrl}
                                        alt="Foto Tablero"
                                        style={{ transform: `rotate(${photoRotation}deg)` }}
                                        className="w-full h-full object-cover transition-transform"
                                    />
                                    {isUploadingPhoto && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <Loader2 size={16} className="text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-800 truncate">
                                        Foto del tablero capturada ✓
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                        Evidencia de kilometraje y tablero limpio
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setPhotoRotation((r) => (r + 90) % 360)}
                                            className="text-[10px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                                        >
                                            <RotateCw size={11} /> Girar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-[10px] font-bold text-[#f16315] hover:underline"
                                        >
                                            Cambiar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setData((p) => ({ ...p, dashboardPhotoUrl: "" }))}
                                            className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-1"
                                        >
                                            <Trash2 size={11} /> Quitar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingPhoto}
                                className="w-full p-3 bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 hover:border-[#f16315] rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {isUploadingPhoto ? (
                                    <>
                                        <Loader2 size={16} className="text-[#f16315] animate-spin" />
                                        <span>Procesando foto...</span>
                                    </>
                                ) : (
                                    <>
                                        <Camera size={16} className="text-[#f16315]" />
                                        <span>Tomar Foto del Tablero Encendido</span>
                                    </>
                                )}
                            </button>
                        )}
                        {photoError && (
                            <p className="text-[10px] text-red-600 font-medium">{photoError}</p>
                        )}
                    </div>

                    {/* ======================================================== */}
                    {/* BLOQUE 4: FIRMA Y RESPONSABILIDAD                        */}
                    {/* ======================================================== */}
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                        <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                            <UserCheck size={13} className="text-slate-600" />
                            4. Responsabilidad y Visto Bueno
                        </label>

                        {/* Técnico Responsable */}
                        <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                Técnico que ejecutó el trabajo:
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {(technicians.length > 0 ? technicians : ["Jesús", "Israel", "Juan Pablo", "Alejandro"]).map((tech) => {
                                    const isSel = data.technician === tech;
                                    return (
                                        <button
                                            key={tech}
                                            type="button"
                                            onClick={() => setData((p) => ({ ...p, technician: tech }))}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${isSel ? "bg-slate-900 text-white shadow-xs" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"}`}
                                        >
                                            {tech}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Auxiliar Técnico */}
                        <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                Auxiliar técnico (apoyo en montaje):
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {DEFAULT_ASSISTANTS.map((asst) => {
                                    const isSel = data.assistantTechnician === asst;
                                    return (
                                        <button
                                            key={asst}
                                            type="button"
                                            onClick={() => setData((p) => ({ ...p, assistantTechnician: asst }))}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                                isSel
                                                    ? asst === "Sin Auxiliar (Solo)"
                                                        ? "bg-purple-600 text-white shadow-xs"
                                                        : "bg-slate-900 text-white shadow-xs"
                                                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                            }`}
                                        >
                                            {asst}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Inspector de Calidad */}
                        <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                Inspector que certifica la salida:
                            </span>
                            <div className="flex flex-wrap gap-1">
                                {DEFAULT_INSPECTORS.map((insp) => {
                                    const isSel = data.inspector === insp;
                                    return (
                                        <button
                                            key={insp}
                                            type="button"
                                            onClick={() => setData((p) => ({ ...p, inspector: insp }))}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${isSel ? "bg-[#f16315] text-white shadow-xs shadow-orange-200" : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"}`}
                                        >
                                            {insp}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Observaciones o excepciones opcionales */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                                Observaciones / Testigos preexistentes (opcional):
                            </label>
                            <input
                                type="text"
                                value={data.notes || ""}
                                onChange={(e) => setData((p) => ({ ...p, notes: e.target.value }))}
                                placeholder="Ej: Se informó al cliente de testigo de catalizador preexistente..."
                                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f16315]"
                            />
                        </div>

                        {/* Declaración de Compromiso */}
                        <div className="p-2.5 bg-slate-100 rounded-xl text-[10px] text-slate-700 border border-slate-200 leading-snug">
                            {renderCommitmentStatement()}
                        </div>
                    </div>
                </div>

                {/* Footer con Botones de Acción */}
                <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2 justify-between">
                    <div className="text-[11px] text-slate-500 w-full sm:w-auto text-center sm:text-left">
                        {canApprove ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1 justify-center sm:justify-start">
                                <CheckCircle2 size={14} /> Listo para autorizar salida
                            </span>
                        ) : (
                            <span className="text-red-500 font-bold flex items-center gap-1 justify-center sm:justify-start">
                                <AlertTriangle size={14} /> Faltan {missingCriticalCount} puntos críticos
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => handleSave(false)}
                            disabled={isSaving}
                            className="flex-1 sm:flex-none px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                        >
                            Guardar Borrador
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSave(true)}
                            disabled={!canApprove || isSaving}
                            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                            {isSaving ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <ShieldCheck size={15} />
                            )}
                            <span>Firmar y Aprobar Salida</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// COMPONENTES AUXILIARES CON DISEÑO INVENTARIO (FUNCTIONAL INSPECTION STYLE)
// ============================================================================

function WheelSubToggle({
    label,
    code,
    active,
    onClick,
}: {
    label: string;
    code: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-left select-none ${
                active
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs"
                    : "bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
        >
            <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-tighter block leading-tight">
                    {code}
                </span>
                <span className="text-[9px] text-slate-400 block truncate">{label}</span>
            </div>
            {active ? (
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            ) : (
                <CircleDashed size={16} className="text-slate-300 flex-shrink-0" />
            )}
        </div>
    );
}

function CriticalCardToggle({
    icon: Icon,
    title,
    subtitle,
    active,
    onClick,
    className = "",
}: {
    icon: any;
    title: string;
    subtitle: string;
    active: boolean;
    onClick: () => void;
    className?: string;
}) {
    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between text-left min-h-[76px] select-none ${
                active
                    ? "bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 shadow-2xs"
            } ${className}`}
        >
            <div className="flex items-center justify-between">
                <div
                    className={`p-1.5 rounded-lg ${
                        active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                    }`}
                >
                    <Icon size={14} />
                </div>
                {active ? (
                    <span className="text-emerald-600 text-[9px] font-black uppercase flex items-center gap-0.5">
                        <Check size={11} /> OK
                    </span>
                ) : (
                    <span className="text-slate-400 text-[9px] font-bold uppercase">
                        Pendiente
                    </span>
                )}
            </div>
            <div className="mt-1 min-w-0">
                <span className="text-xs font-black tracking-tight block truncate text-slate-900">
                    {title}
                </span>
                <span className="text-[9px] text-slate-400 block truncate font-medium">
                    {subtitle}
                </span>
            </div>
        </motion.div>
    );
}

function AestheticRowToggle({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={`px-3 py-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-left gap-2 select-none ${
                active
                    ? "bg-emerald-50/70 border-emerald-200 text-slate-800"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
        >
            <span className="text-xs font-medium leading-tight">{label}</span>
            {active ? (
                <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
            ) : (
                <CircleDashed size={15} className="text-slate-300 flex-shrink-0" />
            )}
        </div>
    );
}
