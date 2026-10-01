import crypto from 'crypto';

const TRACKER_SECRET = process.env.TRACKER_SECRET || 'carmd-car-tracker-token-2026-secret';

/**
 * Genera un token único y seguro para seguimiento de vehículo.
 * Formato: tk_ + 10 caracteres hex.
 * Es determinista respecto a la placa y fecha/fila si se proporciona,
 * garantizando que el mismo auto en la misma recepción siempre tenga el mismo token.
 */
export function generateTrackerToken(plate: string, seed: string = ''): string {
    const cleanPlate = (plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanSeed = String(seed || '').trim();
    const payload = `${cleanPlate}:${cleanSeed}`;
    const hash = crypto.createHmac('sha256', TRACKER_SECRET)
        .update(payload)
        .digest('hex')
        .slice(0, 10);
    return `tk_${hash}`;
}

/**
 * Verifica si un string tiene formato válido de token de seguimiento
 */
export function isValidTrackerToken(str: string): boolean {
    if (!str) return false;
    return /^tk_[a-f0-9]{8,16}$/i.test(str.trim());
}
