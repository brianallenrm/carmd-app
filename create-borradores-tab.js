const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config({ path: '.env.local' });

async function createBorradoresTab() {
  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY;
    if (!email || !key) {
      console.error("No credentials found in .env.local");
      return;
    }

    const auth = new JWT({
      email: email,
      key: key.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const docId = "1A35mdnUopNt-pk0yWdDxucPAe5zqO46ujgzN1r0jW9Q"; // GOOGLE_SHEETS_CONFIG.MASTER.ID
    const doc = new GoogleSpreadsheet(docId, auth);
    
    await doc.loadInfo();
    console.log(`Loaded Document: ${doc.title}`);

    const existingSheet = doc.sheetsByTitle['BORRADORES'];
    if (existingSheet) {
      console.log("BORRADORES tab already exists. Updating headers just in case...");
      await existingSheet.setHeaderRow(['DraftID', 'Fecha', 'Placas', 'Cliente', 'Metadatos']);
      console.log("Headers updated.");
    } else {
      console.log("Creating new tab BORRADORES...");
      const newSheet = await doc.addSheet({ title: 'BORRADORES', headerValues: ['DraftID', 'Fecha', 'Placas', 'Cliente', 'Metadatos'] });
      console.log("Tab created successfully!");
    }
  } catch (error) {
    console.error("Error creating tab:", error);
  }
}

createBorradoresTab();
