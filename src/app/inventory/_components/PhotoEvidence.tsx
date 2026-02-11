'use client';

import React, { useState } from 'react';
import { Camera, Trash2, CheckCircle, Loader2, Cloud } from 'lucide-react';
import { compressImage, blobToBase64 } from '@/lib/image-utils';

export interface PhotoData {
    id: string;
    label: string;
    previewUrl: string | null;
    driveUrl?: string | null;
    file?: File | null;
    notes?: string;
}

interface PhotoEvidenceProps {
    photos: Record<string, PhotoData>;
    onPhotoUpdate: (id: string, data: Partial<PhotoData>) => void;
    plates?: string; // Vehicle plate number for file naming
}

const ZONES = [
    { id: 'frente', label: 'Frente' },
    { id: 'atras', label: 'Atrás' },
    { id: 'izq', label: 'Lateral Izq' },
    { id: 'der', label: 'Lateral Der' },
];

const QUICK_TAGS = ['Sin Daño Aparente', 'Rayón', 'Golpe', 'Roto', 'Falta Pieza', 'Pintura Dañada'];

export default function PhotoEvidence({ photos, onPhotoUpdate, plates }: PhotoEvidenceProps) {
    const [uploading, setUploading] = useState<Record<string, boolean>>({});

    const handleFileChange = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // Compress image client-side (~80-200KB)
            // Auto-falls back to JPEG on iOS Safari (no WebP support)
            const { blob, dataUrl, actualFormat } = await compressImage(file, {
                maxWidth: 1200,
                maxHeight: 900,
                quality: 0.7,
                format: 'image/webp',
            });

            // Show compressed preview immediately
            onPhotoUpdate(id, { file, previewUrl: dataUrl });

            // Upload to R2 in background
            setUploading(prev => ({ ...prev, [id]: true }));

            const base64 = await blobToBase64(blob);
            // Name: PLACA_zona.ext (e.g. NNJ3356_frente.webp)
            const ext = actualFormat === 'image/webp' ? 'webp' : 'jpg';
            const platePrefix = plates?.trim() ? plates.trim().toUpperCase() : 'SIN_PLACA';
            const filename = `${platePrefix}_${id}.${ext}`;

            const res = await fetch('/api/photos/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64, filename }),
            });

            if (res.ok) {
                const { url } = await res.json();
                onPhotoUpdate(id, { driveUrl: url });
            } else {
                const errData = await res.json();
                console.error('Upload failed:', errData);
            }
        } catch (err) {
            console.error('Photo processing error:', err);
            // Fallback: show raw file as preview
            const reader = new FileReader();
            reader.onloadend = () => {
                onPhotoUpdate(id, { file, previewUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        } finally {
            setUploading(prev => ({ ...prev, [id]: false }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-white">Evidencia Fotográfica</h2>
                <p className="text-sm text-neutral-400">Toma fotos de los 4 ángulos. Si hay daño, descríbelo.</p>
                <p className="text-xs text-neutral-500">📷 Las fotos se comprimen y guardan en la nube automáticamente.</p>
            </div>

            <div className="space-y-4">
                {ZONES.map((zone) => {
                    const photo = photos[zone.id] || { id: zone.id, label: zone.label, previewUrl: null, file: null, notes: '' };
                    const hasPhoto = !!photo.previewUrl;
                    const isUploading = uploading[zone.id];
                    const hasDriveUrl = !!photo.driveUrl;

                    return (
                        <div
                            key={zone.id}
                            className={`rounded-xl border-2 overflow-hidden transition-all ${hasPhoto ? 'border-green-500/50 bg-green-500/5' : 'border-neutral-700 bg-neutral-800/50'}`}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-2 bg-neutral-900/50">
                                <span className={`font-bold ${hasPhoto ? 'text-green-400' : 'text-neutral-300'}`}>
                                    {zone.label}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {isUploading && <Loader2 size={14} className="text-blue-400 animate-spin" />}
                                    {!isUploading && hasDriveUrl && <span title="Guardada en la nube"><Cloud size={14} className="text-green-500" /></span>}
                                    {hasPhoto && <CheckCircle size={18} className="text-green-500" />}
                                </div>
                            </div>

                            {/* Photo Area */}
                            <div className="relative aspect-video bg-neutral-900 group">
                                {hasPhoto ? (
                                    <>
                                        <img src={photo.previewUrl!} alt={zone.label} className="w-full h-full object-cover" />
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Loader2 size={24} className="text-white animate-spin" />
                                                    <span className="text-white text-xs font-bold">Subiendo a la nube...</span>
                                                </div>
                                            </div>
                                        )}
                                        {/* Overlay to retake/delete */}
                                        {!isUploading && (
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                <button
                                                    onClick={() => onPhotoUpdate(zone.id, { previewUrl: null, file: null, notes: '', driveUrl: null })}
                                                    className="p-2 bg-red-600 rounded-full text-white hover:bg-red-500"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <label className="cursor-pointer flex flex-col items-center gap-2 text-neutral-500 hover:text-rose-500 transition-colors w-full h-full justify-center">
                                        <Camera size={32} />
                                        <span className="text-xs font-bold">Tomar Foto</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            onChange={(e) => handleFileChange(zone.id, e)}
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Notes - only shown when photo exists */}
                            {hasPhoto && (
                                <div className="p-3 space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Describe el daño (opcional)..."
                                        value={photo.notes || ''}
                                        onChange={(e) => onPhotoUpdate(zone.id, { notes: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 p-2 rounded-lg text-white text-sm placeholder:text-neutral-500 focus:border-rose-500 focus:outline-none"
                                    />
                                    <div className="flex flex-wrap gap-1">
                                        {QUICK_TAGS.map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => {
                                                    const current = photo.notes || '';
                                                    const newNotes = current ? `${current}, ${tag}` : tag;
                                                    onPhotoUpdate(zone.id, { notes: newNotes });
                                                }}
                                                className="text-[10px] px-2 py-1 bg-neutral-700 text-neutral-300 rounded-full hover:bg-rose-600/30 hover:text-rose-300 transition-colors"
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
