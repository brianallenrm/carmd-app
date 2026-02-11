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

const BRANDS = [
    'Acura', 'Audi', 'BMW', 'Chevrolet', 'Chrysler', 'Dodge', 'Fiat', 'Ford', 'GMC', 'Honda',
    'Hyundai', 'Infiniti', 'Jeep', 'Kia', 'Land Rover', 'Lincoln', 'Mazda', 'Mercedes Benz',
    'Mini', 'Mitsubishi', 'Nissan', 'Peugeot', 'Porsche', 'Ram', 'Renault', 'Seat', 'Subaru',
    'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo', 'Otro'
];

export default function VehicleForm({ data, onChange, onNext, lastKm }: VehicleFormProps) {

    const handleChange = (field: keyof VehicleData, value: string) => {
        onChange({ ...data, [field]: value });
    };

    const isFormValid = data.brand && data.plates && data.km && data.serialNumber && data.motor;

    return (
        <div className="w-full max-w-lg mx-auto space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-bold text-white">Datos del Vehículo</h3>
                <p className="text-neutral-400 text-sm">Verifica o completa la información.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                {/* Brand */}
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-neutral-400 mb-1">Marca</label>
                    <select
                        value={data.brand}
                        onChange={(e) => handleChange('brand', e.target.value)}
                        className="w-full bg-neutral-800 border-2 border-neutral-700 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500"
                    >
                        <option value="">Selecciona...</option>
                        {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>

                {/* Model */}
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-neutral-400 mb-1">Modelo / Sub-marca</label>
                    <input
                        type="text"
                        value={data.model}
                        onChange={(e) => handleChange('model', e.target.value)}
                        placeholder="Ej: Fiesta"
                        className="w-full bg-neutral-800 border-2 border-neutral-700 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500"
                    />
                </div>

                {/* Year */}
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-neutral-400 mb-1">Año</label>
                    <input
                        type="text"
                        value={data.year}
                        onChange={(e) => handleChange('year', e.target.value)}
                        placeholder="2020"
                        className="w-full bg-neutral-800 border-2 border-neutral-700 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500"
                    />
                </div>

                {/* Plates - IMPORTANT */}
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs text-neutral-400 mb-1">Placas</label>
                    <input
                        type="text"
                        value={data.plates}
                        onChange={(e) => handleChange('plates', e.target.value.toUpperCase())}
                        placeholder="ABC-123"
                        className="w-full bg-neutral-800 border-2 border-rose-900/50 rounded-xl px-4 py-3 text-white font-mono text-lg outline-none focus:border-rose-500"
                    />
                </div>

                {/* Serial Number */}
                <div className="col-span-2">
                    <label className="block text-xs text-neutral-400 mb-1">Número de Serie (VIN)</label>
                    <input
                        type="text"
                        value={data.serialNumber || ''}
                        onChange={(e) => handleChange('serialNumber', e.target.value.toUpperCase())}
                        placeholder="XXXXXXXXXXXXXXXXX"
                        className="w-full bg-neutral-800 border-2 border-neutral-700 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-rose-500"
                    />
                </div>

                {/* Motor Type */}
                <div className="col-span-2">
                    <label className="block text-xs text-neutral-400 mb-1">Tipo de Motor</label>
                    <input
                        type="text"
                        value={data.motor || ''}
                        onChange={(e) => handleChange('motor', e.target.value)}
                        placeholder="Ej. 1.6L, V6, Eléctrico"
                        className="w-full bg-neutral-800 border-2 border-neutral-700 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-xs text-neutral-400 mb-1">
                        Kilometraje {lastKm && <span className="text-yellow-500 font-bold ml-2">(Anterior: {lastKm} km - Actualizar)</span>}
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={data.km}
                            onChange={(e) => handleChange('km', e.target.value)}
                            placeholder="Ingrese kilometraje actual"
                            className={`w-full bg-neutral-800 border-2 ${!data.km ? 'border-yellow-600/50' : 'border-neutral-700'} rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500 transition-colors`}
                        />
                        <span className="absolute right-4 top-3 text-neutral-500 font-bold">km</span>
                    </div>
                </div>

                {/* Gas Level - Visual Slider */}
                <div className="col-span-2 mt-2">
                    <label className="block text-xs text-neutral-400 mb-2">Nivel de Gasolina: {data.gas || '?'}</label>
                    <div className="flex justify-between bg-neutral-800 p-1 rounded-xl">
                        {['R', '1/4', '1/2', '3/4', 'Lleno'].map((level) => (
                            <button
                                key={level}
                                onClick={() => handleChange('gas', level)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${data.gas === level
                                    ? 'bg-rose-600 text-white shadow-lg'
                                    : 'text-neutral-500 hover:text-white'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            <button
                onClick={onNext}
                disabled={!isFormValid}
                className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Confirmar Vehículo
            </button>

        </div>
    );
}
