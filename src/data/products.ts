export interface Product {
    id: string;
    title: string;
    category: string;
    categoryId: string;
    price: number;
    image: string;
    waNumber?: string;
    gallery?: string[];
    colors?: string[];
}

export const CATEGORIES = [
    { id: 'all', name: 'Todos' },
    { id: 'moda', name: 'Moda Selva' },
    { id: 'cafe', name: 'Café Premium' },
    { id: 'artesania', name: 'Artesanías' },
    { id: 'visuals', name: 'Presets Visuales' },
];

export const products: Product[] = [
    {
        id: '1',
        title: 'Sombrero Amazonía',
        category: 'Moda Selva',
        categoryId: 'moda',
        price: 120.00,
        image: 'https://images.unsplash.com/photo-1576828831022-ae41d437a9a5?q=80&w=800&auto=format&fit=crop',
        colors: ['#D2B48C', '#8B4513']
    },
    {
        id: '2',
        title: 'Café Esmeralda 250g',
        category: 'Café Premium',
        categoryId: 'cafe',
        price: 45.00,
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=800&auto=format&fit=crop',
    },
    {
        id: '3',
        title: 'Collar de Semillas Huayruro',
        category: 'Artesanías',
        categoryId: 'artesania',
        price: 35.00,
        image: 'https://images.unsplash.com/photo-1611082216440-ad94fa07823f?q=80&w=800&auto=format&fit=crop',
        colors: ['#FF0000', '#000000']
    },
    {
        id: '4',
        title: 'Camisa Lino Tropical',
        category: 'Moda Selva',
        categoryId: 'moda',
        price: 180.00,
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop',
        colors: ['#FFFFFF', '#F5F5DC']
    },
    {
        id: '5',
        title: 'Pack Presets Jungle Glow',
        category: 'Presets Visuales',
        categoryId: 'visuals',
        price: 89.00,
        image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=800&auto=format&fit=crop',
    }
];
