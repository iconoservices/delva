import React from 'react';
import type { Product } from '../../../data/products';
import type { User } from '../../../App';
import { MarketplaceHeader } from '../../common/MarketplaceHeader';
import { CAT_STYLES } from '../../../constants/categoryStyles';

interface SelvaEleganteLayoutProps {
    storeName: string;
    storeLogo: string | null;
    storeBio: string;
    activeCategory: string;
    setActiveCategory: (val: string) => void;
    storeCategories: { id: string, name: string }[];
    displayProducts: Product[];
    ProductCard: React.ComponentType<{ product: Product, users?: User[], onQuickAdd?: (p: Product) => void }>;
    users?: User[];
    onQuickAdd?: (p: Product) => void;
    renderThemeSelector: () => React.ReactNode;
    isMarketplace?: boolean;
}

export const SelvaEleganteLayout: React.FC<SelvaEleganteLayoutProps> = ({
    storeName,
    storeLogo,
    storeBio,
    activeCategory,
    setActiveCategory,
    storeCategories,
    displayProducts,
    ProductCard,
    users,
    onQuickAdd,
    renderThemeSelector,
    isMarketplace
}) => {
    // Icons/Colors for category pills (Hoppy style)
    // Using shared CAT_STYLES from constants

    return (
        <div style={{ background: '#F8F9FA', minHeight: '100vh', paddingBottom: '120px', fontFamily: "'Outfit', sans-serif" }}>
            {renderThemeSelector()}

            {/* UNIFIED MARKETPLACE HEADER (If in Marketplace mode) */}
            {isMarketplace ? (
                <MarketplaceHeader 
                    categories={storeCategories}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                />
            ) : (
                /* COMPACT & PRO HEADER (For individual shops) */
                storeName !== 'Marketplace DELVA' && (
                    <header style={{ 
                        background: 'white', 
                        padding: '20px 20px 40px', 
                        textAlign: 'center',
                        borderRadius: '0 0 40px 40px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
                        borderBottom: '1px solid rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '15px' }}>
                            {storeLogo ? (
                                <div style={{ width: '45px', height: '45px', borderRadius: '15px', overflow: 'hidden', border: '1px solid #eee' }}>
                                    <img src={storeLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="logo" />
                                </div>
                            ) : <span style={{ fontSize: '1.5rem' }}>🌿</span>}
                            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--selva-green, #1B4332)', margin: 0, fontFamily: "'Montserrat', sans-serif" }}>{storeName}</h1>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#666', maxWidth: '300px', margin: '0 auto', lineHeight: 1.4 }}>{storeBio}</p>
                    </header>
                )
            )}

            {/* CATEGORY PILLS (Only if NOT in Marketplace - because MarketplaceHeader has them) */}
            {!isMarketplace && (
                <div style={{ 
                    marginTop: '25px', 
                    overflowX: 'auto', 
                    whiteSpace: 'nowrap', 
                    padding: '5px 20px', 
                    display: 'flex', 
                    gap: '12px',
                    scrollbarWidth: 'none'
                }}>
                    {storeCategories.map(cat => {
                        const style = CAT_STYLES[cat.id] || CAT_STYLES.default;
                        const isSel = activeCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className="pro-pill"
                                style={{
                                    background: isSel ? style.color : style.bg,
                                    color: isSel ? 'white' : style.color,
                                    boxShadow: isSel ? `0 8px 15px ${style.color}44` : 'none'
                                }}
                            >
                                <span>{isSel ? '✨' : style.icon}</span>
                                <span>{cat.name}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* CATALOG GRID */}
            <main className="container" style={{ marginTop: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1a1a1a' }}>
                        {isMarketplace ? 'Resultados de Búsqueda' : 'Explorar Productos'}
                    </h3>
                </div>

                {displayProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.4 }}>
                        <p>No hay productos en esta sección.</p>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', 
                        gap: '12px' 
                    }}>
                        {displayProducts.map(p => (
                            <ProductCard key={p.id} product={p} users={users} onQuickAdd={onQuickAdd} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
