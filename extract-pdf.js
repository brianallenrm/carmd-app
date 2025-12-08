const fs = require('fs');
const pdf = require('pdf-parse');

console.log('Type of pdf:', typeof pdf);
console.log('pdf keys:', Object.keys(pdf));

try {
    const dataBuffer = fs.readFileSync('NOTA 1699 EXPLORER  AFINA.pdf');
    // If pdf is not a function, maybe it has a default property?
    const parse = typeof pdf === 'function' ? pdf : pdf.default;

    if (typeof parse === 'function') {
        parse(dataBuffer).then(function (data) {
            console.log(data.text);
        });
    } else {
        console.error('Could not find parse function');
    }
} catch (e) {
    console.error(e);
}
