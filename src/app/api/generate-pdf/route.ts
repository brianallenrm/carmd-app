import { NextResponse } from "next/server";
import { getBrowser } from "@/lib/puppeteer";

export const maxDuration = 60; // Allow up to 60s (if plan permits)


export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { client, vehicle, services, parts, company, folio, notes, date, isDiagnostic, hideParts, hideWarranty, isReception, inventory, functional, service, photos } = body;

        // Determine base URL
        const host = req.headers.get("host") || "localhost:3000";
        // Fix: Use http for local IPs (e.g., 192.168.x.x) or localhost
        const isLocal = host.includes("localhost") || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(host);
        const protocol = isLocal ? "http" : "https";
        const baseUrl = `${protocol}://${host}`;

        // 1. Prepare Data Object
        const pdfData = {
            client: client || {},
            vehicle: vehicle || {},
            company: company || {},
            services: services || [],
            parts: parts || [],
            folio: folio || "00001",
            date: date || new Date().toLocaleDateString("es-MX"),
            includeIva: body.includeIva,
            includeIsr: body.includeIsr,
            // Legacy support
            isDiagnostic: false, // Deprecated in component but we might still receive it
            // New flags
            hideParts: hideParts || (isDiagnostic === true),
            hideWarranty: hideWarranty || (isDiagnostic === true),
            notes: notes,
            // Reception-specific fields
            isReception: isReception || false,
            inventory: inventory || {},
            functional: functional || {},
            service: service || {},
            photos: photos || {}
        };

        // 2. Launch Puppeteer
        const browser = await getBrowser();
        const page = await browser.newPage();

        // 3. Inject Data BEFORE navigation
        // We inject into BOTH window global and localStorage for redundancy
        await page.evaluateOnNewDocument((data: any) => {
            (window as any).__PDF_DATA__ = data;
            window.localStorage.setItem('PDF_DATA', JSON.stringify(data));
        }, pdfData);

        // 4. Navigate to minimal URL
        // We only pass folio/date purely for fallback or logging, but the real data is in window
        const url = `${baseUrl}/note-preview`; // No query params needed for data

        // Set viewport to A4 size (approximate pixels at 96 DPI)
        // A4 is 210mm x 297mm. 
        // Max Quality: Scale 3 (Ultra HD). High limit for serverless.
        // Max Quality: Scale 3 (Ultra HD). High limit for serverless.
        await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 3 });

        // Debugging: Capture browser logs
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', (err: any) => console.log('PAGE ERROR:', err.toString()));
        page.on('requestfailed', request => console.log('PAGE REQUEST FAILED:', request.failure()?.errorText, request.url()));

        try {
            await page.goto(url, { waitUntil: "networkidle0", timeout: 45000 });
        } catch (e) {
            console.error("Page Navigation Error:", e);
            throw new Error(`Failed to navigate to preview URL: ${e instanceof Error ? e.message : String(e)}`);
        }

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
                    setTimeout(resolve, 5000);
                });
            }));
        });

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
