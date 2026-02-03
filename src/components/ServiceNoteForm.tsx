"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { Plus, Trash2, FileText, Save, Car, User, Search, Eye, History, X, Clock, ArrowUp, ArrowDown } from "lucide-react";

import CatalogSearch from './CatalogSearch';
import { ServiceItem, ClientInfo, VehicleInfo } from "@/types/service-note";
import { COMPANY_DEFAULTS } from "@/lib/constants";

const TUNEUP_KIT_PARTS = [
    { description: "Filtro de aire", price: 0 },
    { description: "Filtro de cabina (aire acondicionado)", price: 0 },
    { description: "Filtro de combustible", price: 0 },
    { description: "Spray cuerpo de aceleración", price: 280 },
    { description: "Líquido limpieza de inyectores", price: 290 },
    { description: "Filtro de aceite", price: 0 },
    { description: "Garrafa de aceite lavado interno de motor", price: 398.50 },
    { description: "Garrafa de aceite para motor", price: 1240 },
    { description: "Materiales diversos, consumibles y artículos de limpieza", price: 0 },
    { description: "Juego de bujías", price: 0 }
];

export default function ServiceNoteForm() {
    const [client, setClient] = useState<ClientInfo>({
        name: "",
        address: "",
        phone: "",
        email: "",
    });

    const [folio, setFolio] = useState("");
    const [isLoadingFolio, setIsLoadingFolio] = useState(false);

    const loadNextFolio = async () => {
        setIsLoadingFolio(true);
        try {
            const res = await fetch("/api/notes/last-folio");
            const data = await res.json();
            const next = (parseInt(data.lastFolio) + 1).toString().padStart(5, '0');
            setFolio(next);
        } catch (e) {
            console.error("Error loading folio", e);
        } finally {
            setIsLoadingFolio(false);
        }
    };

    const [vehicle, setVehicle] = useState<VehicleInfo>({
        brand: "",
        model: "",
        year: "",
        plates: "",
        vin: "",
        engine: "",
        odometer: 0,
    });

    const [includeIva, setIncludeIva] = useState(false);
    const [includeIsr, setIncludeIsr] = useState(false);
    const [isDiagnostic, setIsDiagnostic] = useState(false);
    const [services, setServices] = useState<ServiceItem[]>([
        { id: "1", description: "", laborCost: 0, partsCost: 0 },
    ]);
    const [parts, setParts] = useState<ServiceItem[]>([
        { id: "1", description: "", laborCost: 0, partsCost: 0, quantity: 1 },
    ]);
    const [notes, setNotes] = useState("");
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);

    const [suggestions, setSuggestions] = useState<string[]>([]);

    // History / Template State
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [recentNotes, setRecentNotes] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Reordering Helpers
    const moveService = (index: number, direction: 'up' | 'down') => {
        const newServices = [...services];
        if (direction === 'up' && index > 0) {
            [newServices[index], newServices[index - 1]] = [newServices[index - 1], newServices[index]];
        } else if (direction === 'down' && index < newServices.length - 1) {
            [newServices[index], newServices[index + 1]] = [newServices[index + 1], newServices[index]];
        }
        setServices(newServices);
    };

    const movePart = (index: number, direction: 'up' | 'down') => {
        const newParts = [...parts];
        if (direction === 'up' && index > 0) {
            [newParts[index], newParts[index - 1]] = [newParts[index - 1], newParts[index]];
        } else if (direction === 'down' && index < newParts.length - 1) {
            [newParts[index], newParts[index + 1]] = [newParts[index + 1], newParts[index]];
        }
        setParts(newParts);
    };

    const [activeTab, setActiveTab] = useState<'remote' | 'local'>('remote');
    const [localDrafts, setLocalDrafts] = useState<any[]>([]);

    const loadRecentNotes = async () => {
        setIsLoadingHistory(true);
        // Load Remote History
        try {
            const res = await fetch("/api/notes/recent");
            const data = await res.json();
            if (data.templates) {
                setRecentNotes(data.templates);
            }
        } catch (error) {
            console.error("Error loading history:", error);
        }

        // Load Local Drafts
        try {
            const drafts: any[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith("service-note-draft-")) {
                    try {
                        const raw = localStorage.getItem(key);
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            const id = key.replace("service-note-draft-", "");
                            // Basic validation that it has content
                            if (parsed.client?.name || parsed.vehicle?.plates || parsed.services?.[0]?.description) {
                                drafts.push({
                                    id,
                                    ...parsed,
                                    timestamp: Date.now() // Ideally we would save timestamp in draft, but for now just list them
                                    // TODO: Add timestamp to draft structure in future
                                });
                            }
                        }
                    } catch (e) { console.error("Bad draft", key); }
                }
            }
            // Sort by ID (usually chronological if using timestamp based IDs, but ours are random+time)
            setLocalDrafts(drafts);
        } catch (e) {
            console.error("Error loading local drafts", e);
        }

        setIsLoadingHistory(false);
    };

    const deleteDraft = (id: string) => {
        if (!confirm("¿Eliminar este borrador permanentemente?")) return;
        localStorage.removeItem(`service-note-draft-${id}`);
        setLocalDrafts(prev => prev.filter(d => d.id !== id));
    };

    const applyTemplate = (note: any, asTemplate: boolean) => {
        const action = asTemplate ? "usar como plantilla (generará nuevo folio)" : "modificar (sobrescribirá esta nota)";
        if (!confirm(`¿Estás seguro de ${action} la nota ${note.folio}?`)) return;

        const data = note.data;
        // Check for rawData (preserved info with variables) or fallback to standard data
        const sourceData = data.rawData || data;

        if (sourceData.client && !asTemplate) setClient(sourceData.client);
        if (asTemplate && data.client) setClient(data.client);

        if (sourceData.vehicle) setVehicle(sourceData.vehicle);

        // Map services to ensure legacy notes without 'serviceName' work too
        if (sourceData.services) {
            setServices(sourceData.services.map((s: any) => ({
                ...s,
                serviceName: s.serviceName || s.description // Fallback for old notes
            })));
        }

        if (sourceData.parts) setParts(sourceData.parts);
        if (sourceData.notes) setNotes(sourceData.notes);
        if (data.includeIva !== undefined) setIncludeIva(data.includeIva);
        if (data.includeIsr !== undefined) setIncludeIsr(data.includeIsr);

        if (asTemplate) {
            // Reset Folio to next available
            loadNextFolio();
        } else {
            // Set Folio to the note's folio for modification
            setFolio(note.folio);
        }

        setIsHistoryOpen(false);
    };

    const [draftId, setDraftId] = useState<string>("");

    useEffect(() => {
        // 1. Resolve Draft ID from URL or Create New
        const params = new URLSearchParams(window.location.search);
        let currentId = params.get("draftId");

        if (!currentId) {
            currentId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            // Update URL without reload
            const newUrl = `${window.location.pathname}?draftId=${currentId}`;
            window.history.replaceState({ path: newUrl }, '', newUrl);
        }

        setDraftId(currentId);

        // 2. Load Specific Draft
        const savedDraft = localStorage.getItem(`service-note-draft-${currentId}`);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setClient(parsed.client || client);
                setVehicle(parsed.vehicle || vehicle);
                setServices(parsed.services || services);
                setParts(parsed.parts || parts);
                setNotes(parsed.notes || "");
                setIncludeIva(parsed.includeIva || false);
                setIncludeIsr(parsed.includeIsr || false);
                setIsDiagnostic(parsed.isDiagnostic || false);
                // Draft doesn't save folio usually, so we load next one
            } catch (e) {
                console.error("Error loading draft", e);
            }
        } else {
            // Backward compatibility: Check safely for old global draft
            // Only if this is a NEW draft session (no draftId was in URL originally)
            // But to be safe and clean, let's just ignore the old global key to avoid confusion
            // unless user explicitly wants to migrate. For now, fresh start is safer.
        }

        // Always load next folio on mount
        loadNextFolio();

        setIsDraftLoaded(true);
    }, []); // Run once on mount

    // Multi-Tab Safe Auto-Save
    useEffect(() => {
        if (!isDraftLoaded || !draftId) return;
        const draft = {
            client,
            vehicle,
            services,
            parts,
            notes,
            includeIva,
            includeIsr,
            isDiagnostic
        };
        localStorage.setItem(`service-note-draft-${draftId}`, JSON.stringify(draft));
    }, [client, vehicle, services, parts, notes, includeIva, includeIsr, isDiagnostic, isDraftLoaded, draftId]);

    const handleClearForm = () => {
        if (!confirm("¿Estás seguro de borrar toda la información y empezar de cero?")) return;

        // Reset States
        setClient({ name: "", address: "", phone: "", email: "" });
        setVehicle({ brand: "", model: "", year: "", plates: "", vin: "", engine: "", odometer: 0 });
        setServices([{ id: Date.now().toString(), description: "", laborCost: 0, partsCost: 0 }]);
        setParts([{ id: Date.now().toString(), description: "", laborCost: 0, partsCost: 0, quantity: 1 }]);
        setNotes("");
        setIncludeIva(false);
        setIncludeIsr(false);
        setIsDiagnostic(false);

        // Clear CURRENT Draft Storage
        if (draftId) {
            localStorage.removeItem(`service-note-draft-${draftId}`);
        }

        // Generate NEW Draft ID (Fresh Session)
        const newId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        setDraftId(newId);
        const newUrl = `${window.location.pathname}?draftId=${newId}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);

        // Reload Folio
        loadNextFolio();
    };

    const addService = () => {
        setServices([
            ...services,
            { id: Date.now().toString(), description: "", laborCost: 0, partsCost: 0 },
        ]);
    };

    const removeService = (id: string) => {
        if (!confirm("¿Seguro que quieres borrar este servicio?")) return;
        setServices(services.filter((s) => s.id !== id));
    };

    const updateService = (id: string, field: keyof ServiceItem, value: string | number | boolean | undefined) => {
        setServices(prev =>
            prev.map((s) =>
                s.id === id ? { ...s, [field]: value } : s
            )
        );
    };

    const addPart = () => {
        setParts([
            ...parts,
            { id: Date.now().toString(), description: "", laborCost: 0, partsCost: 0, quantity: 1 },
        ]);
    };

    const removePart = (id: string) => {
        if (!confirm("¿Seguro que quieres borrar esta refacción?")) return;
        setParts(parts.filter((p) => p.id !== id));
    };

    const updatePart = (id: string, field: keyof ServiceItem, value: string | number | boolean | undefined) => {
        setParts(prev =>
            prev.map((p) =>
                p.id === id ? { ...p, [field]: value } : p
            )
        );
    };

    const loadTuneupKit = () => {
        if (!confirm("¿Agregar paquete de refacciones para afinación?")) return;
        const newParts = TUNEUP_KIT_PARTS.map((item, index) => ({
            id: (Date.now() + index).toString(),
            description: item.description,
            laborCost: 0,
            partsCost: item.price, // Pre-filled price
            quantity: 1
        }));
        // Filter out empty initial part if it hasn't been touched
        const currentParts = parts.filter(p => p.description !== "" || p.partsCost !== 0);
        setParts([...currentParts, ...newParts]);
    };

    const servicesTotal = services.reduce((sum, s) => sum + (s.laborCost || 0), 0);
    const partsTotal = parts.reduce((sum, p) => sum + (p.partsCost || 0), 0);
    const subtotal = servicesTotal + partsTotal;
    const totalIva = includeIva ? subtotal * 0.16 : 0;
    const totalIsr = includeIsr ? subtotal * 0.0125 : 0;
    const total = subtotal + totalIva - totalIsr;

    const [isSearching, setIsSearching] = useState(false);

    const [searchError, setSearchError] = useState<string | null>(null);

    // Function to search vehicle by plate
    const searchPlate = async (plate: string) => {
        if (plate.length < 5) return; // Basic validation
        setSearchError(null); // Clear previous errors
        setIsSearching(true);
        try {
            const res = await fetch(`/api/vehicle/lookup?plate=${encodeURIComponent(plate)}`);
            if (res.ok) {
                const data = await res.json();
                setClient(prev => ({ ...prev, ...data.client }));
                setVehicle(prev => ({ ...prev, ...data.vehicle }));
                setSearchError(null);
            } else {
                setSearchError("Vehículo no encontrado.");
                // Removed alert logic to prevent infinite loop onBlur
            }
        } catch (error) {
            console.error("Error searching plate:", error);
            setSearchError("Error de conexión.");
        } finally {
            setIsSearching(false);
        }
    };

    const handlePlateChange = (e: ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.toUpperCase();
        setVehicle({ ...vehicle, plates: newValue });
    };

    const [isSaving, setIsSaving] = useState(false);

    // Helper to build the preview URL
    const buildPreviewUrl = (customFolio: string, customDate: string) => {
        // Resolve variables for preview
        const resolveText = (text: string) => {
            if (!text) return "";
            let resolved = text;
            resolved = resolved.replace(/{cliente}/gi, client.name || "");
            resolved = resolved.replace(/{vehiculo}/gi, `${vehicle.brand} ${vehicle.model}`.trim() || "");
            resolved = resolved.replace(/{placas}/gi, vehicle.plates || "");
            resolved = resolved.replace(/{km}/gi, vehicle.odometer?.toString() || "");
            resolved = resolved.replace(/{fecha}/gi, customDate);
            return resolved;
        };

        const resolvedServices = services.map(s => ({ ...s, description: resolveText(s.description) }));
        const resolvedParts = parts.map(p => ({ ...p, description: resolveText(p.description) }));
        const resolvedNotes = resolveText(notes);

        const params = new URLSearchParams();
        params.set("client", JSON.stringify(client));
        params.set("vehicle", JSON.stringify(vehicle));
        params.set("services", JSON.stringify(resolvedServices));
        params.set("parts", JSON.stringify(resolvedParts));
        if (resolvedNotes) params.set("notes", resolvedNotes);
        params.set("company", JSON.stringify(COMPANY_DEFAULTS));
        params.set("folio", customFolio);
        params.set("includeIva", includeIva.toString());
        params.set("includeIsr", includeIsr.toString());
        params.set("isDiagnostic", isDiagnostic.toString());
        params.set("date", customDate);
        return `/note-preview?${params.toString()}`;
    };

    const handlePreview = () => {
        if (!client.name || !vehicle.plates) {
            setSearchError("Por favor complete Cliente y Placas para previsualizar."); // Reuse search error location or just fallback to reusing alert? 
            // Better UX: just alert for now as validation failsafe
            alert("Por favor complete los campos obligatorios (Cliente, Placas) para previsualizar.");
            return;
        }

        // Generate current date
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const currentDate = `${year}-${month}-${day}`; // ISO format for template consistent parsing

        const url = buildPreviewUrl("BORRADOR", currentDate);
        window.open(url, '_blank');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!client.name || !vehicle.plates) {
            alert("Por favor complete los campos obligatorios (Cliente, Placas)");
            return;
        }

        if (!confirm(`¿Estás seguro de generar esta nota? Se guardará con el folio ${folio || "auto-generado"}.`)) {
            return;
        }

        const newWindow = window.open('', '_blank');

        setIsSaving(true);
        // Use YYYY-MM-DD format based on local time to avoid ambiguity
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const currentDate = `${year}-${month}-${day}`; // ISO Format

        try {
            // Helper to resolve variables
            const resolveText = (text: string) => {
                if (!text) return "";
                let resolved = text;
                resolved = resolved.replace(/{cliente}/gi, client.name || "");
                resolved = resolved.replace(/{vehiculo}/gi, `${vehicle.brand} ${vehicle.model}`.trim() || "");
                resolved = resolved.replace(/{placas}/gi, vehicle.plates || "");
                resolved = resolved.replace(/{km}/gi, vehicle.odometer?.toString() || "");
                resolved = resolved.replace(/{fecha}/gi, currentDate);
                return resolved;
            };

            const resolvedServices = services.map(s => ({
                ...s,
                description: resolveText(s.description)
            }));

            const resolvedParts = parts.map(p => ({
                ...p,
                description: resolveText(p.description)
            }));

            const resolvedNotes = resolveText(notes);

            // 1. Save to Google Sheets (Master)
            // We send 'resolved' data for the columns/PDF, but 'raw' data for the Metadata (Templates)
            const saveRes = await fetch("/api/notes/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    folio: folio === "" ? undefined : folio,
                    client,
                    vehicle,
                    services: resolvedServices, // Resolved for columns/PDF
                    parts: resolvedParts,     // Resolved for columns/PDF
                    notes: resolvedNotes,     // Resolved for columns/PDF
                    company: COMPANY_DEFAULTS,
                    includeIva,
                    includeIsr,
                    isDiagnostic,
                    date: currentDate,
                    // Preserve raw data for templates (so {cliente} persists in history)
                    rawData: {
                        services,
                        parts,
                        notes
                    }
                })
            });

            if (!saveRes.ok) throw new Error("Error guardando la nota");

            const saveData = await saveRes.json();
            const newFolio = saveData.folio;

            // 2. Redirect to Preview with new Folio
            const url = buildPreviewUrl(newFolio, currentDate);

            if (newWindow) {
                newWindow.location.href = url;
            } else {
                window.location.href = url; // Fallback
            }

        } catch (error) {
            console.error(error);
            alert("Hubo un error al guardar la nota. Intente de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-8 bg-white rounded-xl shadow-xl border border-gray-100 text-gray-900">
            <div className="flex justify-between items-center mb-10 border-b pb-6 text-gray-900">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-[#F37014] rounded-xl text-white shadow-lg shadow-[#F37014]/20">
                        <FileText size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Nueva Nota de Servicio</h2>
                        <p className="text-gray-500">CarMD Premium Service</p>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-end">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Folio (Orden)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-400 font-mono text-lg">#</span>
                            <input
                                type="text"
                                value={folio}
                                onChange={(e) => setFolio(e.target.value)}
                                className="w-32 pl-7 p-2 border border-gray-200 rounded-lg font-mono text-lg font-bold text-[#F37014] focus:ring-2 focus:ring-[#F37014] outline-none text-center bg-gray-50"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => { setIsHistoryOpen(true); loadRecentNotes(); }}
                        className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium border border-blue-200 h-full"
                    >
                        <History size={18} />
                        <span>Historial</span>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Client Section */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-gray-900">
                    <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold text-lg">
                        <User className="text-[#F37014]" size={20} />
                        <h3>Datos del Cliente</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Nombre Completo</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900"
                                value={client.name}
                                onChange={(e) => setClient({ ...client, name: e.target.value })}
                                placeholder="Ej. Jorge Ponce"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Teléfono</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900"
                                value={client.phone}
                                onChange={(e) => setClient({ ...client, phone: e.target.value })}
                                placeholder="Ej. 55 5555 5555"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Dirección</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900"
                                value={client.address}
                                onChange={(e) => setClient({ ...client, address: e.target.value })}
                                placeholder="Calle, Número, Colonia, Ciudad"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900"
                                value={client.email}
                                onChange={(e) => setClient({ ...client, email: e.target.value })}
                                placeholder="cliente@email.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Vehicle Section */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-gray-900">
                    <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold text-lg">
                        <Car className="text-[#F37014]" size={20} />
                        <h3>Datos del Vehículo</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Marca</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900"
                                value={vehicle.brand}
                                onChange={(e) => setVehicle({ ...vehicle, brand: e.target.value })}
                                placeholder="Ej. Ford"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Modelo</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900"
                                value={vehicle.model}
                                onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
                                placeholder="Ej. Explorer"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Año</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900"
                                value={vehicle.year}
                                onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
                                placeholder="Ej. 2017"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Placas</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900 uppercase pr-10"
                                    value={vehicle.plates}
                                    onChange={handlePlateChange}
                                    onBlur={() => searchPlate(vehicle.plates)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchPlate(vehicle.plates))}
                                    placeholder="Ej. LKN507A"
                                />
                                <div className="absolute right-3 top-3 text-gray-400">
                                    {isSearching ? (
                                        <div className="animate-spin h-5 w-5 border-2 border-[#F37014] border-t-transparent rounded-full text-gray-900"></div>
                                    ) : (
                                        <Search size={20} className="cursor-pointer hover:text-[#F37014]" onClick={() => searchPlate(vehicle.plates)} />
                                    )}
                                </div>
                            </div>
                            {searchError && (
                                <p className="text-xs text-red-500 mt-1 pl-1">{searchError}</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">VIN / Serie</label>
                        <input
                            type="text"
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900 uppercase"
                            value={vehicle.vin}
                            onChange={(e) => setVehicle({ ...vehicle, vin: e.target.value })}
                            placeholder="17 Dígitos"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Motor</label>
                        <input
                            type="text"
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900"
                            value={vehicle.engine}
                            onChange={(e) => setVehicle({ ...vehicle, engine: e.target.value })}
                            placeholder="Ej. V6 3.5L"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Kilometraje</label>
                        <input
                            type="number"
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900"
                            value={vehicle.odometer || ""}
                            onChange={(e) => setVehicle({ ...vehicle, odometer: parseInt(e.target.value) || 0 })}
                            placeholder="Ej. 173141"
                        />
                    </div>
                </div>

                {/* Services Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2 text-gray-900">
                        <h3 className="text-lg font-semibold text-gray-800">Servicios (Mano de Obra)</h3>
                        <button
                            type="button"
                            onClick={addService}
                            className="flex items-center gap-2 text-sm text-[#F37014] hover:text-orange-700 font-medium px-3 py-1.5 rounded-md hover:bg-orange-50 transition-colors"
                        >
                            <Plus size={16} />
                            Agregar Servicio
                        </button>
                    </div>

                    <div className="space-y-4">
                        {services.map((service, index) => (
                            <div key={service.id} className="flex gap-4 items-start group bg-white p-4 border border-gray-200 rounded-lg hover:border-[#F37014]/50 transition-colors shadow-sm text-gray-900">
                                <div className="flex-1 space-y-3">
                                    {/* Service Search & Description */}
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Servicio</span>
                                        <CatalogSearch
                                            type="servicios"
                                            placeholder="Buscar servicio..."
                                            onSelect={(item) => {
                                                updateService(service.id, "description", item.descripcion);
                                                updateService(service.id, "serviceName", item.nombre); // Store Catalog Name persistence
                                                if (item.costo_sugerido > 0) {
                                                    updateService(service.id, "laborCost", item.costo_sugerido);
                                                }
                                            }}
                                        />
                                        <div className="mt-1 flex justify-end">
                                            <a href="/catalog" target="_blank" className="text-[10px] uppercase font-bold text-[#F37014] hover:underline flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                                ⚙️ Gestionar Catálogo
                                            </a>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Descripción</span>
                                        <textarea
                                            placeholder="Descripción detallada del servicio..."
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-sm text-gray-900 min-h-[50px]"
                                            value={service.description}
                                            onChange={(e) => updateService(service.id, "description", e.target.value)}
                                            spellCheck={true}
                                        />
                                    </div>
                                </div>
                                <div className="w-40 space-y-2">
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Costo</span>
                                        <div className="relative">
                                            <span className="absolute left-2 top-2.5 text-slate-400 text-xs">$</span>
                                            <input
                                                type="number"
                                                placeholder=""
                                                className="w-full p-2 pl-5 border border-slate-200 rounded focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900 text-right font-mono text-sm"
                                                value={service.laborCost === undefined ? "" : service.laborCost}
                                                onChange={(e) => updateService(service.id, "laborCost", e.target.value === "" ? undefined : parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-1 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => moveService(index, 'up')}
                                            disabled={index === 0}
                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors flex-1 flex justify-center disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                            title="Mover arriba"
                                        >
                                            <ArrowUp size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveService(index, 'down')}
                                            disabled={index === services.length - 1}
                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors flex-1 flex justify-center disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                            title="Mover abajo"
                                        >
                                            <ArrowDown size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeService(service.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-1 flex justify-center"
                                            title="Eliminar servicio"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Parts Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2 text-gray-900">
                        <h3 className="text-lg font-semibold text-gray-800">Refacciones</h3>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={loadTuneupKit}
                                className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium px-3 py-1.5 rounded-md hover:bg-purple-50 transition-colors border border-purple-100"
                                title="Cargar lista estándar de afinación"
                            >
                                📦 Kit Afinación
                            </button>
                            <button
                                type="button"
                                onClick={addPart}
                                className="flex items-center gap-2 text-sm text-[#F37014] hover:text-orange-700 font-medium px-3 py-1.5 rounded-md hover:bg-orange-50 transition-colors"
                            >
                                <Plus size={16} />
                                Agregar Refacción
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {parts.map((part, index) => (
                            <div key={part.id} className="flex gap-4 items-start group bg-white p-4 border border-gray-200 rounded-lg hover:border-[#F37014]/50 transition-colors shadow-sm text-gray-900">
                                <div className="flex gap-2 w-full">
                                    <div className="w-16 space-y-1">
                                        <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Cant.</span>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="1"
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900 text-sm font-mono text-center"
                                            value={part.quantity !== undefined ? part.quantity : ""}
                                            onChange={(e) => updatePart(part.id, "quantity", e.target.value === "" ? 0 : parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Refacción</span>
                                        <CatalogSearch
                                            type="refacciones"
                                            placeholder="Buscar refacción..."
                                            onSelect={(item) => {
                                                updatePart(part.id, "description", item.nombre);
                                                updatePart(part.id, "serviceName", item.nombre); // Store persistence
                                                if (item.costo_sugerido > 0) {
                                                    updatePart(part.id, "partsCost", item.costo_sugerido);
                                                }
                                            }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Nombre de la refacción..."
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900 text-sm"
                                            value={part.description}
                                            onChange={(e) => updatePart(part.id, "description", e.target.value)}
                                            spellCheck={true}
                                        />
                                    </div>
                                </div>
                                <div className="w-40 space-y-2">
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Costo Unit.</span>
                                        <div className="relative">
                                            <span className="absolute left-2 top-2.5 text-slate-400 text-xs">$</span>
                                            <input
                                                type="number"
                                                placeholder=""
                                                className="w-full p-2 pl-5 border border-slate-200 rounded focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900 text-right font-mono text-sm"
                                                value={part.partsCost === undefined ? "" : part.partsCost}
                                                onChange={(e) => updatePart(part.id, "partsCost", e.target.value === "" ? undefined : parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-1 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => movePart(index, 'up')}
                                            disabled={index === 0}
                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors flex-1 flex justify-center disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                            title="Mover arriba"
                                        >
                                            <ArrowUp size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => movePart(index, 'down')}
                                            disabled={index === parts.length - 1}
                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors flex-1 flex justify-center disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                            title="Mover abajo"
                                        >
                                            <ArrowDown size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removePart(part.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-1 flex justify-center"
                                            title="Eliminar refacción"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notes Section */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-gray-900">
                    <div className="flex items-center gap-2 mb-4 text-gray-800 font-semibold text-lg">
                        <FileText className="text-[#F37014]" size={20} />
                        <h3>Observaciones Generales (Opcional)</h3>
                    </div>
                    <textarea
                        placeholder="Escribe notas adicionales aquí... (Usa **negritas** para resaltar texto)"
                        className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900 h-24"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        spellCheck={true}
                    />
                </div>

                {/* Variable Tokens Hint */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm md:flex md:items-center md:justify-between text-blue-800">
                    <div className="flex items-center gap-2 mb-2 md:mb-0">
                        <span className="font-bold">💡 Tip:</span>
                        <span>Puedes usar "variables" que se llenan solas:</span>
                    </div>
                    <div className="flex flex-wrap gap-2 font-mono text-xs">
                        <span className="px-2 py-1 bg-white rounded border border-blue-200" title="Nombre del Cliente">{'{cliente}'}</span>
                        <span className="px-2 py-1 bg-white rounded border border-blue-200" title="Marca y Modelo">{'{vehiculo}'}</span>
                        <span className="px-2 py-1 bg-white rounded border border-blue-200" title="Placas">{'{placas}'}</span>
                        <span className="px-2 py-1 bg-white rounded border border-blue-200" title="Kilometraje">{'{km}'}</span>
                        <span className="px-2 py-1 bg-white rounded border border-blue-200" title="Fecha">{'{fecha}'}</span>
                    </div>
                </div>

                {/* Totals Section */}
                <div className="border-t pt-6 flex justify-end text-gray-900">
                    <div className="w-72 space-y-3">
                        <div className="flex justify-between text-gray-600">
                            <span>Mano de Obra</span>
                            <span>${servicesTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Refacciones</span>
                            <span>${partsTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 font-semibold border-t border-dashed pt-2 text-gray-900">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-600">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="global-iva"
                                    checked={includeIva}
                                    onChange={(e) => setIncludeIva(e.target.checked)}
                                    className="w-4 h-4 text-[#F37014] rounded border-gray-300 focus:ring-[#F37014] text-gray-900"
                                />
                                <label htmlFor="global-iva" className="text-sm cursor-pointer select-none">
                                    IVA (16%)
                                </label>
                            </div>
                            <span>${totalIva.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-600">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="global-isr"
                                    checked={includeIsr}
                                    onChange={(e) => setIncludeIsr(e.target.checked)}
                                    className="w-4 h-4 text-[#F37014] rounded border-gray-300 focus:ring-[#F37014] text-gray-900"
                                />
                                <label htmlFor="global-isr" className="text-sm cursor-pointer select-none">
                                    Retención I.S.R.
                                </label>
                            </div>
                            <span>${totalIsr.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-600">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is-diagnostic"
                                    checked={isDiagnostic}
                                    onChange={(e) => setIsDiagnostic(e.target.checked)}
                                    className="w-4 h-4 text-[#F37014] rounded border-gray-300 focus:ring-[#F37014] text-gray-900"
                                />
                                <label htmlFor="is-diagnostic" className="text-sm cursor-pointer select-none">
                                    Es Diagnóstico (oculta refacciones y garantías)
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-between text-2xl font-bold text-gray-900 border-t pt-4">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-8 border-t text-gray-900 mt-6">
                    <button
                        type="button"
                        onClick={handleClearForm}
                        className="flex items-center gap-2 px-6 py-3 text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Borrar todo y empezar de cero"
                    >
                        <Trash2 size={20} />
                        Borrar Todo
                    </button>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={handlePreview}
                            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                            title="Ver cómo quedará sin guardar"
                        >
                            <Eye size={20} />
                            Previsualizar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-6 py-3 bg-[#F37014] hover:bg-orange-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-orange-500/20 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Save size={20} />
                            {isSaving ? "Guardando..." : "Generar Nota PDF"}
                        </button>
                    </div>
                </div>
            </form>

            {/* History Modal */}
            {isHistoryOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <History className="text-[#F37014]" />
                                Historial y Borradores
                            </h2>
                            <button onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b">
                            <button
                                className={`flex-1 py-3 text-sm font-bold ${!activeTab || activeTab === 'remote' ? 'text-[#F37014] border-b-2 border-[#F37014] bg-orange-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                                onClick={() => setActiveTab('remote')}
                            >
                                Notas Guardadas (Excel)
                            </button>
                            <button
                                className={`flex-1 py-3 text-sm font-bold ${activeTab === 'local' ? 'text-[#F37014] border-b-2 border-[#F37014] bg-orange-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                                onClick={() => setActiveTab('local')}
                            >
                                Borradores Locales
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                            {/* REMOTE NOTES TAB */}
                            {(!activeTab || activeTab === 'remote') && (
                                <>
                                    {isLoadingHistory ? (
                                        <div className="text-center py-8 text-gray-500">Cargando historial...</div>
                                    ) : recentNotes.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            No se encontraron notas recientes.
                                        </div>
                                    ) : (
                                        recentNotes.map((note) => {
                                            const serviceSummary = note.data?.services?.map((s: any) => s.serviceName || s.description).slice(0, 2).join(", ") + (note.data?.services?.length > 2 ? "..." : "") || "Sin servicios";

                                            return (
                                                <div key={note.folio} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-mono font-bold text-[#F37014]">{note.folio}</span>
                                                                <span className="text-gray-300">|</span>
                                                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                                                    <Clock size={12} />
                                                                    {note.date}
                                                                </span>
                                                            </div>
                                                            <h3 className="font-bold text-gray-800">{note.client}</h3>
                                                            <p className="text-sm text-gray-600 truncate max-w-md mb-1">{note.vehicle}</p>
                                                            <p className="text-xs text-gray-400 italic truncate max-w-md border-t pt-1 mt-1">
                                                                {serviceSummary}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 border-t pt-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => applyTemplate(note, true)}
                                                            className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium text-sm border border-blue-200 transition-colors flex justify-center items-center gap-1"
                                                            title="Crea una nota nueva usando estos datos"
                                                        >
                                                            <FileText size={14} />
                                                            Usar Plantilla
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => applyTemplate(note, false)}
                                                            className="flex-1 px-3 py-2 bg-orange-50 text-[#F37014] rounded-lg hover:bg-orange-100 font-medium text-sm border border-orange-200 transition-colors flex justify-center items-center gap-1"
                                                            title="Edita esta nota manteniendo el mismo folio"
                                                        >
                                                            <Save size={14} />
                                                            Modificar
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </>
                            )}

                            {/* LOCAL DRAFTS TAB */}
                            {activeTab === 'local' && (
                                <>
                                    {localDrafts.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            No hay borradores guardados en este dispositivo.
                                        </div>
                                    ) : (
                                        localDrafts.map((draft) => (
                                            <div key={draft.id} className={`bg-white p-4 rounded-lg border shadow-sm transition-all flex flex-col gap-3 ${draft.id === draftId ? 'border-green-400 ring-1 ring-green-100' : 'border-gray-200 hover:border-gray-300'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">ID: {draft.id.substr(0, 8)}...</span>
                                                            {draft.id === draftId && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">ACTIVO</span>}
                                                            <span className="text-gray-300">|</span>
                                                            <span className="text-sm text-gray-500">
                                                                {new Date(parseInt(draft.timestamp || 0)).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <h3 className="font-bold text-gray-800">{draft.client?.name || "Sin Nombre"}</h3>
                                                        <p className="text-sm text-gray-600">{draft.vehicle?.brand} {draft.vehicle?.model} - {draft.vehicle?.plates}</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 border-t pt-3">
                                                    <button
                                                        type="button"
                                                        disabled={draft.id === draftId}
                                                        onClick={() => {
                                                            if (confirm("Se recargará la página para recuperar este borrador. ¿Continuar?")) {
                                                                window.location.href = `?draftId=${draft.id}`;
                                                            }
                                                        }}
                                                        className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm border transition-colors flex justify-center items-center gap-1 ${draft.id === draftId ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}
                                                    >
                                                        <FileText size={14} />
                                                        {draft.id === draftId ? "Editando..." : "Recuperar"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => deleteDraft(draft.id)}
                                                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium text-sm border border-red-200 transition-colors flex justify-center items-center gap-1"
                                                        title="Eliminar este borrador para siempre"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </>
                            )}
                        </div>

                        <div className="p-4 border-t bg-gray-50 rounded-b-xl">
                            <p className="text-xs text-gray-500 text-center">
                                {activeTab === 'local'
                                    ? "Los borradores se guardan solo en este navegador. Si borras el caché, se perderán."
                                    : "Se cargarán todos los servicios, refacciones y datos del vehículo."
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <datalist id="service-suggestions">
                {suggestions.map((suggestion, index) => (
                    <option key={index} value={suggestion} />
                ))}
            </datalist>
        </div >
    );
}
