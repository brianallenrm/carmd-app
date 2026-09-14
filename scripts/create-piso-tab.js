const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config({ path: '.env.local' });

async function createPisoTab() {
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

    const docId = "1Y3w26f6EVar5Tl6YfFolv3571PjjT8dbUV4ffGolO4c"; // GOOGLE_SHEETS_CONFIG.INVENTORY.ID
    const doc = new GoogleSpreadsheet(docId, auth);
    
    await doc.loadInfo();
    console.log(`Loaded Document: ${doc.title}`);

    const headers = [
      'Placa',
      'Estatus',
      'Mecanico',
      'Motivo_Salida',
      'Ultima_Actualizacion',
      'Refacciones_JSON',
      'Servicios_Externos_JSON',
      'Bitacora_JSON'
    ];

    const existingSheet = doc.sheetsByTitle['CONTROL_PISO'];
    if (existingSheet) {
      console.log("CONTROL_PISO tab already exists. Ensuring headers...");
      await existingSheet.setHeaderRow(headers);
      console.log("Headers updated on CONTROL_PISO.");
    } else {
      console.log("Creating new tab CONTROL_PISO...");
      await doc.addSheet({ title: 'CONTROL_PISO', headerValues: headers });
      console.log("Tab CONTROL_PISO created successfully!");
    }
  } catch (error) {
    console.error("Error creating CONTROL_PISO tab:", error);
  }
}

createPisoTab();
