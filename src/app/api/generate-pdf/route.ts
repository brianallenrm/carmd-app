import { NextResponse } from "next/server";
import { getBrowser } from "@/lib/puppeteer";

export const maxDuration = 60; // Allow up to 60s (if plan permits)


export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { client, vehicle, services, parts, company, folio, notes, date } = body;

        // Determine base URL
        const host = req.headers.get("host") || "localhost:3000";
        const protocol = host.includes("localhost") ? "http" : "https";
        const baseUrl = `${protocol}://${host}`;

        // Construct URL with query params
        const params = new URLSearchParams({
            client: JSON.stringify(client || {}),
            vehicle: JSON.stringify(vehicle || {}),
            company: JSON.stringify(company || {}),
            services: JSON.stringify(services || []),
            parts: JSON.stringify(parts || []),
            folio: folio || "00001",
            date: date || new Date().toLocaleDateString("es-MX"),
        });
        if (notes) params.set("notes", notes);
        if (body.includeIva !== undefined) params.set("includeIva", body.includeIva.toString());
        if (body.includeIsr !== undefined) params.set("includeIsr", body.includeIsr.toString());

        const url = `${baseUrl}/note-preview?${params.toString()}`;

        // Launch Puppeteer
        const browser = await getBrowser();
        const page = await browser.newPage();

        // Set viewport to A4 size (approximate pixels at 96 DPI)
        // A4 is 210mm x 297mm. 
        // Max Quality: Scale 3 (Ultra HD). High limit for serverless.
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 3 });
        await page.goto(url, { waitUntil: "domcontentloaded" });

        // Wait for the main note card to appear (replaces the "Loading..." fallback)
        await page.waitForSelector(".shadow-2xl", { timeout: 15000 });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
            timeout: 30000, // Explicit timeout for PDF generation action
        });

        await browser.close();

        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=Nota-${folio}.pdf`,
            },
        });
    } catch (error) {
        console.error("PDF Generation Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
