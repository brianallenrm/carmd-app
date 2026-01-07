import { NextRequest, NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { GOOGLE_SHEETS_CONFIG } from '@/lib/constants';
import catalogDataRaw from '../../../../public/catalog/catalogo_final.json';

// Interfaces
interface CatalogItem {
    id: number;
    nombre: string;
    descripcion: string;
    costo_sugerido: number;
    frecuencia: number;
    categoria?: string;
}

interface Catalog {
    servicios: CatalogItem[];
    refacciones: CatalogItem[];
}

// Default Static Data (Fallback)
const staticCatalog: Catalog = catalogDataRaw as Catalog;

// Helper: Fuzzy Search
function similarity(a: string, b: string): number {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    if (aLower === bLower) return 1.0;
    if (bLower.includes(aLower)) return 0.8;
    const aWords = aLower.split(/\s+/);
    const bWords = bLower.split(/\s+/);
    let matches = 0;
    for (const aWord of aWords) {
        for (const bWord of bWords) {
            if (bWord.includes(aWord) || aWord.includes(bWord)) {
                matches++;
                break;
            }
        }
    }
    return matches / Math.max(aWords.length, bWords.length);
}

// Helper: Load from Sheets
async function loadFromSheets(): Promise<Catalog | null> {
    try {
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) return null;

        const auth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const doc = new GoogleSpreadsheet(GOOGLE_SHEETS_CONFIG.MASTER.ID, auth);
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle["CATALOGO"];

        if (!sheet) return null;

        const rows = await sheet.getRows();
        if (rows.length === 0) return null;

        const servicios: CatalogItem[] = [];
        const refacciones: CatalogItem[] = [];

        rows.forEach(row => {
            const idStr = row.get("ID") || "";
            const id = parseInt(idStr.replace(/[^0-9]/g, '')) || 0;
            const item: CatalogItem = {
                id,
                nombre: row.get("Nombre") || "",
                descripcion: row.get("Descripcion") || "",
                costo_sugerido: parseFloat(row.get("Costo")) || 0,
                frecuencia: parseInt(row.get("Frecuencia")) || 0,
                categoria: row.get("Categoria") || "General"
            };

            const tipo = row.get("Tipo");
            if (tipo === "Servicio") servicios.push(item);
            else refacciones.push(item);
        });

        return { servicios, refacciones };

    } catch (error) {
        console.error("Sheet Load Error:", error);
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type') || 'servicios';
        const search = searchParams.get('search') || '';
        const forceRefresh = searchParams.get('refresh') === 'true';

        // 1. Try Sheets (unless high load? maybe cache later)
        // For now, simple SWR or just fetch. 
        // Logic: Try Sheets. If fail/empty, use Static.
        let catalog = await loadFromSheets();
        let source = 'SHEETS';

        if (!catalog || (catalog.servicios.length === 0 && catalog.refacciones.length === 0)) {
            console.log("Fallback to Static Catalog");
            catalog = staticCatalog;
            source = 'STATIC';
        }

        const items = type === 'servicios' ? catalog.servicios : catalog.refacciones;

        // If no search, return popular
        if (!search.trim()) {
            // Sort by frequency (Sheets might not be sorted)
            const top = [...items].sort((a, b) => b.frecuencia - a.frecuencia).slice(0, 20);
            return NextResponse.json({ results: top, total: items.length, source });
        }

        // Fuzzy Search
        const searchResults = items
            .map(item => ({ ...item, score: similarity(search, item.nombre) }))
            .filter(item => item.score > 0.3)
            .sort((a, b) => {
                if (Math.abs(a.score - b.score) < 0.1) return b.frecuencia - a.frecuencia;
                return b.score - a.score;
            })
            .slice(0, 10)
            .map(({ score, ...item }) => item);

        return NextResponse.json({
            results: searchResults,
            total: searchResults.length,
            query: search,
            source
        });

    } catch (error) {
        console.error('Error in catalog API:', error);
        // Final fallback
        return NextResponse.json({ error: 'Failed to load catalog', details: String(error) }, { status: 500 });
    }
}
