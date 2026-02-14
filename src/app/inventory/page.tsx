'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Car, ClipboardList, CheckCircle, Camera, ChevronRight, ChevronLeft, Settings, FileText, Plus } from 'lucide-react';
import ClientSearch from './_components/ClientSearch';
import ClientForm from './_components/ClientForm';
import InventoryGrid from './_components/InventoryGrid';
import VehicleForm from './_components/VehicleForm';
import PhotoEvidence, { PhotoData } from './_components/PhotoEvidence';
import FunctionalInspection, { FunctionalData } from './_components/FunctionalInspection';
import ServiceDetails, { ServiceData } from './_components/ServiceDetails';
import TutorialOverlay from './_components/TutorialOverlay';
import { HelpCircle } from 'lucide-react';

// Steps definition
const STEPS = [
    { id: 'search', title: 'Recepción', icon: Search },
    { id: 'client', title: 'Cliente', icon: ClipboardList },
    { id: 'vehicle', title: 'Vehículo', icon: Car },
    { id: 'inventory', title: 'Inventario', icon: CheckCircle },
    { id: 'photos', title: 'Evidencia', icon: Camera },
    { id: 'functional', title: 'Funcional', icon: Settings },
    { id: 'details', title: 'Detalles', icon: FileText },
];

// Helper to title case names (Unicode safe)
function toTitleCase(str: string): string {
    if (!str) return str;
    return str.toLowerCase().split(/\s+/).map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

export default function InventoryPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);

    // State
    const [clientData, setClientData] = useState({
        name: '',
        phone: '',
        phoneOffice: '',
        email: '',
        address: '',
        colonia: '',
        municipality: '',
        state: ''
    });
    const [isNewClient, setIsNewClient] = useState(false);

    const [vehicleData, setVehicleData] = useState({
        brand: '', model: '', year: '', plates: '', km: '', gas: '', serialNumber: '', motor: ''
    });
    const [inventory, setInventory] = useState<Record<string, boolean>>({});
    const [inventoryOther, setInventoryOther] = useState('');
    const [lastKm, setLastKm] = useState('');

    // New Photo State
    const [photos, setPhotos] = useState<Record<string, PhotoData>>({});

    // Functional State
    const [functionalData, setFunctionalData] = useState<FunctionalData>({
        horn: true,
        wipers: true,
        lightsAllOk: true,
        lightsHead: true,
        lightsTail: true,
        lightsStop: true,
        lightsTurn: true,
        windowsAllOk: true,
        windowPiloto: true,
        windowCopiloto: true,
        windowRearLeft: true,
        windowRearRight: true,
        sunroof: true,
        mirrors: true,
        floormats: 'Completo',
        hubcaps: '4',
        hasRines: false,
        radio: true,
    });

    // Service Details State
    const [serviceData, setServiceData] = useState<ServiceData>({
        serviceType: '',
        hasValuables: false,
        valuablesDescription: '',
        advisorName: '',
        comments: ''
    });

    // State for Success
    const [isSuccess, setIsSuccess] = useState(false);
    const [savedFolio, setSavedFolio] = useState('');

    // Load ALL data from local storage on mount (Idea 1: Autoguardado)
    useEffect(() => {
        const savedData = localStorage.getItem('INVENTORY_FORM_DRAFT');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setClientData(parsed.clientData || clientData);
                setVehicleData(parsed.vehicleData || vehicleData);
                setInventory(parsed.inventory || {});
                setInventoryOther(parsed.inventoryOther || '');
                setFunctionalData(parsed.functionalData || functionalData);
                setServiceData(parsed.serviceData || serviceData);
                setPhotos(parsed.photos || {});
                setIsNewClient(parsed.isNewClient || false);
                setCurrentStep(parsed.currentStep || 0);
            } catch (e) {
                console.error("Error loading draft", e);
            }
        }
    }, []);

    // Save draft on every change (Idea 1: Autoguardado)
    useEffect(() => {
        if (!isSuccess) {
            const draft = {
                clientData, vehicleData, inventory, inventoryOther,
                functionalData, serviceData, photos, isNewClient, currentStep
            };
            localStorage.setItem('INVENTORY_FORM_DRAFT', JSON.stringify(draft));
        }
    }, [clientData, vehicleData, inventory, inventoryOther, functionalData, serviceData, photos, isNewClient, currentStep, isSuccess]);

    // Load advisor name from local storage on mount
    useEffect(() => {
        const savedAdvisor = localStorage.getItem('lastAdvisorName');
        if (savedAdvisor) {
            setServiceData(prev => ({ ...prev, advisorName: savedAdvisor }));
        }
    }, []);

    const resetForm = () => {
        localStorage.removeItem('INVENTORY_FORM_DRAFT');
        setClientData({ name: '', phone: '', phoneOffice: '', email: '', address: '', colonia: '', municipality: '', state: '' });
        setVehicleData({ brand: '', model: '', year: '', plates: '', km: '', gas: '', serialNumber: '', motor: '' });
        setInventory({});
        setInventoryOther('');
        setLastKm('');
        setPhotos({});
        setFunctionalData({
            horn: true, wipers: true, lightsAllOk: true, lightsHead: true, lightsTail: true, lightsStop: true, lightsTurn: true,
            windowsAllOk: true, windowPiloto: true, windowCopiloto: true, windowRearLeft: true, windowRearRight: true, sunroof: true, mirrors: true,
            floormats: 'Completo', hubcaps: '4', hasRines: false, radio: true
        });
        setServiceData(prev => ({
            serviceType: '', hasValuables: false, valuablesDescription: '', advisorName: prev.advisorName, comments: ''
        }));
        setCurrentStep(0);
        setIsSuccess(false);
        setSavedFolio('');
    };

    const updatePhoto = (id: string, data: Partial<PhotoData>) => {
        setPhotos(prev => {
            const current = prev[id] || { id, label: '', previewUrl: null };
            return {
                ...prev,
                [id]: { ...current, ...data }
            };
        });
    };

    const toggleInventory = (itemId: string) => {
        setInventory(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const nextStep = () => {
        if (currentStep < STEPS.length - 1) {
            setDirection(1);
            setCurrentStep(c => c + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep(c => c - 1);
        }
    };

    const CurrentIcon = STEPS[currentStep].icon;

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white p-8 rounded-3xl border border-slate-200 max-w-sm w-full text-center space-y-6 shadow-2xl"
                >
                    <div className="w-20 h-20 bg-[#F37014]/10 rounded-full flex items-center justify-center mx-auto text-[#F37014]">
                        <CheckCircle size={48} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black italic text-slate-900">¡LISTO!</h2>
                        <p className="text-slate-500">La recepción se ha enviado correctamente a Administración.</p>
                        <div className="bg-slate-50 py-2 px-4 rounded-lg inline-block border border-slate-200">
                            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Folio</span>
                            <p className="text-xl font-mono font-bold text-[#F37014]">#{savedFolio}</p>
                        </div>
                    </div>
                    <button
                        onClick={resetForm}
                        className="w-full py-4 bg-[#F37014] hover:bg-[#e06612] text-white rounded-2xl font-bold shadow-lg shadow-[#F37014]/30 transition-all flex items-center justify-center gap-2"
                    >
                        Nueva Recepción
                        <Plus size={20} />
                    </button>
                    <p className="text-[10px] text-slate-400">CarMD OS - Sistema de Gestión de Taller</p>
                </motion.div>
            </div>
        );
    }

    const isStepValid = () => {
        const step = STEPS[currentStep].id;
        if (step === 'client') return clientData.name && clientData.phone && clientData.email;
        if (step === 'vehicle') return vehicleData.brand && vehicleData.model && vehicleData.plates && vehicleData.km && vehicleData.serialNumber && vehicleData.motor;
        if (step === 'details') return serviceData.serviceType && serviceData.advisorName;
        return true;
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#F37014] selection:text-white">
            {/* Header / Progress */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#F37014] rounded-lg shadow-lg shadow-[#F37014]/20">
                            <CurrentIcon size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-medium text-slate-400">Paso {currentStep + 1} de {STEPS.length}</h1>
                            <p className="text-lg font-bold leading-none text-slate-900">{STEPS[currentStep].title}</p>
                        </div>
                    </div>

                    <div className="flex gap-1" id="tutorial-progress-bar">
                        {STEPS.map((step, idx) => (
                            <div
                                key={step.id}
                                className={`h-1.5 rounded-full transition-all duration-500 ${idx <= currentStep ? 'w-8 bg-[#F37014]' : 'w-2 bg-slate-200'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="pt-24 pb-32 px-4 max-w-3xl mx-auto">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        id="tutorial-step-container"
                        initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="min-h-[60vh] flex flex-col p-6 border border-slate-200 bg-white rounded-2xl shadow-sm"
                    >


                        {/* Step 0: Search */}
                        {currentStep === 0 && (
                            <ClientSearch
                                onClientFound={(data) => {
                                    console.log('Found:', data);
                                    setClientData({
                                        name: toTitleCase(data.name),
                                        phone: data.phone,
                                        phoneOffice: data.phoneOffice || '',
                                        email: data.email || '',
                                        address: data.address || '',
                                        colonia: data.colonia || '',
                                        municipality: data.municipality || '',
                                        state: data.state || ''
                                    });
                                    // Set Vehicle Data but clear KM to force update
                                    setVehicleData(prev => ({
                                        ...prev,
                                        ...data.vehicle,
                                        km: '' // Force update
                                    }));
                                    setLastKm(data.vehicle.km || ''); // Store last for reference
                                    setInventory({});
                                    setInventoryOther('');
                                    setIsNewClient(false);
                                    nextStep();
                                }}
                                onNewClient={() => {
                                    setIsNewClient(true);
                                    // Reset data for new entry
                                    setClientData({
                                        name: '',
                                        phone: '',
                                        phoneOffice: '',
                                        email: '',
                                        address: '',
                                        colonia: '',
                                        municipality: '',
                                        state: ''
                                    });
                                    setVehicleData({ brand: '', model: '', year: '', plates: '', km: '', gas: '', serialNumber: '', motor: '' });
                                    setLastKm('');
                                    setInventory({});
                                    setInventoryOther('');
                                    setPhotos({});
                                    setFunctionalData({ horn: true, wipers: true, lightsAllOk: true, lightsHead: true, lightsTail: true, lightsStop: true, lightsTurn: true, windowsAllOk: true, windowPiloto: true, windowCopiloto: true, windowRearLeft: true, windowRearRight: true, sunroof: true, mirrors: true, floormats: 'Completo', hubcaps: '4', hasRines: false, radio: true });
                                    setServiceData(prev => ({
                                        serviceType: '',
                                        hasValuables: false,
                                        valuablesDescription: '',
                                        advisorName: prev.advisorName, // Keep advisor name
                                        comments: ''
                                    }));
                                    nextStep();
                                }}
                            />
                        )}

                        {/* Step 1: Client Form (New) */}
                        {STEPS[currentStep].id === 'client' && (
                            <ClientForm
                                data={clientData}
                                onChange={setClientData}
                                onNext={nextStep}
                                isNew={isNewClient}
                            />
                        )}

                        {/* Step 2: Vehicle */}
                        {STEPS[currentStep].id === 'vehicle' && (
                            <VehicleForm
                                data={vehicleData}
                                onChange={setVehicleData}
                                onNext={nextStep}
                                lastKm={lastKm}
                            />
                        )}

                        {/* Step 3: Inventory */}
                        {STEPS[currentStep].id === 'inventory' && (
                            <div className="flex flex-col items-center space-y-6">
                                <h3 className="text-xl font-bold">Inventario Físico</h3>
                                <InventoryGrid
                                    inventory={inventory}
                                    onToggleItem={toggleInventory}
                                    otherDescription={inventoryOther}
                                    onOtherDescriptionChange={setInventoryOther}
                                />
                            </div>
                        )}

                        {/* Step 4: Photo Evidence (Replaces Damages) */}
                        {STEPS[currentStep].id === 'photos' && (
                            <PhotoEvidence photos={photos} onPhotoUpdate={updatePhoto} plates={vehicleData.plates} />
                        )}

                        {/* Step 5: Functional Inspection */}
                        {STEPS[currentStep].id === 'functional' && (
                            <FunctionalInspection
                                data={functionalData}
                                onChange={setFunctionalData}
                            />
                        )}

                        {/* Step 6: Service Details */}
                        {STEPS[currentStep].id === 'details' && (
                            <ServiceDetails
                                data={serviceData}
                                onChange={setServiceData}
                            />
                        )}

                        {/* Remove placeholder logic - all steps are now implemented */}

                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-40">
                <div className="max-w-3xl mx-auto flex gap-3">
                    <button
                        onClick={() => setShowTutorial(true)}
                        className="p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 font-bold flex items-center gap-2 hover:bg-blue-100 transition-colors"
                        title="Ver Tutorial"
                    >
                        <HelpCircle size={20} />
                        <span className="hidden sm:inline">Guía</span>
                    </button>

                    <div className="flex-1 flex gap-3">
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            className="bg-slate-100 text-slate-400 p-4 rounded-2xl disabled:opacity-50 hover:bg-slate-200 transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <button
                            onClick={async () => {
                                if (currentStep === STEPS.length - 1) {
                                    // FINAL SUBMISSION - Save to Pending List
                                    if (serviceData.advisorName) {
                                        localStorage.setItem('lastAdvisorName', serviceData.advisorName);
                                    }

                                    const folio = `INV-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
                                    setSavedFolio(folio);

                                    const receptionData = {
                                        id: Date.now().toString(),
                                        isReception: true,
                                        date: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
                                        folio: folio,
                                        client: clientData,
                                        vehicle: vehicleData,
                                        inventory: { ...inventory, otro: inventoryOther },
                                        inventoryOther,
                                        functional: functionalData,
                                        service: serviceData,
                                        photos,
                                        notes: serviceData.comments
                                    };

                                    try {
                                        const existing = JSON.parse(localStorage.getItem('PENDING_RECEPTIONS') || '[]');
                                        existing.push(receptionData);
                                        localStorage.setItem('PENDING_RECEPTIONS', JSON.stringify(existing));
                                    } catch (e) {
                                        console.warn("Local Storage Full", e);
                                    }

                                    try {
                                        const res = await fetch('/api/inventory/save', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(receptionData)
                                        });
                                        if (!res.ok) throw new Error('Failed to save to sheet');
                                        setIsSuccess(true);
                                    } catch (error) {
                                        console.error("Sheet Save Error:", error);
                                        alert("⚠️ Se guardó localmente pero hubo error al escribir en Google Sheets.");
                                    }
                                } else {
                                    nextStep();
                                }
                            }}
                            disabled={!isStepValid()}
                            className={`flex-1 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${isStepValid()
                                ? 'bg-[#F37014] text-white shadow-lg shadow-[#F37014]/30'
                                : 'bg-slate-200 text-slate-400'
                                }`}
                        >
                            {currentStep === STEPS.length - 1 ? 'Finalizar Orden' : 'Continuar'}
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tutorial Overlay */}
            <TutorialOverlay
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
                currentAppStep={currentStep}
                receptionData={{
                    client: clientData,
                    vehicle: vehicleData,
                    inventory: inventory,
                    photos: photos,
                    functional: functionalData,
                    service: serviceData
                }}
                onSetAppStep={(step: number) => {
                    setDirection(step > currentStep ? 1 : -1);
                    setCurrentStep(step);
                }}
            />
        </div>
    );
}
