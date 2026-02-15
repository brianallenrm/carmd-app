'use client';

import React, { useState } from 'react';
import { Camera, Trash2, CheckCircle, Loader2, Cloud, AlertTriangle } from 'lucide-react';
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
    const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

    const handleFileChange = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Clear any previous error for this photo
        setUploadErrors(prev => { const next = { ...prev }; delete next[id]; return next; });

        try {
            // Compress image client-side (~80-200KB)
            const { blob, dataUrl, actualFormat } = await compressImage(file, {
                maxWidth: 1200,
                maxHeight: 900,
                quality: 0.7,
                format: 'image/webp',
            });

            // Show compressed preview immediately
            onPhotoUpdate(id, { file, previewUrl: dataUrl });

            // Upload to R2 in background with retry
            setUploading(prev => ({ ...prev, [id]: true }));

            const base64 = await blobToBase64(blob);
            const ext = actualFormat === 'image/webp' ? 'webp' : 'jpg';
            const platePrefix = plates?.trim() ? plates.trim().toUpperCase() : 'SIN_PLACA';
            const filename = `${platePrefix}_${id}.${ext}`;

            let lastError: any = null;
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    const res = await fetch('/api/photos/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: base64, filename }),
                    });

                    if (res.ok) {
                        const { url } = await res.json();
                        onPhotoUpdate(id, { driveUrl: url });
                        lastError = null;
                        break;
                    } else {
                        const errData = await res.json().catch(() => ({}));
                        lastError = errData.error || `HTTP ${res.status}`;
                    }
                } catch (err) {
                    lastError = err;
                }
                // Brief wait before retry
                if (attempt === 0) await new Promise(r => setTimeout(r, 1500));
            }

            if (lastError) {
                console.error('Upload failed after retry:', lastError);
                const errorMessage = typeof lastError === 'string' ? lastError : 'Error de conexión';
                setUploadErrors(prev => ({ ...prev, [id]: `Error: ${errorMessage}` }));
            }
        } catch (err) {
            console.error('Photo processing error:', err);
            const reader = new FileReader();
            reader.onloadend = () => {
                onPhotoUpdate(id, { file, previewUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
            setUploadErrors(prev => ({ ...prev, [id]: 'Error al procesar la imagen.' }));
        } finally {
            setUploading(prev => ({ ...prev, [id]: false }));
        }
    };

    return (
        <div className="space-y-6" id="tutorial-photo-evidence">
            <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-slate-900">Evidencia Fotográfica</h2>
                <p className="text-sm text-slate-500">Toma fotos de los 4 ángulos. Si hay daño, descríbelo.</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-2 flex items-center justify-center gap-1.5">
                    <Cloud size={12} className="text-[#F37014]" /> Las fotos se guardan en la nube automáticamente
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-4">
                    {/* Standard Zones */}
                    {ZONES.map((zone) => {
                        const photo = photos[zone.id] || { id: zone.id, label: zone.label, previewUrl: null, file: null, notes: '' };
                        return (
                            <PhotoSlot
                                key={zone.id}
                                zone={zone}
                                photo={photo}
                                uploading={!!uploading[zone.id]}
                                uploadError={uploadErrors[zone.id]}
                                handleFileChange={handleFileChange}
                                onPhotoUpdate={onPhotoUpdate}
                            />
                        );
                    })}

                    {/* Additional Photos Section */}
                    <div className="pt-4 border-t border-slate-100">
                        <h3 className="text-[10px] font-bold text-slate-400 mb-4 px-2 uppercase tracking-widest">Fotos Adicionales</h3>
                        <div className="space-y-4">
                            {Object.values(photos)
                                .filter(p => p?.id?.startsWith('extra_'))
                                .map((photo) => (
                                    <PhotoSlot
                                        key={photo.id}
                                        zone={{ id: photo.id, label: photo.label }}
                                        photo={photo}
                                        uploading={!!uploading[photo.id]}
                                        uploadError={uploadErrors[photo.id]}
                                        handleFileChange={handleFileChange}
                                        onPhotoUpdate={onPhotoUpdate}
                                        isExtra
                                        onRemove={() => {
                                            onPhotoUpdate(photo.id, { previewUrl: null, driveUrl: null });
                                        }}
                                    />
                                ))
                            }

                            <button
                                type="button"
                                onClick={() => {
                                    const extraId = `extra_${Date.now()}`;
                                    onPhotoUpdate(extraId, { id: extraId, label: 'Foto Extra', previewUrl: null, notes: '' });
                                }}
                                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-[#F37014] hover:text-[#F37014] transition-all flex items-center justify-center gap-2 font-bold bg-slate-50/50"
                            >
                                <Camera size={20} />
                                + Agregar otra foto (Daños, Motor, etc.)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface PhotoSlotProps {
    zone: { id: string; label: string };
    photo: PhotoData;
    uploading: boolean;
    uploadError?: string;
    handleFileChange: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
    onPhotoUpdate: (id: string, data: Partial<PhotoData>) => void;
    isExtra?: boolean;
    onRemove?: () => void;
}

function PhotoSlot({ zone, photo, uploading, uploadError, handleFileChange, onPhotoUpdate, isExtra, onRemove }: PhotoSlotProps) {
    const hasPhoto = !!photo.previewUrl;
    const hasDriveUrl = !!photo.driveUrl;

    if (isExtra && !hasPhoto && !uploading && photo.id.startsWith('extra_') && photo.label === 'Foto Extra' && zone.id !== photo.id) {
        return null;
    }

    return (
        <div
            className={`rounded-xl border-2 overflow-hidden transition-all shadow-sm ${hasPhoto ? 'border-green-200 bg-green-50/30' : 'border-slate-100 bg-white'}`}
        >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-2 ${hasPhoto ? 'bg-green-50/50' : 'bg-slate-50'}`}>
                <span className={`text-xs font-bold uppercase tracking-wider ${hasPhoto ? 'text-green-600' : 'text-slate-500'}`}>
                    {photo.label || zone.label}
                </span>
                <div className="flex items-center gap-1.5 overflow-hidden">
                    {uploading && <Loader2 size={14} className="text-[#F37014] animate-spin flex-shrink-0" />}
                    {!uploading && uploadError && (
                        <div className="flex items-center gap-1 bg-amber-100 px-1.5 py-0.5 rounded text-[8px] font-bold text-amber-700 whitespace-nowrap animate-pulse">
                            <AlertTriangle size={10} /> {uploadError.includes('Configuración') ? 'Error Config' : 'Error Red'}
                        </div>
                    )}
                    {!uploading && !uploadError && hasDriveUrl && <span title="Guardada en la nube"><Cloud size={14} className="text-green-500 flex-shrink-0" /></span>}
                    {hasPhoto && <CheckCircle size={18} className="text-green-500 flex-shrink-0" />}
                </div>
            </div>

            {/* Photo Area */}
            <div className="relative aspect-video bg-slate-100 group">
                {hasPhoto ? (
                    <>
                        <img src={photo.previewUrl!} alt={zone.label} className="w-full h-full object-cover" />
                        {uploading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 size={24} className="text-[#F37014] animate-spin" />
                                    <span className="text-[#F37014] text-[10px] font-black uppercase tracking-tighter">Subiendo...</span>
                                </div>
                            </div>
                        )}
                        {!uploading && (
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => onPhotoUpdate(zone.id, { previewUrl: null, file: null, notes: '', driveUrl: null })}
                                    className="p-3 bg-red-600 rounded-full text-white hover:bg-red-500 shadow-xl"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 text-slate-300 hover:text-[#F37014] transition-colors w-full h-full justify-center">
                        <Camera size={32} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Tomar Foto</span>
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

            {/* Notes */}
            {hasPhoto && (
                <div className="p-3 space-y-2 bg-white">
                    <input
                        type="text"
                        placeholder="Describe el daño (opcional)..."
                        value={photo.notes || ''}
                        onChange={(e) => onPhotoUpdate(zone.id, { notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-slate-900 text-sm placeholder:text-slate-300 focus:border-[#F37014] focus:outline-none transition-all shadow-inner"
                    />
                    <div className="flex flex-wrap gap-1">
                        {['Sin Daño Aparente', 'Rayón', 'Golpe', 'Roto', 'Falta Pieza', 'Pintura Dañada'].map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                    const current = photo.notes || '';
                                    const newNotes = current ? `${current}, ${tag}` : tag;
                                    onPhotoUpdate(zone.id, { notes: newNotes });
                                }}
                                className="text-[9px] px-2 py-1 bg-slate-100 text-slate-500 rounded-full hover:bg-[#F37014] hover:text-white transition-all font-bold uppercase tracking-tighter"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
