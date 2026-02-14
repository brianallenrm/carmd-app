import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import Buffer from 'buffer';

const R2_ACCESS_KEY_ID = "9c6b910b712e12fbad47d28ac3dea1ae";
const R2_SECRET_ACCESS_KEY = "c6a433e91b61c154b1029ad62ca064236c2c40dabff232873b8a41b1693584f6";
const R2_ENDPOINT = "https://8e7ad3b657783d3f7aef590523352f30.r2.cloudflarestorage.com";
const R2_BUCKET_NAME = "carmd-fotos";

async function testR2() {
    console.log("Testing R2 connection...");
    const s3 = new S3Client({
        region: 'auto',
        endpoint: R2_ENDPOINT,
        credentials: {
            accessKeyId: R2_ACCESS_KEY_ID,
            secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
    });

    try {
        const testContent = "Hello from Test Script " + new Date().toISOString();
        const key = "test-connection.txt";

        await s3.send(new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: testContent,
            ContentType: "text/plain",
        }));

        console.log("✅ Upload successful!");
    } catch (error) {
        console.error("❌ Upload failed:", error);
    }
}

testR2();
