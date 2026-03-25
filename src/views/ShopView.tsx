import { useLocation } from 'react-router-dom';
import React, { useEffect } from 'react';
import type { Product } from '../data/products';
import { type User, STORE_THEMES, THEME_DEFAULTS } from '../App';
import { SelvaEleganteLayout } from '../components/shop/themes/SelvaEleganteLayout';

interface ShopViewProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    activeCategory: string;
    setActiveCategory: (val: string) => void;
    globalCategories: { id: string, name: string }[];
    products: Product[]; 
    users: User[]; 
    ProductCard: React.ComponentType<{ product: Product, users?: User[] }>;
    currentUser: User | null;
    setEditingProduct: (p: any) => void;
    globalSocialLinks: any;
    SOCIAL_ICONS: any;
    compressImage: (file: File) => Promise<string>;
    confirmAction: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
    alertAction: (title: string, message: string) => void;
    addToCart: (p: Product) => void;
}

const ShopView: React.FC<ShopViewProps> = ({
    activeCategory,
    setActiveCategory,
    globalCategories,
    products,
    ProductCard,
    currentUser,
    users,
    addToCart
}) => {
    const loc = useLocation();
    const query = new URLSearchParams(loc.search);
    const shopId = query.get('u') || currentUser?.id || 'master';
    const isMainAdminId = shopId === 'master' || shopId === 'admin';
    const isMarketplace = !query.get('u');

    useEffect(() => {
        const catParam = query.get('cat');
        if (catParam) setActiveCategory(catParam);
    }, [loc.search, setActiveCategory]);

    if (users.length === 0) {
        return (
            <div className="container" style={{ padding: '100px 20px', textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}>
                <div className="skeleton" style={{ width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 20px' }}></div>
                <div className="skeleton" style={{ width: '200px', height: '30px', margin: '0 auto 10px' }}></div>
                <div className="skeleton" style={{ width: '300px', height: '15px', margin: '0 auto 40px' }}></div>
            </div>
        );
    }

    const storeOwner = isMarketplace ? null : (users.find(u => u.id === shopId) || users.find(u => u.id === 'master'));
    
    const storeName = isMarketplace ? "Marketplace DELVA" : (storeOwner?.storeName || storeOwner?.name || "Tienda");
    const storeLogo = isMarketplace ? null : (storeOwner?.storeLogo || storeOwner?.photoURL || null);
    const storeBio = isMarketplace 
        ? "Explora todos los productos de la comunidad Selva Elegante." 
        : (storeOwner?.storeBio || "Bienvenidos a nuestra tienda oficial.");

    const activeTheme = isMarketplace 
        ? { id: 'market', primary: '#1B4332' } 
        : (STORE_THEMES.find(t => t.id === (storeOwner?.themeId || 'organic-handmade')) || STORE_THEMES[0]);
    
    const themeDefaults = isMarketplace ? null : THEME_DEFAULTS[activeTheme.id || ''];
    const disabledCats = storeOwner?.disabledDefaultCategories || [];

    let storeCategories: { id: string; name: string }[];
    if (isMarketplace) {
        storeCategories = globalCategories;
    } else if (storeOwner?.storeCategories?.length) {
        storeCategories = [{ id: 'all', name: 'Todo' }, ...storeOwner.storeCategories];
    } else if (themeDefaults) {
        const active = themeDefaults.categories.filter(c => !disabledCats.includes(c.id));
        storeCategories = [{ id: 'all', name: 'Todo' }, ...active];
    } else {
        storeCategories = globalCategories;
    }

    // Determine which products to show
    const storeProducts = isMarketplace ? products : products.filter((p: Product) => (p as any).userId === shopId || (isMainAdminId && !(p as any).userId));
    
    const displayProducts = storeProducts.filter((p: Product) => {
        const matchesCat = activeCategory === 'all' || p.categoryId === activeCategory;
        return matchesCat;
    });

    const renderThemeSelector = () => {
        if (currentUser?.id !== storeOwner?.id) return null;
        return null; // Keep it clean for now
    };

    return (
        <SelvaEleganteLayout
            storeName={storeName}
            storeLogo={storeLogo}
            storeBio={storeBio}
            storeCategories={storeCategories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            displayProducts={displayProducts}
            ProductCard={ProductCard}
            users={users}
            onQuickAdd={addToCart}
            renderThemeSelector={renderThemeSelector}
        />
    );
};

export default ShopView;
