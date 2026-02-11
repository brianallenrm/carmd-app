require('dotenv').config({ path: '.env.local' });
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function checkAccess() {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    const auth = new JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet('1Y3w26f6EVar5Tl6YfFolv3571PjjT8dbUV4ffGolO4c', auth);

    try {
        console.log('Loading doc info...');
        await doc.loadInfo();
        console.log(`Title: ${doc.title}`);
        console.log('Sheets:');
        for (const sheet of doc.sheetsByIndex) {
            console.log(`- ${sheet.title} (Rows: ${sheet.rowCount})`);
        }
    } catch (error) {
        console.error('Error accessing sheet:', error.message);
    }
}

checkAccess();
