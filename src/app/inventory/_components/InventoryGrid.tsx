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
        <div className="w-full max-w-lg mx-auto">
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
                relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 min-h-[100px]
                ${isPresent
                                    ? 'bg-green-500/20 border-green-500 text-green-400'
                                    : 'bg-neutral-800/50 border-neutral-700 text-neutral-500 hover:border-neutral-600'
                                }
              `}
                        >
                            <Icon size={24} className="mb-2" />
                            <span className="font-medium text-xs sm:text-sm text-center leading-tight">{item.label}</span>

                            {/* Status Indicator */}
                            <div
                                className={`absolute top-2 right-2 w-2 h-2 rounded-full transition-colors ${isPresent ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-neutral-700'
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
                        <label className="block text-xs text-neutral-400 mb-1 ml-1 uppercase font-bold">Describe el otro objeto:</label>
                        <input
                            type="text"
                            value={otherDescription || ''}
                            onChange={(e) => onOtherDescriptionChange(e.target.value)}
                            placeholder="Ej. Silla de bebé, GPS..."
                            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:border-rose-500 outline-none transition-colors"
                            autoFocus
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="text-center text-neutral-500 text-sm mt-6">
                Marca SOLO los elementos que el vehículo <strong>TIENE</strong>.
            </p>
        </div>
    );
}
