/**
 * Client-side image compression utility.
 * Compresses photos before uploading to save bandwidth and storage.
 * Handles iOS Safari which doesn't support WebP canvas export.
 * Typical results: 3-12MB → 80-200KB with excellent visual quality.
 */

export interface CompressOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0-1, default 0.7
    format?: 'image/webp' | 'image/jpeg';
}

const DEFAULT_OPTIONS: CompressOptions = {
    maxWidth: 1200,
    maxHeight: 900,
    quality: 0.7,
    format: 'image/webp',
};

/**
 * Detect if the browser supports WebP export from canvas.
 * iOS Safari (pre-16) does NOT support this.
 */
function supportsWebPExport(): boolean {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const dataUrl = canvas.toDataURL('image/webp');
        return dataUrl.startsWith('data:image/webp');
    } catch {
        return false;
    }
}

/**
 * Compress an image File using Canvas API.
 * Returns a compressed Blob and a preview data URL.
 * Automatically falls back to JPEG if WebP is not supported.
 */
export async function compressImage(
    file: File,
    options: CompressOptions = {}
): Promise<{ blob: Blob; dataUrl: string; actualFormat: string }> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Auto-detect: if WebP requested but not supported, fallback to JPEG
    let format = opts.format!;
    if (format === 'image/webp' && !supportsWebPExport()) {
        format = 'image/jpeg';
    }

    return new Promise((resolve, reject) => {
        const img = new window.Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            // Calculate new dimensions maintaining aspect ratio
            let { width, height } = img;
            const maxW = opts.maxWidth!;
            const maxH = opts.maxHeight!;

            if (width > maxW || height > maxH) {
                const ratio = Math.min(maxW / width, maxH / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            // Draw to canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Compression failed'));
                        return;
                    }
                    // Also get data URL for preview
                    const dataUrl = canvas.toDataURL(format, opts.quality);
                    resolve({ blob, dataUrl, actualFormat: format });
                },
                format,
                opts.quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Convert a Blob to base64 string (for sending in JSON).
 */
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Title-case a string: capitalize first letter of each word.
 * "jesús gallardo cabrera" → "Jesús Gallardo Cabrera"
 */
export function toTitleCase(str: string): string {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
