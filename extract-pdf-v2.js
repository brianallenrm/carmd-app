const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function extractText() {
    const dataBuffer = fs.readFileSync('NOTA 1699 EXPLORER  AFINA.pdf');
    const data = new Uint8Array(dataBuffer);

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
