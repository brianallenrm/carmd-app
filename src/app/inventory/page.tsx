'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Car, ClipboardList, CheckCircle, Camera, ChevronRight, ChevronLeft, Settings, FileText } from 'lucide-react';
import ClientSearch from './_components/ClientSearch';
import ClientForm from './_components/ClientForm';
import InventoryGrid from './_components/InventoryGrid';
import VehicleForm from './_components/VehicleForm';
import PhotoEvidence, { PhotoData } from './_components/PhotoEvidence';
import FunctionalInspection, { FunctionalData } from './_components/FunctionalInspection';
import ServiceDetails, { ServiceData } from './_components/ServiceDetails';

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

export default function InventoryPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(0);

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
    });

    // Service Details State
    const [serviceData, setServiceData] = useState<ServiceData>({
        serviceType: '',
        hasValuables: false,
        valuablesDescription: '',
        advisorName: '',
        comments: ''
    });

    // Load advisor name from local storage on mount
    useEffect(() => {
        const savedAdvisor = localStorage.getItem('lastAdvisorName');
        if (savedAdvisor) {
            setServiceData(prev => ({ ...prev, advisorName: savedAdvisor }));
        }
    }, []);

    const updatePhoto = (id: string, data: Partial<PhotoData>) => {
        setPhotos(prev => ({
            ...prev,
            [id]: { ...prev[id], ...data }
        }));
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

    return (
        <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-rose-500 selection:text-white">
            {/* Header / Progress */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-600 rounded-lg shadow-lg shadow-rose-600/20">
                            <CurrentIcon size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-medium text-neutral-400">Paso {currentStep + 1} de {STEPS.length}</h1>
                            <p className="text-lg font-bold leading-none">{STEPS[currentStep].title}</p>
                        </div>
                    </div>

                    <div className="flex gap-1">
                        {STEPS.map((step, idx) => (
                            <div
                                key={step.id}
                                className={`h-1.5 rounded-full transition-all duration-500 ${idx <= currentStep ? 'w-8 bg-rose-600' : 'w-2 bg-neutral-800'
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
                        initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="min-h-[60vh] flex flex-col p-6 border border-neutral-800 bg-neutral-900/50 rounded-2xl"
                    >


                        {/* Step 0: Search */}
                        {currentStep === 0 && (
                            <ClientSearch
                                onClientFound={(data) => {
                                    console.log('Found:', data);
                                    setClientData({
                                        name: data.name,
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
                                    console.log('New Client');
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
                                    setFunctionalData({ horn: true, wipers: true, lightsAllOk: true, lightsHead: true, lightsTail: true, lightsStop: true, lightsTurn: true, windowsAllOk: true, windowPiloto: true, windowCopiloto: true, windowRearLeft: true, windowRearRight: true, sunroof: true, mirrors: true, floormats: 'Completo', hubcaps: '4', hasRines: false });
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

                        {/* Placeholder for other steps */}
                        {currentStep !== 0 && STEPS[currentStep].id !== 'photos' && STEPS[currentStep].id !== 'inventory' && STEPS[currentStep].id !== 'vehicle' && STEPS[currentStep].id !== 'functional' && STEPS[currentStep].id !== 'details' && (
                            <div className="text-center space-y-4 m-auto">
                                <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-600">
                                    <CurrentIcon size={32} />
                                </div>
                                <h2 className="text-2xl font-bold text-neutral-200">
                                    {STEPS[currentStep].title}
                                </h2>
                                <p className="text-neutral-500 max-w-sm mx-auto">
                                    Aquí irá la interfaz para la sección de {STEPS[currentStep].title.toLowerCase()}.
                                    Estamos construyendo esta funcionalidad.
                                </p>
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer / Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-neutral-900 border-t border-neutral-800">
                <div className="max-w-3xl mx-auto flex gap-4">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className={`flex-1 py-4 rounded-xl font-medium transition-all ${currentStep === 0
                            ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                            : 'bg-neutral-800 text-white hover:bg-neutral-700 active:scale-95'
                            }`}
                    >
                        Atrás
                    </button>

                    <button
                        onClick={async () => {
                            if (currentStep === STEPS.length - 1) {
                                // FINAL SUBMISSION - Save to Pending List
                                // Save advisor name
                                if (serviceData.advisorName) {
                                    localStorage.setItem('lastAdvisorName', serviceData.advisorName);
                                }

                                // Prepare Data
                                const receptionData = {
                                    id: Date.now().toString(), // Unique ID
                                    isReception: true,
                                    date: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
                                    folio: Math.floor(Math.random() * 10000).toString().padStart(5, '0'),
                                    client: clientData,
                                    vehicle: vehicleData,
                                    inventory: { ...inventory, otro: inventoryOther },
                                    inventoryOther,
                                    functional: functionalData,
                                    service: serviceData,
                                    photos,
                                    notes: serviceData.comments
                                };

                                // 1. Save locally (Backup/Admin Queue)
                                try {
                                    const existing = JSON.parse(localStorage.getItem('PENDING_RECEPTIONS') || '[]');
                                    existing.push(receptionData);
                                    localStorage.setItem('PENDING_RECEPTIONS', JSON.stringify(existing));
                                } catch (e) {
                                    console.warn("Local Storage Full - Skipping local backup", e);
                                    // alerting user is optional, but sticking to console to avoid scaring them if online save works
                                }

                                // 2. Save to Google Sheets (Test Environment)
                                try {
                                    const res = await fetch('/api/inventory/save', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(receptionData)
                                    });
                                    if (!res.ok) throw new Error('Failed to save to sheet');
                                } catch (error) {
                                    console.error("Sheet Save Error:", error);
                                    alert("⚠️ Se guardó localmente pero hubo error al escribir en Google Sheets.");
                                }

                                // Success feedback
                                alert("✅ Recepción guardada correctamente.");

                                // Reset form
                                window.location.reload();
                            } else {
                                nextStep();
                            }
                        }}
                        className="flex-[2] py-4 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-500 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {currentStep === STEPS.length - 1 ? 'Finalizar Orden' : 'Continuar'}
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div >
    );
}
