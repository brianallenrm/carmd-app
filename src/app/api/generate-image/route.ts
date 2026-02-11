
import { NextRequest, NextResponse } from "next/server";
import { getBrowser } from "@/lib/puppeteer";

export const maxDuration = 60; // Allow up to 60s (if plan permits)


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Construct the Preview URL with all data as query params
        // 1. Prepare Data Object
        const imgData = {
            client: body.client,
            vehicle: body.vehicle,
            company: body.company,
            services: body.services,
            parts: body.parts,
            folio: body.folio,
            date: body.date,
            includeIva: body.includeIva,
            includeIsr: body.includeIsr,
            // Legacy support
            isDiagnostic: false,
            // New flags
            hideParts: body.hideParts || (body.isDiagnostic === true),
            hideWarranty: body.hideWarranty || (body.isDiagnostic === true),
            notes: body.notes,
            // Reception-specific fields
            isReception: body.isReception || false,
            inventory: body.inventory || {},
            functional: body.functional || {},
            service: body.service || {},
            photos: body.photos || {}
        };

        const baseUrl = req.nextUrl.origin;
        // Clean URL without data params
        const previewUrl = `${baseUrl}/note-preview`;

        // 2. Launch Puppeteer
        const browser = await getBrowser();
        const page = await browser.newPage();

        // 3. Inject Data
        await page.evaluateOnNewDocument((data: any) => {
            (window as any).__PDF_DATA__ = data;
            window.localStorage.setItem('PDF_DATA', JSON.stringify(data));
        }, imgData);

        // 3. Set Viewport to match A4 content size more closely
        // Max Quality: Scale 3 (Ultra HD)
        await page.setViewport({ width: 850, height: 1200, deviceScaleFactor: 3 });

        // 4. Navigate to Preview Page
        await page.goto(previewUrl, { waitUntil: "networkidle0" });

        // Wait for the main note card to appear (replaces the "Loading..." fallback)
        await page.waitForSelector("#note-preview-container", { timeout: 30000 });

        // Wait for all images (especially R2 photos) to finish loading
        await page.evaluate(async () => {
            const imgs = Array.from(document.querySelectorAll('img'));
            await Promise.all(imgs.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                    // Timeout safety
                    setTimeout(resolve, 5000);
                });
            }));
        });

        // 5. Take Screenshot
        // Hide print buttons and Next.js dev overlay
        await page.addStyleTag({
            content: `
                .print\\:hidden { display: none !important; }
                nextjs-portal { display: none !important; }
                #nextjs-dev-tools-overlay { display: none !important; }
                [data-nextjs-toast] { display: none !important; }
            `
        });

        const imageBuffer = await page.screenshot({
            type: "png",
            fullPage: true
        });

        await browser.close();

        // 6. Return Image
        return new NextResponse(Buffer.from(imageBuffer), {
            headers: {
                "Content-Type": "image/png",
                "Content-Disposition": `attachment; filename="Nota_${body.folio}.png"`,
            },
        });

    } catch (error) {
        console.error("Image Generation Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
