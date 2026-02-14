import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const maxDuration = 30;

/**
 * Upload a compressed photo to Cloudflare R2 and return the public URL.
 * POST body: { image: string (base64 data URL), filename: string }
 * Returns: { url: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { image, filename } = body;

        if (!image || !filename) {
            return NextResponse.json({ error: 'Missing image or filename' }, { status: 400 });
        }

        const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT, R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env;

        if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
            console.error('Missing R2 configuration environment variables');
            return NextResponse.json({ error: 'Configuración R2 faltante en el servidor' }, { status: 500 });
        }

        // Setup R2 client (S3-compatible)
        const s3 = new S3Client({
            region: 'auto',
            endpoint: R2_ENDPOINT,
            credentials: {
                accessKeyId: R2_ACCESS_KEY_ID,
                secretAccessKey: R2_SECRET_ACCESS_KEY,
            },
        });

        // Parse base64 data URL
        const matches = image.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
            return NextResponse.json({ error: 'Invalid base64 image format' }, { status: 400 });
        }
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        // Upload to R2
        const key = `inventarios/${filename}`;

        await s3.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        }));

        // Public URL via R2.dev subdomain
        const publicUrl = `${R2_PUBLIC_URL}/${key}`;

        return NextResponse.json({
            url: publicUrl,
            key: key,
        });

    } catch (error) {
        console.error('R2 Upload Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
