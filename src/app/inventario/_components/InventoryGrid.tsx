'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wrench, Disc, Flame, Triangle, FileText, Settings, Zap, Briefcase,
    Droplets, CircleDashed, Disc3, Radio, Signal, RectangleHorizontal,
    Layers, Plus, Lock
} from 'lucide-react';

interface InventoryGridProps {
    inventory: Record<string, boolean>;
    onToggleItem: (item: string) => void;
    otherDescription?: string;
    onOtherDescriptionChange?: (val: string) => void;
}

const ITEMS: { id: string; label: string; icon: React.ElementType }[] = [
    { id: 'birlo', label: 'Birlo de Seguridad', icon: Lock },
    { id: 'cables', label: 'Cables Pasacorriente', icon: Zap },
    { id: 'reflejantes', label: 'Reflejantes', icon: Triangle },
    { id: 'herramienta', label: 'Herramienta', icon: Wrench },
    { id: 'gato', label: 'Gato', icon: Settings },
    { id: 'llanta', label: 'Llanta de Refacción', icon: Disc },
    { id: 'maletin', label: 'Maletín', icon: Briefcase },
    { id: 'extintor', label: 'Extinguidor', icon: Flame },
    { id: 'cds', label: 'CD\'s', icon: Disc3 },
    { id: 'radio', label: 'Radio', icon: Radio },
    { id: 'antena', label: 'Antena', icon: Signal },
    { id: 'encendedor', label: 'Encendedor', icon: Flame },
    { id: 'otro', label: 'Otro', icon: Plus },
];

export default function InventoryGrid({ inventory, onToggleItem, otherDescription, onOtherDescriptionChange }: InventoryGridProps) {
    return (
        <div className="w-full max-w-lg mx-auto" id="tutorial-inventory-grid">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {ITEMS.map((item) => {
                    const isPresent = !!inventory[item.id];
                    const Icon = item.icon;

                    return (
                        <motion.button
                            key={item.id}
                            onClick={() => onToggleItem(item.id)}
                            whileTap={{ scale: 0.95 }}
                            className={`
                relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 min-h-[100px] shadow-sm
                ${isPresent
                                    ? 'bg-green-50 border-green-200 text-green-600 shadow-inner'
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                                }
              `}
                        >
                            <Icon size={24} className="mb-2" />
                            <span className="font-bold text-xs sm:text-sm text-center leading-tight uppercase tracking-tight">{item.label}</span>

                            {/* Status Indicator */}
                            <div
                                className={`absolute top-2 right-2 w-2 h-2 rounded-full transition-colors ${isPresent ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-100 border border-slate-200'
                                    }`}
                            />
                        </motion.button>
                    );
                })}
            </div>

            {/* Other Description Input */}
            <AnimatePresence>
                {inventory['otro'] && onOtherDescriptionChange && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 overflow-hidden"
                    >
                        <label className="block text-xs text-slate-400 mb-1 ml-1 uppercase font-bold tracking-wider">Describe el otro objeto:</label>
                        <input
                            type="text"
                            value={otherDescription || ''}
                            onChange={(e) => onOtherDescriptionChange(e.target.value)}
                            placeholder="Ej. Silla de bebé, GPS..."
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:border-[#F37014] outline-none transition-colors shadow-sm"
                            autoFocus
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="text-center text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-6">
                Marca SOLO los elementos que el vehículo <strong className="text-[#F37014]">TIENE</strong>.
            </p>
        </div>
    );
}
