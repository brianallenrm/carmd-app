
import { NextRequest, NextResponse } from "next/server";
import { getBrowser } from "@/lib/puppeteer";

export const maxDuration = 60; // Allow up to 60s (if plan permits)


export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Construct the Preview URL with all data as query params
        // We reuse the same logic as the PDF generator
        const baseUrl = req.nextUrl.origin;
        const params = new URLSearchParams();

        if (body.client) params.set("client", JSON.stringify(body.client));
        if (body.vehicle) params.set("vehicle", JSON.stringify(body.vehicle));
        if (body.company) params.set("company", JSON.stringify(body.company));
        if (body.services) params.set("services", JSON.stringify(body.services));
        if (body.parts) params.set("parts", JSON.stringify(body.parts));
        if (body.folio) params.set("folio", body.folio);
        if (body.date) params.set("date", body.date);
        if (body.includeIva !== undefined) params.set("includeIva", body.includeIva.toString());
        if (body.includeIsr !== undefined) params.set("includeIsr", body.includeIsr.toString());

        const previewUrl = `${baseUrl}/note-preview?${params.toString()}`;

        // 2. Launch Puppeteer
        // 2. Launch Puppeteer
        const browser = await getBrowser();
        const page = await browser.newPage();

        // 3. Set Viewport to match A4 content size more closely
        // Scale 1 for speed on Serverless
        await page.setViewport({ width: 850, height: 1200, deviceScaleFactor: 1 });

        // 4. Navigate to Preview Page
        await page.goto(previewUrl, { waitUntil: "domcontentloaded" });

        // Wait for the main note card to appear (replaces the "Loading..." fallback)
        await page.waitForSelector(".shadow-2xl", { timeout: 15000 });

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
