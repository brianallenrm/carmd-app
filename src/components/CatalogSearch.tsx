'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface CatalogItem {
    id: number;
    nombre: string;
    descripcion: string;
    costo_sugerido: number;
    frecuencia: number;
    categoria?: string;
}

interface CatalogSearchProps {
    type: 'servicios' | 'refacciones';
    onSelect: (item: CatalogItem) => void;
    placeholder?: string;
    value?: string;
}

export default function CatalogSearch({
    type,
    onSelect,
    placeholder = 'Buscar...',
    value = ''
}: CatalogSearchProps) {
    const [searchQuery, setSearchQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<CatalogItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim().length > 0) {
                fetchSuggestions(searchQuery);
            } else {
                // Show top items when empty
                fetchSuggestions('');
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (query: string) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                type,
                search: query
            });

            const response = await fetch(`/api/catalog?${params}`);
            const data = await response.json();

            setSuggestions(data.results || []);
            setIsOpen(true);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (item: CatalogItem) => {
        setSearchQuery(item.nombre);
        setIsOpen(false);
        setSelectedIndex(-1);
        onSelect(item);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    handleSelect(suggestions[selectedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                        if (suggestions.length > 0) setIsOpen(true);
                        else fetchSuggestions(searchQuery);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F37014] focus:border-transparent"
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-[#F37014] border-t-transparent rounded-full"></div>
                    </div>
                )}
            </div>

            {/* Dropdown */}
            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    {suggestions.map((item, index) => (
                        <div
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-orange-50 transition-colors ${index === selectedIndex ? 'bg-orange-50' : ''
                                }`}
                        >
                            <div className="font-medium text-gray-900 text-sm">
                                {item.nombre}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <span className="font-semibold">{item.frecuencia}</span> veces
                                </span>
                                {item.costo_sugerido > 0 && (
                                    <span className="flex items-center gap-1">
                                        <span className="font-semibold text-[#F37014]">
                                            ${item.costo_sugerido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </span>
                                    </span>
                                )}
                                {item.categoria && (
                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                                        {item.categoria}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Results */}
            {isOpen && !isLoading && suggestions.length === 0 && searchQuery.trim().length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                    No se encontraron resultados para "{searchQuery}"
                </div>
            )}
        </div>
    );
}
