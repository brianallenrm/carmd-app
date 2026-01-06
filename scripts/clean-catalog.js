const fs = require('fs');
const path = require('path');

const catalogPath = path.join(process.cwd(), 'public/catalog/catalogo_final.json');
const rawData = fs.readFileSync(catalogPath, 'utf-8');
const catalog = JSON.parse(rawData);

console.log(`Original version: ${catalog.version}`);

// Helper to normalize strings: remove trailing dots and spaces
const normalizeName = (name) => {
    return name.replace(/[\.\s]+$/, '');
};

const cleanArray = (items, type) => {
    console.log(`Processing ${type}... Original count: ${items.length}`);
    const mergedMap = new Map();

    items.forEach(item => {
        const cleanName = normalizeName(item.nombre);

        if (!mergedMap.has(cleanName)) {
            // Initialize
            mergedMap.set(cleanName, {
                ...item,
                nombre: cleanName,
                // Keep existing ID or maybe we should re-index later? 
                // For now, keep the ID of the first occurrence to avoid breaking refs if any (though this is a flat list)
            });
        } else {
            // Merge
            const existing = mergedMap.get(cleanName);
            existing.frecuencia += item.frecuencia;
            // Keep the higher price if one exists
            existing.costo_sugerido = Math.max(existing.costo_sugerido, item.costo_sugerido);

            // Allow merging descriptions too? Maybe concatenate distinct ones? 
            // For now, keep the longest description or the one from the "main" item? 
            // Let's keep the longest description as it likely has more detail.
            if (item.descripcion && item.descripcion.length > existing.descripcion.length) {
                existing.descripcion = item.descripcion;
            }

            mergedMap.set(cleanName, existing);
        }
    });

    const newItems = Array.from(mergedMap.values());
    // Sort by frequency
    newItems.sort((a, b) => b.frecuencia - a.frecuencia);

    console.log(`Cleaned ${type}. New count: ${newItems.length}. Removed: ${items.length - newItems.length}`);
    return newItems;
};

if (catalog.servicios) {
    catalog.servicios = cleanArray(catalog.servicios, 'Servicios');
}

if (catalog.refacciones) {
    catalog.refacciones = cleanArray(catalog.refacciones, 'Refacciones');
}

// Update version/date
catalog.version = "14.0 - Unificación de Duplicados";
const now = new Date();
catalog.fecha_generacion = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

// Check specific user example
const check = catalog.refacciones.find(r => r.nombre.includes("Liqui Moly"));
if (check) {
    console.log("Validation Check (Liqui Moly):", check.nombre, check.frecuencia, check.costo_sugerido);
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log("Catalog updated successfully!");
