import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractText() {
    const dataBuffer = fs.readFileSync('NOTA VERSION 1.pdf');
    const data = new Uint8Array(dataBuffer);

    // Set worker to null to avoid worker loading issues in Node, 
    // or point to the worker file if needed.
    // In legacy mode for Node, sometimes it works without worker or with fake worker.
    // Let's try without setting worker first, usually pdfjs-dist requires it.

    // Actually, for Node.js usage, we often need to polyfill some browser APIs or use a specific setup.
    // But let's try the standard import first.

    const loadingTask = pdfjsLib.getDocument(data);
    const doc = await loadingTask.promise;

    console.log(`PDF loaded. Pages: ${doc.numPages}`);

    let fullText = '';

    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n`;
    }

    console.log(fullText);
}

extractText().catch(err => console.error(err));
