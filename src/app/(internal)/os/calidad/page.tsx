"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck,
    ShieldAlert,
    AlertTriangle,
    CheckCircle2,
    CircleDashed,
    Camera,
    Loader2,
    RotateCw,
    Trash2,
    UserCheck,
    Sparkles,
    Check,
    Disc,
    Droplet,
    Activity,
    Wind,
    Car,
    ArrowLeft,
    ArrowRight,
    Wrench,
    FileText,
    ExternalLink,
    RefreshCw
} from "lucide-react";
import {
    QualityInspectionData,
    createDefaultQualityInspection,
    isQualityInspectionApproved
} from "@/types/quality-inspection";
import { compressImage, blobToBase64 } from "@/lib/image-utils";

const DEFAULT_TECHNICIANS = [
    "Jesús",
    "Alejandro",
    "Israel",
    "Juan Pablo",
    "Rubén",
    "Josué"
];

const DEFAULT_ASSISTANTS = [
    "Sin Auxiliar (Solo)",
    "Josué",
    "Juan Pablo",
    "Rubén",
    "Israel"
];

const DEFAULT_INSPECTORS = [
    "Alejandra",
    "Alejandro",
    "Daniel"
];

const STEPS = [
    { id: 1, title: "Seguridad y Ruedas", shortTitle: "1. Birlos y Niveles", icon: Disc },
    { id: 2, title: "Tablero y Estética", shortTitle: "2. Tablero / Limpieza", icon: Camera },
    { id: 3, title: "Firmas y Salida", shortTitle: "3. Responsabilidad", icon: UserCheck },
];

function CalidadWizardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const plateParam = searchParams.get("plate") || searchParams.get("placas") || "";
    const fromParam = searchParams.get("from") || "piso";

    const cleanPlate = plateParam.toUpperCase().replace(/[^A-Z0-9]/g, "");

    const [currentStep, setCurrentStep] = useState(1);
    const [direction, setDirection] = useState(0);

    // Vehicle header info
    const [vehicleInfo, setVehicleInfo] = useState<{
        brand?: string;
        model?: string;
        year?: string;
        clientName?: string;
        mechanic?: string;
    } | null>(null);
    const [loadingVehicle, setLoadingVehicle] = useState(true);

    // Inspection Data State
    const [data, setData] = useState<QualityInspectionData>(() =>
        createDefaultQualityInspection(cleanPlate)
    );

    // Custom name inputs
    const [customTech, setCustomTech] = useState("");
    const [showCustomTech, setShowCustomTech] = useState(false);
    const [customAssistant, setCustomAssistant] = useState("");
    const [showCustomAssistant, setShowCustomAssistant] = useState(false);
    const [customInspector, setCustomInspector] = useState("");
    const [showCustomInspector, setShowCustomInspector] = useState(false);

    // Photo states
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [photoRotation, setPhotoRotation] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Submission states
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Cargar información del vehículo y borrador guardado en localStorage
    useEffect(() => {
        if (!cleanPlate) {
            setLoadingVehicle(false);
            return;
        }

        // Cargar borrador de localStorage
        try {
            const draftKey = `carmd:qa:draft:${cleanPlate}`;
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                const parsed = JSON.parse(savedDraft);
                setData(parsed);
            }
        } catch (e) {
            console.error("Error al cargar borrador de inspección:", e);
        }

        // Obtener datos del vehículo desde la API
        fetch("/api/os/recent-vehicles")
            .then((r) => r.json())
            .then((res) => {
                if (res.vehicles && Array.isArray(res.vehicles)) {
                    const match = res.vehicles.find((v: any) => {
                        const p = (v.vehicle?.plates || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
                        return p === cleanPlate;
                    });
                    if (match) {
                        setVehicleInfo({
                            brand: match.vehicle?.brand,
                            model: match.vehicle?.model,
                            year: match.vehicle?.year,
                            clientName: match.client?.name,
                            mechanic: match.floorData?.mechanic,
                        });

                        // Si el vehículo ya tiene una inspección previa guardada en el servidor y no hay borrador local reciente
                        const serverQa = match.floorData?.qualityInspection;
                        if (serverQa && serverQa.timestamp) {
                            setData((prev) => {
                                // Si no hay datos marcados en el borrador, tomar del servidor
                                const hasDraftData = prev.critical.wheelsTorqued || Boolean(prev.dashboardPhotoUrl);
                                return hasDraftData ? prev : serverQa;
                            });
                        } else if (match.floorData?.mechanic) {
                            // Pre-seleccionar mecánico asignado si viene de piso
                            const mechs = match.floorData.mechanic.split(",").map((s: string) => s.trim());
                            if (mechs.length > 0) {
                                setData((prev) => ({
                                    ...prev,
                                    technician: prev.technician || mechs[0],
                                }));
                            }
                        }
                    }
                }
            })
            .catch((e) => console.error("Error al buscar auto para calidad:", e))
            .finally(() => setLoadingVehicle(false));
    }, [cleanPlate]);

    // Autoguardado en localStorage cada vez que cambia data
    useEffect(() => {
        if (cleanPlate && !isSuccess) {
            try {
                const draftKey = `carmd:qa:draft:${cleanPlate}`;
                localStorage.setItem(draftKey, JSON.stringify(data));
            } catch (e) {
                console.warn("No se pudo guardar borrador en localStorage", e);
            }
        }
    }, [data, cleanPlate, isSuccess]);

    // Sub-toggles de ruedas
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
                    wheelsTorqued: allWheelsOk,
                    wheelsDetail: nextDetail,
                },
            };
        });
    };

    const toggleAllWheels = () => {
        const areAllOk =
            data.critical.wheelsDetail.frontLeft &&
            data.critical.wheelsDetail.frontRight &&
            data.critical.wheelsDetail.rearLeft &&
            data.critical.wheelsDetail.rearRight;

        const nextVal = !areAllOk;
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

    // Toggle críticos generales
    const toggleCritical = (key: keyof QualityInspectionData["critical"]) => {
        if (key === "wheelsDetail" || key === "wheelsTorqued") return;
        setData((prev) => ({
            ...prev,
            critical: {
                ...prev.critical,
                [key]: !prev.critical[key],
            },
        }));
    };

    // Estética toggles
    const toggleAesthetic = (key: keyof QualityInspectionData["aesthetic"]) => {
        setData((prev) => ({
            ...prev,
            aesthetic: {
                ...prev.aesthetic,
                [key]: !prev.aesthetic[key],
            },
        }));
    };

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

    // Subir foto del tablero
    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingPhoto(true);
        setPhotoError(null);

        try {
            const { blob, actualFormat } = await compressImage(file, {
                maxWidth: 1200,
                maxHeight: 1200,
                quality: 0.75,
                format: "image/webp",
            });

            const base64 = await blobToBase64(blob);
            const ext = actualFormat === "image/webp" ? "webp" : "jpg";
            const filename = `${Date.now()}_tablero_${cleanPlate}.${ext}`;

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
                throw new Error(errData.error || `Error HTTP ${res.status}`);
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

    // Validaciones
    const wheelsAllOk =
        data.critical.wheelsDetail.frontLeft &&
        data.critical.wheelsDetail.frontRight &&
        data.critical.wheelsDetail.rearLeft &&
        data.critical.wheelsDetail.rearRight;

    const criticalItems = [
        { label: "Torque en las 4 ruedas", ok: wheelsAllOk },
        { label: "Nivel de aceite y tapón hermético", ok: data.critical.oilAndFilterOk },
        { label: "Líquido de frenos y pedal firme", ok: data.critical.brakeFluidAndPedalOk },
        { label: "Anticongelante y tapón hermético", ok: data.critical.coolantCapOk },
        { label: "Presión de 4 llantas + refacción", ok: data.critical.tirePressureOk },
        { label: "Prueba de ruta sin ruidos ni testigos", ok: data.critical.roadTestAndDashboardOk },
    ];

    const missingCriticalCount = criticalItems.filter((i) => !i.ok).length;
    const canPassStep1 = missingCriticalCount === 0;

    const canApprove =
        missingCriticalCount === 0 &&
        Boolean(data.inspector?.trim()) &&
        Boolean(data.technician?.trim());

    // Navegación de pasos
    const goToStep = (newStep: number) => {
        if (newStep === 2 && !canPassStep1) {
            setErrorMessage("Es obligatorio verificar las 4 ruedas y todos los puntos de seguridad crítica para avanzar.");
            return;
        }
        setErrorMessage(null);
        setDirection(newStep > currentStep ? 1 : -1);
        setCurrentStep(newStep);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Guardar borrador o Aprobar Salida
    const handleSubmit = async (approve: boolean) => {
        if (approve && !canApprove) {
            setErrorMessage("Debes verificar todos los puntos críticos y seleccionar al técnico e inspector antes de aprobar la salida.");
            return;
        }

        setIsSaving(true);
        setErrorMessage(null);

        try {
            const finalData: QualityInspectionData = {
                ...data,
                plate: cleanPlate,
                status: approve ? "aprobado" : "pendiente",
                timestamp: new Date().toISOString(),
            };

            const payload: any = {
                plate: cleanPlate,
                qualityInspection: finalData,
            };

            // Si se aprueba, se avanza automáticamente a Etapa 7 (LISTO_ENTREGA)
            if (approve) {
                payload.status = "LISTO_ENTREGA";
                if (data.technician) {
                    payload.mechanic = data.technician;
                }
            }

            const res = await fetch("/api/os/recent-vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Error HTTP ${res.status}`);
            }

            // Limpiar borrador de localStorage
            try {
                localStorage.removeItem(`carmd:qa:draft:${cleanPlate}`);
            } catch (e) {}

            setIsSuccess(true);
        } catch (e: any) {
            console.error("Error al guardar inspección de calidad:", e);
            setErrorMessage(e.message || "Error al guardar inspección en servidor");
        } finally {
            setIsSaving(false);
        }
    };

    const backUrl = fromParam === "control" ? "/os/centrodecontrol" : "/os/piso";

    // Si no se proporcionó placa en URL
    if (!cleanPlate) {
        return (
            <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-xl border border-slate-200 text-center space-y-4">
                    <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
                        <AlertTriangle size={24} />
                    </div>
                    <h2 className="text-base font-black text-slate-900 uppercase">
                        Placa No Especificada
                    </h2>
                    <p className="text-xs text-slate-600">
                        Para realizar una inspección de calidad debes ingresar desde la Ficha del auto en el Control de Piso o Centro de Control.
                    </p>
                    <Link
                        href="/os/piso"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#f16315] text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                        <ArrowLeft size={14} />
                        <span>Ir a Control de Piso</span>
                    </Link>
                </div>
            </div>
        );
    }

    // Pantalla de Éxito
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-200 text-center space-y-5"
                >
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle2 size={42} />
                    </div>

                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                            Inspección Aprobada ✓
                        </span>
                        <h2 className="text-xl font-black text-slate-900 mt-2">
                            ¡Vehículo Listo para Entrega!
                        </h2>
                        <p className="text-xs text-slate-600 mt-1">
                            Placas <strong className="font-mono text-slate-900">{cleanPlate}</strong> · Certificado por{" "}
                            <strong className="text-slate-900">{data.inspector}</strong>
                        </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5 text-slate-700">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Torque de 4 ruedas:</span>
                            <span className="font-bold text-emerald-700">Verificado ✓</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Técnico Responsable:</span>
                            <span className="font-bold">{data.technician || "No asignado"}</span>
                        </div>
                        {data.assistantTechnician && (
                            <div className="flex justify-between">
                                <span className="text-slate-400">Auxiliar Técnico:</span>
                                <span className="font-bold">{data.assistantTechnician}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-slate-400">Estatus del Car Tracker:</span>
                            <span className="font-bold text-emerald-600">🏁 Etapa 7: Listo p/ Entrega</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        <Link
                            href={backUrl}
                            className="w-full py-3 bg-[#f16315] hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            <span>Volver al Control de Piso</span>
                        </Link>
                        <Link
                            href="/os/centrodecontrol"
                            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                        >
                            Ir al Centro de Control
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100/70 pb-28">
            {/* Header Sticky con Placa e Identidad */}
            <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Link
                            href={backUrl}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex-shrink-0"
                            title="Volver"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-sm font-black uppercase tracking-wider truncate">
                                    Control de Calidad
                                </h1>
                                <span className="font-mono text-xs font-black bg-white/20 px-2 py-0.5 rounded text-white tracking-widest flex-shrink-0">
                                    {cleanPlate}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                                {vehicleInfo ? `${vehicleInfo.brand || ""} ${vehicleInfo.model || ""} ${vehicleInfo.year || ""}` : "Filtro de Seguridad"}
                                {vehicleInfo?.clientName ? ` · ${vehicleInfo.clientName}` : ""}
                            </p>
                        </div>
                    </div>

                    <Link
                        href={backUrl}
                        className="text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1 flex-shrink-0 px-2.5 py-1 rounded-lg bg-slate-800"
                    >
                        <span>Cerrar</span>
                    </Link>
                </div>

                {/* Stepper de 3 Pasos */}
                <div className="bg-slate-800/90 border-t border-slate-700/80 px-4 py-2">
                    <div className="max-w-2xl mx-auto grid grid-cols-3 gap-1.5">
                        {STEPS.map((step) => {
                            const isCurrent = currentStep === step.id;
                            const isPast = currentStep > step.id;
                            const IconComponent = step.icon;

                            return (
                                <button
                                    key={step.id}
                                    type="button"
                                    onClick={() => goToStep(step.id)}
                                    className={`py-1.5 px-2 rounded-xl text-left transition-all flex items-center gap-2 ${
                                        isCurrent
                                            ? "bg-[#f16315] text-white shadow-sm font-black"
                                            : isPast
                                            ? "bg-slate-700/80 text-emerald-300 font-bold hover:bg-slate-700"
                                            : "bg-slate-800 text-slate-400 hover:bg-slate-700/50"
                                    }`}
                                >
                                    <div
                                        className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                                            isCurrent
                                                ? "bg-white/20 text-white"
                                                : isPast
                                                ? "bg-emerald-500/20 text-emerald-300"
                                                : "bg-slate-700 text-slate-400"
                                        }`}
                                    >
                                        {isPast ? <Check size={11} /> : step.id}
                                    </div>
                                    <span className="text-[11px] truncate hidden sm:inline">
                                        {step.title}
                                    </span>
                                    <span className="text-[10px] truncate sm:hidden">
                                        {step.shortTitle}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Mensajes de Alerta / Error */}
            {errorMessage && (
                <div className="max-w-2xl mx-auto px-4 mt-3">
                    <div className="p-3 bg-red-50 border-2 border-red-300 rounded-2xl flex items-start gap-2.5 text-xs text-red-900 shadow-sm animate-in fade-in duration-150">
                        <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <span className="font-black block">Atención requerida</span>
                            <span className="text-[11px] leading-snug">{errorMessage}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setErrorMessage(null)}
                            className="text-red-700 font-bold text-xs"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Contenedor Principal del Wizard */}
            <main className="max-w-2xl mx-auto px-3 sm:px-4 mt-3">
                <AnimatePresence mode="wait" initial={false}>
                    {/* ========================================================== */}
                    {/* PASO 1: SEGURIDAD CRÍTICA Y 4 RUEDAS                      */}
                    {/* ========================================================== */}
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: direction * 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -direction * 20 }}
                            transition={{ duration: 0.15 }}
                            className="space-y-3.5"
                        >
                            {/* Banner de Compromiso de Seguridad */}
                            <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 flex items-start gap-3 shadow-2xs">
                                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl flex-shrink-0 mt-0.5">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-amber-950 uppercase tracking-tight">
                                        Compromiso con la Seguridad
                                    </h3>
                                    <p className="text-[11px] text-amber-900 leading-relaxed mt-0.5 font-medium">
                                        Recuerda que somos responsables de la seguridad y de las personas a bordo de este vehículo. Verifica con calma cada punto antes de autorizar la salida.
                                    </p>
                                </div>
                            </div>

                            {/* TARJETA MAESTRA: TORQUE DE BIRLOS EN LAS 4 RUEDAS */}
                            <div className={`bg-white rounded-2xl p-4 border-2 transition-all shadow-sm ${
                                wheelsAllOk ? "border-emerald-300 bg-emerald-50/20" : "border-red-200"
                            }`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-2.5 rounded-xl ${
                                            wheelsAllOk ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                                        }`}>
                                            <Disc size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-tight text-slate-900">
                                                Torque de Birlos en las 4 Ruedas
                                            </h4>
                                            <p className="text-[11px] text-slate-500">
                                                Apretadas con torquímetro al libraje de fabricante
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={toggleAllWheels}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                                            wheelsAllOk
                                                ? "bg-emerald-600 text-white shadow-sm"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                                        }`}
                                    >
                                        {wheelsAllOk && <Check size={13} />}
                                        <span>{wheelsAllOk ? "4 Listas" : "Marcar 4"}</span>
                                    </button>
                                </div>

                                {/* Layout táctil del vehículo para las 4 ruedas */}
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                                    <WheelCard
                                        label="Delantera Izquierda"
                                        sublabel="Frente lado chofer"
                                        code="DEL-IZQ"
                                        active={data.critical.wheelsDetail.frontLeft}
                                        onClick={() => toggleWheel("frontLeft")}
                                    />
                                    <WheelCard
                                        label="Delantera Derecha"
                                        sublabel="Frente lado copiloto"
                                        code="DEL-DER"
                                        active={data.critical.wheelsDetail.frontRight}
                                        onClick={() => toggleWheel("frontRight")}
                                    />
                                    <WheelCard
                                        label="Trasera Izquierda"
                                        sublabel="Atrás lado chofer"
                                        code="TRAS-IZQ"
                                        active={data.critical.wheelsDetail.rearLeft}
                                        onClick={() => toggleWheel("rearLeft")}
                                    />
                                    <WheelCard
                                        label="Trasera Derecha"
                                        sublabel="Atrás lado copiloto"
                                        code="TRAS-DER"
                                        active={data.critical.wheelsDetail.rearRight}
                                        onClick={() => toggleWheel("rearRight")}
                                    />
                                </div>
                            </div>

                            {/* 5 PUNTOS CRÍTICOS MECÁNICOS ADICIONALES */}
                            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                                        <Wrench size={13} className="text-[#f16315]" />
                                        Niveles bajo cofre y Prueba de Ruta
                                    </label>
                                    <span className="text-[10px] font-bold text-slate-400">
                                        Toca para confirmar
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <CriticalCheckCard
                                        icon={Droplet}
                                        title="Aceite de Motor y Filtro"
                                        subtitle="Nivel en varilla y tapón superior apretado"
                                        active={data.critical.oilAndFilterOk}
                                        onClick={() => toggleCritical("oilAndFilterOk")}
                                    />
                                    <CriticalCheckCard
                                        icon={Disc}
                                        title="Líquido de Frenos y Pedal"
                                        subtitle="Nivel correcto y pedal firme sin hundimiento"
                                        active={data.critical.brakeFluidAndPedalOk}
                                        onClick={() => toggleCritical("brakeFluidAndPedalOk")}
                                    />
                                    <CriticalCheckCard
                                        icon={Droplet}
                                        title="Anticongelante y Tapón"
                                        subtitle="Nivel en depósito y tapón hermético cerrado"
                                        active={data.critical.coolantCapOk}
                                        onClick={() => toggleCritical("coolantCapOk")}
                                    />
                                    <CriticalCheckCard
                                        icon={Wind}
                                        title="Presión de Llantas"
                                        subtitle="4 ruedas calibradas + llanta de refacción"
                                        active={data.critical.tirePressureOk}
                                        onClick={() => toggleCritical("tirePressureOk")}
                                    />
                                    <CriticalCheckCard
                                        icon={Activity}
                                        title="Prueba de Ruta y Testigos"
                                        subtitle="Sin ruidos en marcha ni testigos prendidos en tablero"
                                        active={data.critical.roadTestAndDashboardOk}
                                        onClick={() => toggleCritical("roadTestAndDashboardOk")}
                                        className="sm:col-span-2"
                                    />
                                </div>
                            </div>

                            {/* Resumen de validación del Paso 1 */}
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                                <div className="text-xs">
                                    {missingCriticalCount === 0 ? (
                                        <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                                            <CheckCircle2 size={16} /> Todos los puntos críticos verificados ✓
                                        </span>
                                    ) : (
                                        <span className="font-bold text-amber-800 flex items-center gap-1.5">
                                            <AlertTriangle size={16} className="text-amber-600" />
                                            Faltan {missingCriticalCount} puntos de seguridad
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => goToStep(2)}
                                    disabled={!canPassStep1}
                                    className="px-4 py-2 bg-[#f16315] hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                    <span>Paso 2: Tablero</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ========================================================== */}
                    {/* PASO 2: FOTO DEL TABLERO Y ESTÉTICA                       */}
                    {/* ========================================================== */}
                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: direction * 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -direction * 20 }}
                            transition={{ duration: 0.15 }}
                            className="space-y-3.5"
                        >
                            {/* EVIDENCIA FOTOGRÁFICA DEL TABLERO */}
                            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-tight text-slate-900 flex items-center gap-1.5">
                                            <Camera size={14} className="text-[#f16315]" />
                                            Foto del Tablero Encendido
                                        </h3>
                                        <p className="text-[11px] text-slate-500">
                                            Evidencia irrefutable de kilometraje y tablero sin testigos
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        Recomendado
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
                                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-slate-300">
                                            <img
                                                src={data.dashboardPhotoUrl}
                                                alt="Foto Tablero"
                                                style={{ transform: `rotate(${photoRotation}deg)` }}
                                                className="w-full h-full object-cover transition-transform"
                                            />
                                            {isUploadingPhoto && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                    <Loader2 size={18} className="text-white animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                                <CheckCircle2 size={13} className="text-emerald-600" />
                                                Foto del tablero cargada con éxito
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                                Guardada en expediente del vehículo
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setPhotoRotation((r) => (r + 90) % 360)}
                                                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 shadow-2xs"
                                                >
                                                    <RotateCw size={11} /> Girar 90°
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-[#f16315] hover:bg-slate-50 shadow-2xs"
                                                >
                                                    Cambiar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setData((p) => ({ ...p, dashboardPhotoUrl: "" }))}
                                                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-red-600 hover:bg-red-50 shadow-2xs flex items-center gap-1"
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
                                        className="w-full py-6 bg-slate-50 hover:bg-orange-50/50 border-2 border-dashed border-slate-300 hover:border-[#f16315] rounded-2xl text-xs font-bold text-slate-700 transition-all flex flex-col items-center justify-center gap-2 group"
                                    >
                                        {isUploadingPhoto ? (
                                            <>
                                                <Loader2 size={24} className="text-[#f16315] animate-spin" />
                                                <span className="text-xs font-bold text-slate-800">
                                                    Subiendo y optimizando foto...
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-3 bg-white rounded-full shadow-sm border border-slate-200 group-hover:scale-105 transition-transform text-[#f16315]">
                                                    <Camera size={22} />
                                                </div>
                                                <span className="text-xs font-black uppercase text-slate-800">
                                                    Tomar Foto con Celular (Tablero Encendido)
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-normal">
                                                    Toca aquí para abrir la cámara de tu teléfono
                                                </span>
                                            </>
                                        )}
                                    </button>
                                )}

                                {photoError && (
                                    <p className="text-[11px] text-red-600 font-bold">{photoError}</p>
                                )}
                            </div>

                            {/* REVISIÓN DE LIMPIEZA Y CORTESÍA (ESTÉTICA) */}
                            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-tight text-slate-900 flex items-center gap-1.5">
                                            <Sparkles size={14} className="text-amber-500" />
                                            Limpieza, Interiores y Entrega Impecable
                                        </h3>
                                        <p className="text-[11px] text-slate-500">
                                            Garantiza la satisfacción visual del cliente al recibir su auto
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={markAllAestheticOk}
                                        className="text-[11px] font-black text-[#f16315] hover:underline"
                                    >
                                        Marcar Todo OK
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <AestheticCheckCard
                                        label="Cero grasa en volante, palanca y tapicería"
                                        sub="Asientos y plásticos limpios"
                                        active={data.aesthetic.cleanInteriorNoGrease}
                                        onClick={() => toggleAesthetic("cleanInteriorNoGrease")}
                                    />
                                    <AestheticCheckCard
                                        label="Pertenencias de inventario devueltas"
                                        sub="Objetos en cajuela y guantera en su lugar"
                                        active={data.aesthetic.belongingsReturned}
                                        onClick={() => toggleAesthetic("belongingsReturned")}
                                    />
                                    <AestheticCheckCard
                                        label="Lavado exterior y aspirado concluido"
                                        sub="Carrocería limpia y cristales secos"
                                        active={data.aesthetic.washAndVacuumDone}
                                        onClick={() => toggleAesthetic("washAndVacuumDone")}
                                    />
                                    <AestheticCheckCard
                                        label="Herramienta, gato y birlo de seguridad"
                                        sub="Kit completo guardado en cajuela"
                                        active={data.aesthetic.toolsAndSpareSecured}
                                        onClick={() => toggleAesthetic("toolsAndSpareSecured")}
                                    />
                                </div>
                            </div>

                            {/* Navegación Paso 2 */}
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => goToStep(1)}
                                    className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                >
                                    <ArrowLeft size={14} />
                                    <span>Paso 1</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => goToStep(3)}
                                    className="px-4 py-2 bg-[#f16315] hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                                >
                                    <span>Paso 3: Firmas</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ========================================================== */}
                    {/* PASO 3: FIRMAS Y RESPONSABILIDAD                          */}
                    {/* ========================================================== */}
                    {currentStep === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: direction * 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -direction * 20 }}
                            transition={{ duration: 0.15 }}
                            className="space-y-3.5"
                        >
                            {/* TARJETA DE RESPONSABLES: 3 NIVELES DE AUDITORÍA */}
                            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-tight text-slate-900 flex items-center gap-1.5">
                                        <UserCheck size={15} className="text-[#f16315]" />
                                        Asignación de Responsabilidades y Firmas
                                    </h3>
                                    <p className="text-[11px] text-slate-500">
                                        Queda sellado con fecha, hora y nombres para el expediente de garantía
                                    </p>
                                </div>

                                {/* 1. Técnico Responsable Principal */}
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider block mb-1.5">
                                        1. Técnico Responsable (Quien ejecutó la reparación):
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {DEFAULT_TECHNICIANS.map((tech) => {
                                            const isSel = data.technician === tech;
                                            return (
                                                <button
                                                    key={tech}
                                                    type="button"
                                                    onClick={() => setData((p) => ({ ...p, technician: tech }))}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                                        isSel
                                                            ? "bg-slate-900 text-white shadow-sm"
                                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                    }`}
                                                >
                                                    {isSel && <Check size={12} />}
                                                    <span>{tech}</span>
                                                </button>
                                            );
                                        })}
                                        {!showCustomTech ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowCustomTech(true)}
                                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-500 border border-dashed border-slate-300 hover:bg-slate-50"
                                            >
                                                + Otro
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    placeholder="Nombre..."
                                                    value={customTech}
                                                    onChange={(e) => setCustomTech(e.target.value)}
                                                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg w-28"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (customTech.trim()) {
                                                            setData((p) => ({ ...p, technician: customTech.trim() }));
                                                            setShowCustomTech(false);
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold"
                                                >
                                                    OK
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Auxiliar Técnico */}
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider block mb-1.5">
                                        2. Auxiliar Técnico (Apoyo en montaje de ruedas o fluidos):
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {DEFAULT_ASSISTANTS.map((asst) => {
                                            const isSel = data.assistantTechnician === asst;
                                            return (
                                                <button
                                                    key={asst}
                                                    type="button"
                                                    onClick={() => setData((p) => ({ ...p, assistantTechnician: asst }))}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                                        isSel
                                                            ? "bg-indigo-600 text-white shadow-sm"
                                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                    }`}
                                                >
                                                    {isSel && <Check size={12} />}
                                                    <span>{asst}</span>
                                                </button>
                                            );
                                        })}
                                        {!showCustomAssistant ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowCustomAssistant(true)}
                                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-500 border border-dashed border-slate-300 hover:bg-slate-50"
                                            >
                                                + Otro
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    placeholder="Nombre..."
                                                    value={customAssistant}
                                                    onChange={(e) => setCustomAssistant(e.target.value)}
                                                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg w-28"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (customAssistant.trim()) {
                                                            setData((p) => ({ ...p, assistantTechnician: customAssistant.trim() }));
                                                            setShowCustomAssistant(false);
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                                                >
                                                    OK
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 3. Inspector / Visto Bueno de Salida */}
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider block mb-1.5">
                                        3. Inspector que Certifica Salida (Visto Bueno):
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {DEFAULT_INSPECTORS.map((insp) => {
                                            const isSel = data.inspector === insp;
                                            return (
                                                <button
                                                    key={insp}
                                                    type="button"
                                                    onClick={() => setData((p) => ({ ...p, inspector: insp }))}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                                        isSel
                                                            ? "bg-[#f16315] text-white shadow-sm shadow-orange-300"
                                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                    }`}
                                                >
                                                    {isSel && <Check size={12} />}
                                                    <span>{insp}</span>
                                                </button>
                                            );
                                        })}
                                        {!showCustomInspector ? (
                                            <button
                                                type="button"
                                                onClick={() => setShowCustomInspector(true)}
                                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-500 border border-dashed border-slate-300 hover:bg-slate-50"
                                            >
                                                + Otro
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    placeholder="Nombre..."
                                                    value={customInspector}
                                                    onChange={(e) => setCustomInspector(e.target.value)}
                                                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg w-28"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (customInspector.trim()) {
                                                            setData((p) => ({ ...p, inspector: customInspector.trim() }));
                                                            setShowCustomInspector(false);
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-[#f16315] text-white rounded-lg text-xs font-bold"
                                                >
                                                    OK
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Observaciones / Notas */}
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider block mb-1">
                                        Observaciones / Testigos preexistentes (Opcional):
                                    </label>
                                    <input
                                        type="text"
                                        value={data.notes || ""}
                                        onChange={(e) => setData((p) => ({ ...p, notes: e.target.value }))}
                                        placeholder="Ej: Se informó al cliente de foco de sensor de oxígeno preexistente..."
                                        className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f16315]"
                                    />
                                </div>

                                {/* Declaración de Compromiso */}
                                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-[11px] text-slate-700 leading-snug">
                                    <strong>Compromiso de entrega:</strong> Yo, <strong className="text-slate-900">{data.inspector || "Inspector"}</strong>, certifico haber realizado físicamente la revisión de torque de ruedas y seguridad para garantizar la protección y tranquilidad de las personas a bordo.
                                </div>
                            </div>

                            {/* Botones Finales de Guardado y Liberación */}
                            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2.5">
                                <button
                                    type="button"
                                    onClick={() => handleSubmit(true)}
                                    disabled={!canApprove || isSaving}
                                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <ShieldCheck size={18} />
                                    )}
                                    <span>Firmar y Liberar a Listo para Entrega (Etapa 7)</span>
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => goToStep(2)}
                                        className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                                    >
                                        <ArrowLeft size={14} />
                                        <span>Paso 2</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSubmit(false)}
                                        disabled={isSaving}
                                        className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
                                    >
                                        Guardar Solo como Borrador
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

export default function CalidadPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-100 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-[#f16315]" />
            </div>
        }>
            <CalidadWizardContent />
        </Suspense>
    );
}

// ============================================================================
// COMPONENTES AUXILIARES CON DISEÑO INVENTARIO
// ============================================================================

function WheelCard({
    label,
    sublabel,
    code,
    active,
    onClick,
}: {
    label: string;
    sublabel: string;
    code: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between select-none ${
                active
                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 shadow-2xs"
                    : "bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
        >
            <div className="min-w-0">
                <span className="text-xs font-black uppercase tracking-tight block leading-tight">
                    {code}
                </span>
                <span className="text-[11px] font-bold block truncate text-slate-800">
                    {label}
                </span>
                <span className="text-[9px] text-slate-400 block truncate">
                    {sublabel}
                </span>
            </div>
            {active ? (
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                    <CheckCircle2 size={20} />
                </div>
            ) : (
                <CircleDashed size={20} className="text-slate-300 flex-shrink-0" />
            )}
        </div>
    );
}

function CriticalCheckCard({
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
        <div
            onClick={onClick}
            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between gap-2.5 select-none ${
                active
                    ? "bg-emerald-50/70 border-emerald-400 text-emerald-950 shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            } ${className}`}
        >
            <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-2 rounded-xl flex-shrink-0 ${
                    active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}>
                    <Icon size={16} />
                </div>
                <div className="min-w-0">
                    <span className="text-xs font-black block text-slate-900 leading-tight">
                        {title}
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        {subtitle}
                    </span>
                </div>
            </div>

            {active ? (
                <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
            ) : (
                <CircleDashed size={18} className="text-slate-300 flex-shrink-0" />
            )}
        </div>
    );
}

function AestheticCheckCard({
    label,
    sub,
    active,
    onClick,
}: {
    label: string;
    sub: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 select-none ${
                active
                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-950"
                    : "bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
        >
            <div className="min-w-0">
                <span className="text-xs font-bold block text-slate-900 leading-tight">
                    {label}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                    {sub}
                </span>
            </div>
            {active ? (
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            ) : (
                <CircleDashed size={16} className="text-slate-300 flex-shrink-0" />
            )}
        </div>
    );
}
