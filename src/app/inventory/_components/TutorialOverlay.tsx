'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Info, Search, Plus, BarChart3, CheckCircle2, Camera, ShieldCheck, ClipboardList, Car, MousePointer2, User } from 'lucide-react';

interface TutorialStep {
    elementId: string;
    title: string;
    description: string;
    icon: any;
    appStep?: number; // The step the app SHOULD be in for this tutorial explanation
    requireInteraction?: boolean; // If true, user must DO something to proceed
    interactionHint?: string;
    targetAppStep?: number; // If set, reaching this app step marks interaction as successful
    validateInteraction?: (data: any) => boolean; // Custom logic to check if interaction is complete
}

const STEPS: TutorialStep[] = [
    {
        elementId: '',
        title: '¡Bienvenido al Modo Capacitación!',
        description: 'Esta guía te enseñará a realizar una recepción vehicular perfecta. Lo mejor: ¡Aprenderás haciendo!',
        icon: Info,
        appStep: 0
    },
    {
        elementId: 'tutorial-search-input',
        title: '1. Búsqueda Inteligente',
        description: 'Empieza siempre buscando al cliente por placas o nombre. Si ya nos ha visitado, ahorrarás 10 minutos de captura.',
        icon: Search,
        appStep: 0
    },
    {
        elementId: 'tutorial-new-client',
        title: 'Clientes Nuevos',
        description: 'Si es la primera vez del cliente, usa este botón para iniciar un registro desde cero.',
        icon: Plus,
        appStep: 0,
        requireInteraction: true,
        targetAppStep: 1, // Moving to Client Form step
        interactionHint: 'Haz clic en "¿Es cliente nuevo?" para probar'
    },
    {
        elementId: 'tutorial-client-form',
        title: 'Datos del Cliente',
        description: 'Ingresa el nombre, WhatsApp y correo para dar de alta al cliente en la base de datos.',
        icon: User,
        appStep: 1,
        requireInteraction: true,
        validateInteraction: (data) => !!(data?.client?.name && data?.client?.phone && data?.client?.email),
        interactionHint: 'Captura nombre, tel y correo para continuar'
    },
    {
        elementId: 'tutorial-vehicle-form',
        title: '2. Datos del Vehículo',
        description: 'Actualiza el kilometraje y selecciona marca, modelo y nivel de gasolina. El kilometraje que aparece es el último registrado; es nuestro trabajo actualizarlo al actual.',
        icon: Car,
        appStep: 2,
        requireInteraction: true,
        validateInteraction: (data) => !!(data?.vehicle?.brand && data?.vehicle?.model && data?.vehicle?.gas),
        interactionHint: 'Selecciona Marca, Modelo y Gasolina'
    },
    {
        elementId: 'tutorial-inventory-grid',
        title: '3. Inventario Físico',
        description: 'Marca sólo lo que el auto traiga. Si detectas algún objeto extra, usa el botón "Otro" al final de la lista.',
        icon: ClipboardList,
        appStep: 3,
        requireInteraction: true,
        validateInteraction: (data) => Object.values(data?.inventory || {}).some(v => v === true),
        interactionHint: 'Prueba marcando un objeto del inventario'
    },
    {
        elementId: 'tutorial-photo-evidence',
        title: '4. Evidencia Fotográfica',
        description: 'Las 4 fotos básicas son obligatorias. TIP: Puedes añadir notas a cada foto. ¡Prueba tomando al menos una foto!',
        icon: Camera,
        appStep: 4,
        requireInteraction: true,
        validateInteraction: (data) => Object.values(data?.photos || {}).some((p: any) => !!p.previewUrl),
        interactionHint: 'Toma al menos una foto de prueba'
    },
    {
        elementId: 'tutorial-functional-inspection',
        title: '5. Inspección Visual',
        description: 'Todo inicia en "Todo OK" (Verde). Toca lo que falle para marcarlo en Rojo. No olvides revisar tapetes, tapones y rines.',
        icon: ShieldCheck,
        appStep: 5
    },
    {
        elementId: 'tutorial-service-details',
        title: '6. Comentarios y Valores',
        description: 'Captura motivos de ingreso y observaciones. Registra objetos de valor y añade comentarios adicionales si es necesario.',
        icon: CheckCircle2,
        appStep: 6
    },
    {
        elementId: 'tutorial-progress-bar',
        title: 'Barra de Progreso',
        description: 'Observa cómo avanzas. El botón "Finalizar" se activará cuando completes todos los datos obligatorios.',
        icon: BarChart3,
        appStep: 6
    }
];

export default function TutorialOverlay({ isOpen, onClose, onSetAppStep, currentAppStep, receptionData }: {
    isOpen: boolean,
    onClose: () => void,
    onSetAppStep?: (step: number) => void,
    currentAppStep: number,
    receptionData: any
}) {
    const [currentStep, setCurrentStep] = useState(0);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const [hasInteracted, setHasInteracted] = useState(false);
    const [screenHeight, setScreenHeight] = useState(0);
    const [screenWidth, setScreenWidth] = useState(0);

    const updateCoords = useCallback(() => {
        const step = STEPS[currentStep];
        if (!step?.elementId) {
            setCoords({ top: 0, left: 0, width: 0, height: 0 });
            return;
        }

        const el = document.getElementById(step.elementId);
        if (el) {
            const rect = el.getBoundingClientRect();
            setCoords({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
        }
    }, [currentStep]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setScreenHeight(window.innerHeight);
            setScreenWidth(window.innerWidth);
            const handleResize = () => {
                setScreenHeight(window.innerHeight);
                setScreenWidth(window.innerWidth);
                updateCoords();
            };
            const handleScroll = () => updateCoords();

            window.addEventListener('resize', handleResize);
            window.addEventListener('scroll', handleScroll, true);

            return () => {
                window.removeEventListener('resize', handleResize);
                window.removeEventListener('scroll', handleScroll, true);
            };
        }
    }, [updateCoords]);

    // Watch for App Step changes AND State changes to detect interactions automatically
    useEffect(() => {
        if (!isOpen) return;
        const step = STEPS[currentStep];

        // Success Type 1: Reached a target app step (e.g., opened a form)
        if (step.targetAppStep !== undefined && currentAppStep === step.targetAppStep) {
            setHasInteracted(true);
            // AUTO-ADVANCE: Avoid "ghost spotlight" on old button
            const timer = setTimeout(() => {
                setCurrentStep(s => {
                    if (s < STEPS.length - 1) return s + 1;
                    return s;
                });
            }, 600);
            return () => clearTimeout(timer);
        }

        // Success Type 2: Custom validation (e.g., filled a field or took a photo)
        if (step.validateInteraction && step.requireInteraction) {
            if (step.validateInteraction(receptionData)) {
                setHasInteracted(true);
            }
        }
    }, [currentAppStep, currentStep, isOpen, receptionData]);

    // Reset interaction state on step change
    useEffect(() => {
        setHasInteracted(false);
    }, [currentStep]);

    useEffect(() => {
        if (isOpen) {
            const step = STEPS[currentStep];

            // Sync App State
            if (onSetAppStep && step.appStep !== undefined && !hasInteracted) {
                if (currentAppStep !== step.appStep && step.targetAppStep === undefined) {
                    onSetAppStep(step.appStep);
                }
            }

            // Spotlight Initial positioning
            const timer = setTimeout(() => {
                updateCoords();
                const el = document.getElementById(step.elementId);
                // Only scroll if NOT already in view to avoid jarring jumps on mobile
                if (el) {
                    const rect = el.getBoundingClientRect();
                    const isInView = (rect.top >= 0 && rect.bottom <= window.innerHeight);
                    if (!isInView) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [isOpen, currentStep, onSetAppStep, currentAppStep, hasInteracted, updateCoords]);

    if (!isOpen) return null;

    const step = STEPS[currentStep];
    const Icon = step.icon;
    const isWaiting = step.requireInteraction && !hasInteracted;

    // Logic to avoid overlapping: if the element is in the bottom half, move card to top
    const isElementInBottomHalf = coords.top > (screenHeight / 2);

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
            {/* 4-Panel Backdrop (Better touch transparency than clip-path) */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Top */}
                <div
                    className="absolute bg-slate-900/40 backdrop-blur-[1px] transition-all duration-300"
                    style={{ top: 0, left: 0, right: 0, height: Math.max(0, coords.top) }}
                />
                {/* Bottom */}
                <div
                    className="absolute bg-slate-900/40 backdrop-blur-[1px] transition-all duration-300"
                    style={{ top: coords.top + coords.height, left: 0, right: 0, bottom: 0 }}
                />
                {/* Left */}
                <div
                    className="absolute bg-slate-900/40 backdrop-blur-[1px] transition-all duration-300"
                    style={{ top: coords.top, left: 0, width: Math.max(0, coords.left), height: coords.height }}
                />
                {/* Right */}
                <div
                    className="absolute bg-slate-900/40 backdrop-blur-[1px] transition-all duration-300"
                    style={{ top: coords.top, left: coords.left + coords.width, right: 0, height: coords.height }}
                />
            </div>

            {/* Spotlight Border */}
            {step.elementId && coords.width > 0 && (
                <motion.div
                    animate={{
                        top: coords.top - 8,
                        left: coords.left - 8,
                        width: coords.width + 16,
                        height: coords.height + 16
                    }}
                    className={`absolute border-4 ${isWaiting ? 'border-orange-400' : 'border-[#F37014]'} rounded-2xl shadow-[0_0_40px_rgba(243,112,20,0.6)] pointer-events-none`}
                    transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                >
                    {isWaiting && (
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg whitespace-nowrap"
                        >
                            <MousePointer2 size={12} className="animate-bounce" />
                            {step.interactionHint || 'Toca aquí para probar'}
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* Content Card */}
            <div className={`absolute inset-0 flex p-3 md:p-6 pointer-events-none ${isElementInBottomHalf ? 'items-start pt-12' : 'items-end pb-4 md:pb-8'}`}>
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: isElementInBottomHalf ? -40 : 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-[95%] sm:max-w-sm w-full mx-auto pointer-events-auto border border-slate-200 transition-all relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#F37014]/10" />

                    <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl ${isWaiting ? 'bg-orange-50 text-orange-500 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>
                            <Icon size={20} className="md:w-6 md:h-6" />
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={18} className="md:w-5 md:h-5" />
                        </button>
                    </div>

                    <div className="space-y-1.5 md:space-y-2 mb-4 md:mb-6 text-left">
                        <h4 className="text-lg md:text-xl font-black text-slate-900 leading-tight flex items-center gap-2">
                            {step.title}
                            {hasInteracted && <CheckCircle2 size={18} className="text-green-500 md:w-5 md:h-5" />}
                        </h4>
                        <p className="text-slate-600 text-xs md:text-sm leading-relaxed">{step.description}</p>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex gap-1 overflow-hidden max-w-[40%]">
                            {STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1 rounded-full transition-all flex-shrink-0 ${i === currentStep ? 'w-4 md:w-6 bg-[#F37014]' : 'w-1 bg-slate-200'}`}
                                />
                            ))}
                        </div>

                        <div className="flex gap-1.5 md:gap-2">
                            {(currentStep > 0 && !isWaiting) && (
                                <button
                                    onClick={() => setCurrentStep(s => s - 1)}
                                    className="p-2.5 md:p-3 bg-slate-50 text-slate-400 rounded-lg md:rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    <ChevronLeft size={18} className="md:w-5 md:h-5" />
                                </button>
                            )}

                            <button
                                disabled={isWaiting}
                                onClick={() => {
                                    if (currentStep < STEPS.length - 1) {
                                        setCurrentStep(s => s + 1);
                                    } else {
                                        onSetAppStep?.(0);
                                        onClose();
                                        setCurrentStep(0);
                                    }
                                }}
                                className={`px-4 md:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold text-sm md:text-base flex items-center gap-2 transition-all shadow-lg ${isWaiting
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        : 'bg-[#F37014] text-white shadow-[#F37014]/30 hover:bg-[#e06612]'
                                    }`}
                            >
                                {isWaiting ? (
                                    <>
                                        <MousePointer2 size={16} className="md:w-4 md:h-4 animate-bounce" />
                                        Pruébalo
                                    </>
                                ) : (
                                    <>
                                        {currentStep === STEPS.length - 1 ? '🏁 Fin' : 'Sig.'}
                                        <ChevronRight size={16} className="md:w-4 md:h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
