const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config({ path: '.env.local' });

async function testSheet() {
    console.log("Testing Google Sheets Connection...");

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        console.error("❌ Missing env vars in .env.local");
        return;
    }

    console.log(`Using Service Account: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`);

    const auth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // ID provided by user: https://docs.google.com/spreadsheets/d/1Y3w26f6EVar5Tl6YfFolv3571PjjT8dbUV4ffGolO4c/edit
    const IG_ID = "1Y3w26f6EVar5Tl6YfFolv3571PjjT8dbUV4ffGolO4c";

    console.log(`Using Spreadsheet ID: ${IG_ID}`);
    const doc = new GoogleSpreadsheet(IG_ID, auth);

    try {
        await doc.loadInfo();
        console.log(`✅ Success! Doc Title: ${doc.title}`);
        console.log("📑 Sheets:");
        doc.sheetsByIndex.forEach(s => {
            console.log(`   - [${s.index}] ${s.title} (RowCount: ${s.rowCount})`);
        });
    } catch (error) {
        console.error("❌ Failed to load doc info:", error.message);
        if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   StatusText:", error.response.statusText);
        }
    }
}

testSheet();
