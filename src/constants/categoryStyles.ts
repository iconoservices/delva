/**
 * 🎨 SHARED CATEGORY STYLES
 * -------------------------
 * Centralized mapping of category IDs to their icons, background colors, and text colors.
 * Used by CategoryMenu and SelvaEleganteLayout for broad consistency.
 */

export interface CategoryStyle {
    bg: string;
    icon: string;
    color: string;
}

export const CAT_STYLES: Record<string, CategoryStyle> = {
    'all': { bg: '#FFF1F0', icon: '✦', color: '#CF1322' },
    'ropa': { bg: '#E6FFFB', icon: '', color: '#08979C' },
    'moda': { bg: '#E6FFFB', icon: '', color: '#08979C' }, // Alias for ropa
    'accesorios': { bg: '#F6FFED', icon: '', color: '#389E0D' },
    'cafe': { bg: '#FFF7E6', icon: '', color: '#D46B08' },
    'artesania': { bg: '#F9F0FF', icon: '', color: '#531DAB' },
    'belleza': { bg: '#FFF0F6', icon: '', color: '#C41D7F' },
    'hogar': { bg: '#F0F5FF', icon: '', color: '#1D39C4' },
    'tecnologia': { bg: '#E6F7FF', icon: '', color: '#096DD9' },
    'comida': { bg: '#FEFFE6', icon: '', color: '#AD8B00' },
    'default': { bg: '#F5F5F5', icon: '', color: '#555555' }
};
