"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck,
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
    ArrowLeft,
    ArrowRight,
    Wrench,
    FileText,
    Car,
    X
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
    { id: 1, title: "1. Ruedas", icon: Disc },
    { id: 2, title: "2. Tablero", icon: Camera },
    { id: 3, title: "3. Firmas", icon: UserCheck },
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
                                const hasDraftData = prev.critical.wheelsTorqued || Boolean(prev.dashboardPhotoUrl);
                                return hasDraftData ? prev : serverQa;
                            });
                        } else if (match.floorData?.mechanic) {
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
        { label: "Nivel de aceite y tapón", ok: data.critical.oilAndFilterOk },
        { label: "Líquido de frenos y pedal", ok: data.critical.brakeFluidAndPedalOk },
        { label: "Anticongelante y tapón", ok: data.critical.coolantCapOk },
        { label: "Presión de llantas", ok: data.critical.tirePressureOk },
        { label: "Prueba de ruta", ok: data.critical.roadTestAndDashboardOk },
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
            setErrorMessage("Verifica las 4 ruedas y puntos de seguridad para continuar.");
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
            setErrorMessage("Debes verificar todos los puntos críticos y seleccionar al técnico e inspector antes de autorizar.");
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

    const renderCommitmentStatement = () => {
        const tech = data.technician?.trim();
        const asst = data.assistantTechnician?.trim();
        const hasAssistant = asst && asst !== "Sin Auxiliar (Solo)" && asst !== "Sin Auxiliar" && asst !== "Solo";
        const insp = data.inspector?.trim();

        const roleForInsp = (name?: string) => (name?.toLowerCase() === "alejandra" ? "Inspectora de Salida" : "Inspector de Salida");

        // Caso especial: Mismo técnico e inspector, sin auxiliar
        if (tech && insp && tech.toLowerCase() === insp.toLowerCase() && !hasAssistant) {
            return (
                <span>
                    <strong>Compromiso de entrega:</strong> Yo, <strong className="text-slate-900">{insp}</strong> (Técnico e Inspector), certifico haber realizado y verificado personalmente el torque de las 4 ruedas y puntos de seguridad de esta unidad, asumiendo la responsabilidad directa por la protección y tranquilidad de las personas a bordo.
                </span>
            );
        }

        // Caso 3 personas: Técnico + Auxiliar + Inspector
        if (tech && hasAssistant && insp) {
            return (
                <span>
                    <strong>Compromiso de entrega:</strong> Nosotros, <strong className="text-slate-900">{tech}</strong> (Técnico Mecánico), <strong className="text-slate-900">{asst}</strong> (Auxiliar Técnico) y <strong className="text-slate-900">{insp}</strong> ({roleForInsp(insp)}), certificamos haber realizado y verificado físicamente el torque de 4 ruedas y puntos de seguridad de esta unidad, garantizando la protección y tranquilidad de las personas a bordo.
                </span>
            );
        }

        // Caso 2 personas: Técnico + Inspector (Sin auxiliar)
        if (tech && insp) {
            return (
                <span>
                    <strong>Compromiso de entrega:</strong> Nosotros, <strong className="text-slate-900">{tech}</strong> (Técnico Mecánico) y <strong className="text-slate-900">{insp}</strong> ({roleForInsp(insp)}), certificamos haber realizado y verificado físicamente el torque de 4 ruedas y puntos de seguridad de esta unidad, garantizando la protección y tranquilidad de las personas a bordo.
                </span>
            );
        }

        // Caso 2 personas: Técnico + Auxiliar (sin inspector asignado aún)
        if (tech && hasAssistant) {
            return (
                <span>
                    <strong>Compromiso de entrega:</strong> Nosotros, <strong className="text-slate-900">{tech}</strong> (Técnico) y <strong className="text-slate-900">{asst}</strong> (Auxiliar), certificamos haber realizado físicamente el torque de 4 ruedas y la revisión técnica de esta unidad.
                </span>
            );
        }

        // Caso 1 persona: Solo Inspector
        if (insp) {
            return (
                <span>
                    <strong>Compromiso de entrega:</strong> Yo, <strong className="text-slate-900">{insp}</strong> ({roleForInsp(insp)}), certifico haber verificado físicamente el torque de 4 ruedas y puntos de seguridad de esta unidad, garantizando la protección y tranquilidad de las personas a bordo.
                </span>
            );
        }

        // Caso 1 persona: Solo Técnico
        if (tech) {
            return (
                <span>
                    <strong>Compromiso de entrega:</strong> Yo, <strong className="text-slate-900">{tech}</strong> (Técnico Mecánico), certifico haber realizado el torque de 4 ruedas y la revisión técnica de esta unidad.
                </span>
            );
        }

        // Fallback cuando aún no seleccionan a nadie
        return (
            <span>
                <strong>Compromiso de entrega:</strong> El equipo responsable certifica haber verificado físicamente el torque de 4 ruedas y puntos de seguridad de esta unidad, garantizando la protección y tranquilidad de las personas a bordo.
            </span>
        );
    };

    // Si no se proporcionó placa en URL
    if (!cleanPlate) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-xl border border-slate-200 text-center space-y-4">
                    <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
                        <AlertTriangle size={24} />
                    </div>
                    <h2 className="text-sm font-black text-slate-900 uppercase">
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
                    className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-emerald-200 text-center space-y-4"
                >
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle2 size={36} />
                    </div>

                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                            Salida Aprobada ✓
                        </span>
                        <h2 className="text-lg font-black text-slate-900 mt-2">
                            ¡Listo para Entrega!
                        </h2>
                        <p className="text-xs text-slate-600 mt-0.5">
                            Placas <strong className="font-mono text-slate-900">{cleanPlate}</strong> · Certificado por{" "}
                            <strong className="text-slate-900">{data.inspector}</strong>
                        </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5 text-slate-700">
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

                    <div className="flex flex-col gap-2 pt-1">
                        <Link
                            href={backUrl}
                            className="w-full py-3 bg-[#f16315] hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            <span>Volver a Control de Piso</span>
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 w-full overflow-x-hidden">
            {/* Header Luminoso Nativo Móvil */}
            <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs w-full">
                <div className="w-full max-w-lg mx-auto px-3.5 py-2.5 flex items-center justify-between gap-2.5">
                    <Link
                        href={backUrl}
                        className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex-shrink-0"
                        title="Volver"
                    >
                        <ArrowLeft size={18} />
                    </Link>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs font-black bg-orange-50 text-[#f16315] border border-orange-200/80 px-2 py-0.5 rounded-lg tracking-wider">
                                {cleanPlate}
                            </span>
                            <h1 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">
                                Control de Calidad
                            </h1>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            {vehicleInfo ? `${vehicleInfo.brand || ""} ${vehicleInfo.model || ""} ${vehicleInfo.year || ""}` : "Inspección de Salida"}
                            {vehicleInfo?.clientName ? ` · ${vehicleInfo.clientName}` : ""}
                        </p>
                    </div>

                    <Link
                        href={backUrl}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
                        title="Cerrar"
                    >
                        <X size={18} />
                    </Link>
                </div>

                {/* Segmented Control de 3 Pasos (Estilo iOS Nativo) */}
                <div className="w-full max-w-lg mx-auto px-3.5 pb-2.5 pt-0.5">
                    <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 w-full">
                        {STEPS.map((step) => {
                            const isCurrent = currentStep === step.id;
                            const isPast = currentStep > step.id;

                            return (
                                <button
                                    key={step.id}
                                    type="button"
                                    onClick={() => goToStep(step.id)}
                                    className={`flex-1 py-1.5 px-1 rounded-lg text-center transition-all flex items-center justify-center gap-1 text-[11px] min-w-0 select-none ${
                                        isCurrent
                                            ? "bg-white text-slate-900 font-black shadow-xs"
                                            : isPast
                                            ? "text-emerald-700 font-bold hover:bg-white/50"
                                            : "text-slate-500 font-medium hover:bg-white/40"
                                    }`}
                                >
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                                        isCurrent
                                            ? "bg-[#f16315] text-white"
                                            : isPast
                                            ? "bg-emerald-600 text-white"
                                            : "bg-slate-300 text-slate-700"
                                    }`}>
                                        {isPast ? <Check size={9} /> : step.id}
                                    </span>
                                    <span className="truncate">{step.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Mensajes de Alerta / Error */}
            {errorMessage && (
                <div className="w-full max-w-lg mx-auto px-3.5 mt-2.5">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-900 shadow-xs animate-in fade-in duration-150">
                        <AlertTriangle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <span className="flex-1 text-[11px] leading-snug">{errorMessage}</span>
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
            <main className="w-full max-w-lg mx-auto px-3.5 pt-2.5 pb-28">
                <AnimatePresence mode="wait" initial={false}>
                    {/* ========================================================== */}
                    {/* PASO 1: SEGURIDAD CRÍTICA Y 4 RUEDAS                      */}
                    {/* ========================================================== */}
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: direction * 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -direction * 15 }}
                            transition={{ duration: 0.12 }}
                            className="space-y-3"
                        >
                            {/* Cintillo de Compromiso con la Seguridad */}
                            <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/80 rounded-2xl p-3 flex items-start gap-2.5 shadow-2xs">
                                <ShieldCheck size={18} className="text-[#f16315] flex-shrink-0 mt-0.5" />
                                <div>
                                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                        Compromiso con la Seguridad
                                    </h2>
                                    <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                                        Recuerda que somos responsables de las personas a bordo de este vehículo. Verifica con calma cada punto antes de autorizar.
                                    </p>
                                </div>
                            </div>

                            {/* TARJETA MAESTRA: TORQUE DE BIRLOS EN LAS 4 RUEDAS */}
                            <div className={`bg-white rounded-2xl p-3.5 border transition-all shadow-xs ${
                                wheelsAllOk ? "border-emerald-300 ring-1 ring-emerald-300/40" : "border-slate-200"
                            }`}>
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-xl ${
                                            wheelsAllOk ? "bg-emerald-100 text-emerald-700" : "bg-orange-50 text-[#f16315]"
                                        }`}>
                                            <Disc size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black uppercase text-slate-900 leading-tight">
                                                Torque de Birlos (4 Ruedas)
                                            </h3>
                                            <p className="text-[10px] text-slate-400">
                                                Apretadas con torquímetro / maneral
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={toggleAllWheels}
                                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                                            wheelsAllOk
                                                ? "bg-emerald-600 text-white shadow-xs"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                                        }`}
                                    >
                                        {wheelsAllOk && <Check size={12} />}
                                        <span>{wheelsAllOk ? "4 Listas" : "Marcar 4"}</span>
                                    </button>
                                </div>

                                {/* Cuadrícula 2x2 táctil de las 4 ruedas */}
                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                                    <WheelCard
                                        label="Delantera Izq"
                                        sublabel="Lado chofer"
                                        code="DEL-IZQ"
                                        active={data.critical.wheelsDetail.frontLeft}
                                        onClick={() => toggleWheel("frontLeft")}
                                    />
                                    <WheelCard
                                        label="Delantera Der"
                                        sublabel="Lado copiloto"
                                        code="DEL-DER"
                                        active={data.critical.wheelsDetail.frontRight}
                                        onClick={() => toggleWheel("frontRight")}
                                    />
                                    <WheelCard
                                        label="Trasera Izq"
                                        sublabel="Lado chofer"
                                        code="TRAS-IZQ"
                                        active={data.critical.wheelsDetail.rearLeft}
                                        onClick={() => toggleWheel("rearLeft")}
                                    />
                                    <WheelCard
                                        label="Trasera Der"
                                        sublabel="Lado copiloto"
                                        code="TRAS-DER"
                                        active={data.critical.wheelsDetail.rearRight}
                                        onClick={() => toggleWheel("rearRight")}
                                    />
                                </div>
                            </div>

                            {/* 5 PUNTOS CRÍTICOS MECÁNICOS ADICIONALES */}
                            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                                        <Wrench size={13} className="text-[#f16315]" />
                                        Niveles bajo cofre y Prueba
                                    </label>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        Toca para confirmar
                                    </span>
                                </div>

                                <div className="space-y-1.5">
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
                                        subtitle="Sin ruidos en marcha ni testigos en tablero"
                                        active={data.critical.roadTestAndDashboardOk}
                                        onClick={() => toggleCritical("roadTestAndDashboardOk")}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ========================================================== */}
                    {/* PASO 2: FOTO DEL TABLERO Y ESTÉTICA                       */}
                    {/* ========================================================== */}
                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: direction * 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -direction * 15 }}
                            transition={{ duration: 0.12 }}
                            className="space-y-3"
                        >
                            {/* EVIDENCIA FOTOGRÁFICA DEL TABLERO */}
                            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-2.5">
                                <div>
                                    <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                                        <Camera size={14} className="text-[#f16315]" />
                                        Foto del Tablero Encendido
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Certifica el kilometraje y que no hay testigos prendidos
                                    </p>
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
                                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-slate-300">
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
                                            <p className="text-xs font-bold text-slate-900 flex items-center gap-1 truncate">
                                                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                                Foto del tablero cargada ✓
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setPhotoRotation((r) => (r + 90) % 360)}
                                                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 shadow-2xs"
                                                >
                                                    <RotateCw size={11} /> Girar
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
                                        className="w-full py-4 px-3 bg-orange-50/50 hover:bg-orange-50 border-2 border-dashed border-orange-300 rounded-2xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-2.5 group"
                                    >
                                        {isUploadingPhoto ? (
                                            <>
                                                <Loader2 size={18} className="text-[#f16315] animate-spin" />
                                                <span className="text-xs font-bold text-slate-800">
                                                    Subiendo foto del tablero...
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-2 bg-white rounded-xl shadow-xs text-[#f16315] group-hover:scale-105 transition-transform">
                                                    <Camera size={18} />
                                                </div>
                                                <div className="text-left">
                                                    <span className="text-xs font-black block text-slate-900 leading-tight">
                                                        Tomar Foto con Celular (Tablero Encendido)
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 block">
                                                        Toca aquí para abrir la cámara
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </button>
                                )}

                                {photoError && (
                                    <p className="text-[10px] text-red-600 font-bold">{photoError}</p>
                                )}
                            </div>

                            {/* REVISIÓN DE LIMPIEZA Y CORTESÍA (ESTÉTICA) */}
                            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                                        <Sparkles size={14} className="text-amber-500" />
                                        Limpieza e Interiores
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={markAllAestheticOk}
                                        className="text-[11px] font-black text-[#f16315] hover:underline"
                                    >
                                        Marcar Todo OK
                                    </button>
                                </div>

                                <div className="space-y-1.5">
                                    <AestheticCheckCard
                                        label="Cero grasa en volante, palanca y tapicería"
                                        sub="Asientos y plásticos libres de huellas"
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
                        </motion.div>
                    )}

                    {/* ========================================================== */}
                    {/* PASO 3: FIRMAS Y RESPONSABILIDAD                          */}
                    {/* ========================================================== */}
                    {currentStep === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: direction * 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -direction * 15 }}
                            transition={{ duration: 0.12 }}
                            className="space-y-3"
                        >
                            {/* RESPONSABILIDADES: 3 NIVELES DE AUDITORÍA */}
                            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-3.5">
                                <div>
                                    <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                                        <UserCheck size={15} className="text-[#f16315]" />
                                        Responsables de la Salida
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Registrado para el expediente del vehículo
                                    </p>
                                </div>

                                {/* 1. Técnico Responsable Principal */}
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider block mb-1">
                                        1. Técnico Responsable (Quien reparó):
                                    </label>
                                    <div className="flex flex-wrap gap-1">
                                        {DEFAULT_TECHNICIANS.map((tech) => {
                                            const isSel = data.technician === tech;
                                            return (
                                                <button
                                                    key={tech}
                                                    type="button"
                                                    onClick={() => setData((p) => ({ ...p, technician: tech }))}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                                        isSel
                                                            ? "bg-slate-900 text-white shadow-xs"
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
                                                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg w-24"
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
                                    <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider block mb-1">
                                        2. Auxiliar Técnico (Apoyo en montaje):
                                    </label>
                                    <div className="flex flex-wrap gap-1">
                                        {DEFAULT_ASSISTANTS.map((asst) => {
                                            const isSel = data.assistantTechnician === asst;
                                            return (
                                                <button
                                                    key={asst}
                                                    type="button"
                                                    onClick={() => setData((p) => ({ ...p, assistantTechnician: asst }))}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                                        isSel
                                                            ? "bg-indigo-600 text-white shadow-xs"
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
                                                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg w-24"
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
                                    <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider block mb-1">
                                        3. Inspector que Certifica Salida (Visto Bueno):
                                    </label>
                                    <div className="flex flex-wrap gap-1">
                                        {DEFAULT_INSPECTORS.map((insp) => {
                                            const isSel = data.inspector === insp;
                                            return (
                                                <button
                                                    key={insp}
                                                    type="button"
                                                    onClick={() => setData((p) => ({ ...p, inspector: insp }))}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                                        isSel
                                                            ? "bg-[#f16315] text-white shadow-xs shadow-orange-200"
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
                                                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg w-24"
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
                                        placeholder="Ej: Foco de sensor de oxígeno preexistente..."
                                        className="w-full text-base sm:text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f16315]"
                                    />
                                </div>

                                {/* Declaración de Compromiso Compartido */}
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 leading-snug">
                                    {renderCommitmentStatement()}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Barra Inferior Fija para Móvil (Sticky Bottom Action Bar) */}
            <footer className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 px-3.5 py-2.5 z-30 shadow-lg">
                <div className="w-full max-w-lg mx-auto flex items-center justify-between gap-2.5">
                    {/* Botón Izquierdo / Resumen */}
                    {currentStep === 1 ? (
                        <div className="text-xs">
                            {missingCriticalCount === 0 ? (
                                <span className="font-bold text-emerald-700 flex items-center gap-1">
                                    <CheckCircle2 size={15} /> 6/6 Listos
                                </span>
                            ) : (
                                <span className="font-bold text-amber-800 text-[11px] flex items-center gap-1">
                                    <AlertTriangle size={14} className="text-amber-600" />
                                    Faltan {missingCriticalCount} puntos
                                </span>
                            )}
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => goToStep(currentStep - 1)}
                            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                        >
                            <ArrowLeft size={14} />
                            <span>Paso {currentStep - 1}</span>
                        </button>
                    )}

                    {/* Botón Principal Derecho */}
                    {currentStep === 1 && (
                        <button
                            type="button"
                            onClick={() => goToStep(2)}
                            disabled={!canPassStep1}
                            className="px-4 py-2.5 bg-[#f16315] hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm shadow-orange-500/20"
                        >
                            <span>Paso 2: Tablero</span>
                            <ArrowRight size={14} />
                        </button>
                    )}

                    {currentStep === 2 && (
                        <button
                            type="button"
                            onClick={() => goToStep(3)}
                            className="px-4 py-2.5 bg-[#f16315] hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm shadow-orange-500/20"
                        >
                            <span>Paso 3: Firmas</span>
                            <ArrowRight size={14} />
                        </button>
                    )}

                    {currentStep === 3 && (
                        <div className="flex items-center gap-2 flex-1 justify-end">
                            <button
                                type="button"
                                onClick={() => handleSubmit(false)}
                                disabled={isSaving}
                                className="px-2.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[11px] font-bold transition-colors"
                            >
                                Borrador
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSubmit(true)}
                                disabled={!canApprove || isSaving}
                                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                            >
                                {isSaving ? (
                                    <Loader2 size={15} className="animate-spin" />
                                ) : (
                                    <ShieldCheck size={16} />
                                )}
                                <span>Aprobar Salida</span>
                            </button>
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
}

export default function CalidadPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
            className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between select-none ${
                active
                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 shadow-2xs"
                    : "bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
        >
            <div className="min-w-0">
                <span className="text-[11px] font-black uppercase tracking-tight block leading-tight">
                    {code}
                </span>
                <span className="text-[10px] font-bold block truncate text-slate-800">
                    {label}
                </span>
                <span className="text-[9px] text-slate-400 block truncate">
                    {sublabel}
                </span>
            </div>
            {active ? (
                <div className="p-0.5 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                    <CheckCircle2 size={18} />
                </div>
            ) : (
                <CircleDashed size={18} className="text-slate-300 flex-shrink-0" />
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
}: {
    icon: any;
    title: string;
    subtitle: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 select-none ${
                active
                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-2xs"
                    : "bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
        >
            <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-xl flex-shrink-0 ${
                    active ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-500 border border-slate-200"
                }`}>
                    <Icon size={15} />
                </div>
                <div className="min-w-0">
                    <span className="text-xs font-bold block text-slate-900 leading-tight">
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
            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 select-none ${
                active
                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-2xs"
                    : "bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100"
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
