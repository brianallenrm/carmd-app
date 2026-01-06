"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { Plus, Trash2, FileText, Save, Car, User, Search } from "lucide-react";
import CatalogSearch from './CatalogSearch';
import { ServiceItem, ClientInfo, VehicleInfo } from "@/types/service-note";
import { COMPANY_DEFAULTS } from "@/lib/constants";

export default function ServiceNoteForm() {
    const [client, setClient] = useState<ClientInfo>({
        name: "",
        address: "",
        phone: "",
        email: "",
    });

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
    const [services, setServices] = useState<ServiceItem[]>([
        { id: "1", description: "", laborCost: 0, partsCost: 0 },
    ]);
    const [parts, setParts] = useState<ServiceItem[]>([
        { id: "1", description: "", laborCost: 0, partsCost: 0, quantity: 1 },
    ]);
    const [notes, setNotes] = useState("");

    const [suggestions, setSuggestions] = useState<string[]>([]);

    useEffect(() => {
        // Load suggestions from history
        fetch('/api/services/history')
            .then(res => res.json())
            .then(data => {
                if (data.services) setSuggestions(data.services);
            })
            .catch(err => console.error("Failed to load suggestions", err));
    }, []);

    const addService = () => {
        setServices([
            ...services,
            { id: Date.now().toString(), description: "", laborCost: 0, partsCost: 0 },
        ]);
    };

    const removeService = (id: string) => {
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
        setParts(parts.filter((p) => p.id !== id));
    };

    const updatePart = (id: string, field: keyof ServiceItem, value: string | number | boolean | undefined) => {
        setParts(prev =>
            prev.map((p) =>
                p.id === id ? { ...p, [field]: value } : p
            )
        );
    };

    const servicesTotal = services.reduce((sum, s) => sum + (s.laborCost || 0), 0);
    const partsTotal = parts.reduce((sum, p) => sum + ((p.partsCost || 0) * (p.quantity || 1)), 0);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!client.name || !vehicle.plates) {
            alert("Por favor complete los campos obligatorios (Cliente, Placas)");
            return;
        }

        const newWindow = window.open('', '_blank');

        setIsSaving(true);
        // Use YYYY-MM-DD format based on local time to avoid ambiguity
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const currentDate = `${year}-${month}-${day}`;

        try {
            // 1. Save to Google Sheets (Master)
            const saveRes = await fetch("/api/notes/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client,
                    vehicle,
                    services,
                    parts,
                    notes, // Add notes
                    company: COMPANY_DEFAULTS,
                    includeIva,
                    includeIsr,
                    date: currentDate
                })
            });

            if (!saveRes.ok) throw new Error("Error guardando la nota");

            const saveData = await saveRes.json();
            const newFolio = saveData.folio;

            // 2. Redirect to Preview with new Folio
            const params = new URLSearchParams();
            params.set("client", JSON.stringify(client));
            params.set("vehicle", JSON.stringify(vehicle));
            params.set("services", JSON.stringify(services));
            params.set("parts", JSON.stringify(parts));
            if (notes) params.set("notes", notes); // Pass notes
            params.set("company", JSON.stringify(COMPANY_DEFAULTS));
            params.set("folio", newFolio); // Use Real Folio
            params.set("includeIva", includeIva.toString());
            params.set("includeIsr", includeIsr.toString());
            params.set("date", currentDate);

            const url = `/note-preview?${params.toString()}`;

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
            <div className="flex items-center gap-4 mb-10 border-b pb-6 text-gray-900">
                <div className="p-4 bg-[#F37014] rounded-xl text-white shadow-lg shadow-[#F37014]/20">
                    <FileText size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Nueva Nota de Servicio</h2>
                    <p className="text-gray-500">CarMD Premium Service</p>
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
                        {services.map((service) => (
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
                                                if (item.costo_sugerido > 0) {
                                                    updateService(service.id, "laborCost", item.costo_sugerido);
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Descripción</span>
                                        <textarea
                                            placeholder="Descripción detallada del servicio..."
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-sm text-gray-900 uppercase min-h-[50px]"
                                            value={service.description}
                                            onChange={(e) => updateService(service.id, "description", e.target.value)}
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
                                    <button
                                        type="button"
                                        onClick={() => removeService(service.id)}
                                        className="mt-1 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors w-full flex justify-center"
                                        title="Eliminar servicio"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Parts Section */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2 text-gray-900">
                        <h3 className="text-lg font-semibold text-gray-800">Refacciones</h3>
                        <button
                            type="button"
                            onClick={addPart}
                            className="flex items-center gap-2 text-sm text-[#F37014] hover:text-orange-700 font-medium px-3 py-1.5 rounded-md hover:bg-orange-50 transition-colors"
                        >
                            <Plus size={16} />
                            Agregar Refacción
                        </button>
                    </div>

                    <div className="space-y-4">
                        {parts.map((part) => (
                            <div key={part.id} className="flex gap-4 items-start group bg-white p-4 border border-gray-200 rounded-lg hover:border-[#F37014]/50 transition-colors shadow-sm text-gray-900">
                                <div className="flex gap-2 w-full">
                                    <div className="w-16 space-y-1">
                                        <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Cant.</span>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="1"
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900 text-sm font-mono text-center"
                                            value={part.quantity || 1}
                                            onChange={(e) => updatePart(part.id, "quantity", parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Refacción</span>
                                        <CatalogSearch
                                            type="refacciones"
                                            placeholder="Buscar refacción..."
                                            onSelect={(item) => {
                                                updatePart(part.id, "description", item.nombre);
                                                if (item.costo_sugerido > 0) {
                                                    updatePart(part.id, "partsCost", item.costo_sugerido);
                                                }
                                            }}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Nombre de la refacción..."
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F37014] outline-none text-gray-900 text-sm uppercase"
                                            value={part.description}
                                            onChange={(e) => updatePart(part.id, "description", e.target.value)}
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
                                    <button
                                        type="button"
                                        onClick={() => removePart(part.id)}
                                        className="mt-1 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors w-full flex justify-center"
                                        title="Eliminar refacción"
                                    >
                                        <Trash2 size={16} />
                                    </button>
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
                    />
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
                        <div className="flex justify-between text-2xl font-bold text-gray-900 border-t pt-4">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-8 border-t text-gray-900">
                    <button
                        type="button"
                        className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancelar
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
            </form>

            <datalist id="service-suggestions">
                {suggestions.map((suggestion, index) => (
                    <option key={index} value={suggestion} />
                ))}
            </datalist>
        </div>
    );
}
