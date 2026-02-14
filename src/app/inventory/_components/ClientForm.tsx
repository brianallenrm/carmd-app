'use client';

import React from 'react';
import { User, Mail, Phone, MapPin, ChevronRight } from 'lucide-react';

interface ClientData {
    name: string;
    phone: string;
    phoneOffice: string;
    email: string;
    address: string;
    colonia: string;
    municipality: string;
    state: string;
}

interface ClientFormProps {
    data: ClientData;
    onChange: (data: ClientData) => void;
    onNext: () => void;
    isNew?: boolean;
}

export default function ClientForm({ data, onChange, onNext, isNew = false }: ClientFormProps) {

    const handleChange = (field: keyof ClientData, value: string) => {
        // Auto-capitalize name: first letter of each word uppercase
        if (field === 'name') {
            value = value.replace(/\b\w/g, (char) => char.toUpperCase());
        }
        onChange({ ...data, [field]: value });
    };

    const isValid = data.name && data.phone && data.email;

    return (
        <div className="w-full max-w-lg mx-auto space-y-6" id="tutorial-client-form">

            <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                    {isNew ? 'Registrar Nuevo Cliente' : 'Confirmar Datos del Cliente'}
                </h3>
                <p className="text-slate-500 text-sm">
                    {isNew
                        ? 'Ingresa los datos para dar de alta al cliente.'
                        : 'Verifica que la información sea correcta.'}
                </p>
            </div>

            <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">

                {/* Name */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre Completo o Empresa *</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Ej. Juan Pérez"
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-[#F37014] outline-none transition-colors shadow-sm"
                        />
                    </div>
                </div>

                {/* Phones Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Teléfono (WhatsApp) *</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input
                                type="tel"
                                value={data.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="55 1234 5678"
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-[#F37014] outline-none transition-colors shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Teléfono Casa / Oficina</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input
                                type="tel"
                                value={data.phoneOffice || ''}
                                onChange={(e) => handleChange('phoneOffice', e.target.value)}
                                placeholder="Opcional"
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-[#F37014] outline-none transition-colors shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Correo Electrónico *</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="cliente@ejemplo.com"
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-[#F37014] outline-none transition-colors shadow-sm"
                        />
                    </div>
                </div>

                {/* Address Fields */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-700 mb-2">Dirección</h4>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Calle y Número *</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={data.address || ''}
                                onChange={(e) => handleChange('address', e.target.value)}
                                placeholder="Av. Insurgentes Sur 123"
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-[#F37014] outline-none transition-colors shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Colonia *</label>
                            <input
                                type="text"
                                value={data.colonia || ''}
                                onChange={(e) => handleChange('colonia', e.target.value)}
                                placeholder="Roma Norte"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-[#F37014] outline-none transition-colors shadow-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Deleg. / Municipio *</label>
                            <input
                                type="text"
                                value={data.municipality || ''}
                                onChange={(e) => handleChange('municipality', e.target.value)}
                                placeholder="Cuauhtémoc"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-[#F37014] outline-none transition-colors shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Estado *</label>
                        <select
                            value={data.state === 'CDMX' || data.state === 'Edomex' ? data.state : 'Otro'}
                            onChange={(e) => {
                                const val = e.target.value;
                                handleChange('state', val === 'Otro' ? '' : val);
                            }}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-[#F37014] outline-none transition-colors appearance-none cursor-pointer shadow-sm"
                        >
                            <option value="">Selecciona...</option>
                            <option value="CDMX">CDMX</option>
                            <option value="Edomex">Estado de México</option>
                            <option value="Otro">Otro/Escribir</option>
                        </select>

                        {/* Custom State Input */}
                        {(data.state !== 'CDMX' && data.state !== 'Edomex' && data.state !== undefined) && (
                            <input
                                type="text"
                                value={data.state}
                                onChange={(e) => handleChange('state', e.target.value)}
                                placeholder="Escribe el estado..."
                                className="w-full mt-2 pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-[#F37014] outline-none transition-colors animate-in fade-in slide-in-from-top-1 shadow-sm"
                                autoFocus
                            />
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
