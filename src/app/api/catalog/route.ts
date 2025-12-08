import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// Fuzzy search helper
function similarity(a: string, b: string): number {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    // Exact match
    if (aLower === bLower) return 1.0;

    // Contains match
    if (bLower.includes(aLower)) return 0.8;

    // Word-by-word match
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

// Import directly to ensure Vercel bundles it
import catalogDataRaw from '../../../../public/catalog/catalogo_final.json';

const catalogCache: Catalog = catalogDataRaw as Catalog;

function loadCatalog(): Catalog {
    return catalogCache;
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type') || 'servicios'; // 'servicios' or 'refacciones'
        const search = searchParams.get('search') || '';

        const catalog = loadCatalog();
        const items = type === 'servicios' ? catalog.servicios : catalog.refacciones;

        // If no search query, return top 20 most frequent
        if (!search.trim()) {
            return NextResponse.json({
                results: items.slice(0, 20),
                total: items.length
            });
        }

        // Fuzzy search
        const searchResults = items
            .map(item => ({
                ...item,
                score: similarity(search, item.nombre)
            }))
            .filter(item => item.score > 0.3) // Minimum threshold
            .sort((a, b) => {
                // Sort by score first, then by frequency
                if (Math.abs(a.score - b.score) < 0.1) {
                    return b.frecuencia - a.frecuencia;
                }
                return b.score - a.score;
            })
            .slice(0, 10) // Top 10 results
            .map(({ score, ...item }) => item); // Remove score from response

        return NextResponse.json({
            results: searchResults,
            total: searchResults.length,
            query: search
        });

    } catch (error) {
        console.error('Error in catalog API:', error);
        return NextResponse.json(
            { error: 'Failed to load catalog' },
            { status: 500 }
        );
    }
}
