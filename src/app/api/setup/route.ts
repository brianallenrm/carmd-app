import { NextResponse } from 'next/server';
import { getInventoryDoc } from '@/lib/google-sheets';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';

export async function GET() {
    try {
        console.log("[Setup API] Conectando con Google Sheets...");
        const doc = await getInventoryDoc();
        
        const tabName = "CHAT_MESSAGES";
        let sheet = doc.sheetsByTitle[tabName];
        
        if (sheet) {
            console.log(`[Setup API] La pestaña '${tabName}' ya existe.`);
            return NextResponse.json({ success: true, message: `La pestaña '${tabName}' ya existe.` });
        } else {
            console.log(`[Setup API] Creando la pestaña '${tabName}'...`);
            sheet = await doc.addSheet({ 
                title: tabName, 
                headerValues: ['phone', 'sender', 'text', 'timestamp'] 
            });
            console.log(`[Setup API] ¡Pestaña '${tabName}' creada con éxito con las columnas requeridas!`);
            return NextResponse.json({ success: true, message: `Pestaña '${tabName}' creada con éxito.` });
        }
    } catch (error) {
        console.error("[Setup API] Error creando la pestaña:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
