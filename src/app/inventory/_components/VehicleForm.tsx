'use client';

import React from 'react';

interface VehicleData {
    brand: string;
    model: string;
    year: string;
    plates: string;
    km: string;
    gas: string;
    serialNumber: string;
    motor: string;
}

interface VehicleFormProps {
    data: VehicleData;
    onChange: (data: VehicleData) => void;
    onNext: () => void;
    lastKm?: string;
}

import { VEHICLE_CATALOG } from '@/lib/constants';

const BRANDS = Object.keys(VEHICLE_CATALOG).sort();

export default function VehicleForm({ data, onChange, onNext, lastKm }: VehicleFormProps) {
    const [showManualModel, setShowManualModel] = React.useState(false);

    const handleChange = (field: keyof VehicleData, value: string) => {
        onChange({ ...data, [field]: value });
    };

    const models = data.brand ? VEHICLE_CATALOG[data.brand] || [] : [];
    const hasModels = models.length > 0;

    const isFormValid = data.brand && data.model && data.plates && data.km && data.serialNumber && data.motor;

    return (
        <div className="w-full max-w-lg mx-auto space-y-6 pb-24" id="tutorial-vehicle-form">
            <div className="text-center">
                <h3 className="text-xl font-bold text-slate-900">Datos del Vehículo</h3>
                <p className="text-slate-500 text-sm">Verifica o completa la información.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 p-2">
                {/* Brand */}
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-slate-400 mb-1 font-bold uppercase ml-1">Marca</label>
                    <select
                        value={data.brand}
                        onChange={(e) => {
                            const newBrand = e.target.value;
                            onChange({ ...data, brand: newBrand, model: '' });
                            setShowManualModel(false);
                        }}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-[#F37014] shadow-sm transition-all"
                    >
                        <option value="">Selecciona...</option>
                        {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                        <option value="Otro">Otro...</option>
                    </select>
                </div>

                {/* Model */}
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-slate-400 mb-1 font-bold uppercase ml-1">Modelo / Sub-marca</label>
                    {hasModels && !showManualModel ? (
                        <select
                            value={data.model}
                            onChange={(e) => {
                                if (e.target.value === '___MANUAL___') {
                                    setShowManualModel(true);
                                    handleChange('model', '');
                                } else {
                                    handleChange('model', e.target.value);
                                }
                            }}
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-[#F37014] shadow-sm transition-all"
                        >
                            <option value="">Selecciona...</option>
                            {models.map(m => <option key={m} value={m}>{m}</option>)}
                            <option value="___MANUAL___">+ Otro modelo...</option>
                        </select>
                    ) : (
                        <div className="relative">
                            <input
                                type="text"
                                value={data.model}
                                onChange={(e) => handleChange('model', e.target.value)}
                                placeholder="Ej: Fiesta"
                                className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-[#F37014] shadow-sm transition-all"
                            />
                            {hasModels && (
                                <button
                                    onClick={() => setShowManualModel(false)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md text-slate-500 font-bold"
                                >
                                    Lista
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Year */}
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-slate-400 mb-1 font-bold uppercase ml-1">Año</label>
                    <input
                        type="text"
                        value={data.year}
                        onChange={(e) => handleChange('year', e.target.value)}
                        placeholder="2020"
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-[#F37014] shadow-sm transition-all"
                    />
                </div>

                {/* Plates - IMPORTANT */}
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-slate-400 mb-1 font-bold uppercase ml-1">Placas</label>
                    <input
                        type="text"
                        value={data.plates}
                        onChange={(e) => handleChange('plates', e.target.value.toUpperCase())}
                        placeholder="ABC-123"
                        className="w-full bg-white border-2 border-[#F37014]/30 rounded-xl px-4 py-3 text-slate-900 font-mono text-lg outline-none focus:border-[#F37014] shadow-sm transition-all"
                    />
                </div>

                {/* Serial Number */}
                <div className="col-span-2">
                    <label className="block text-xs text-slate-400 mb-1 font-bold uppercase ml-1">Número de Serie (VIN)</label>
                    <input
                        type="text"
                        value={data.serialNumber || ''}
                        onChange={(e) => handleChange('serialNumber', e.target.value.toUpperCase())}
                        placeholder="XXXXXXXXXXXXXXXXX"
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-mono outline-none focus:border-[#F37014] shadow-sm transition-all"
                    />
                </div>

                {/* Motor Type */}
                <div className="col-span-2">
                    <label className="block text-xs text-slate-400 mb-1 font-bold uppercase ml-1">Tipo de Motor</label>
                    <input
                        type="text"
                        value={data.motor || ''}
                        onChange={(e) => handleChange('motor', e.target.value)}
                        placeholder="Ej. 1.6L, V6, Eléctrico"
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-[#F37014] shadow-sm transition-all"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-xs text-slate-400 mb-1 font-bold uppercase ml-1">
                        Kilometraje {lastKm && <span className="text-[#F37014] font-bold ml-2">(Anterior: {lastKm} km)</span>}
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={data.km}
                            onChange={(e) => handleChange('km', e.target.value)}
                            placeholder="Ingrese kilometraje actual"
                            className={`w-full bg-white border-2 ${!data.km ? 'border-[#F37014]/30' : 'border-slate-200'} rounded-xl px-4 py-3 text-slate-900 outline-none focus:border-[#F37014] shadow-sm transition-all`}
                        />
                        <span className="absolute right-4 top-3 text-slate-300 font-bold">km</span>
                    </div>
                </div>

                {/* Gas Level - Visual Slider */}
                <div className="col-span-2 mt-2">
                    <label className="block text-xs text-slate-400 mb-2 font-bold uppercase ml-1">Nivel de Gasolina: <span className="text-[#F37014]">{data.gas || '?'}</span></label>
                    <div className="flex justify-between bg-slate-100 p-1 rounded-xl border border-slate-200">
                        {['Vacío', '1/4', '1/2', '3/4', 'Lleno'].map((level) => (
                            <button
                                key={level}
                                onClick={() => handleChange('gas', level)}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${data.gas === level
                                    ? 'bg-[#F37014] text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
}
