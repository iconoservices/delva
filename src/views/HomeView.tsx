import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../data/products';
import { type User } from '../App';
import SocialHubCard from '../components/home/SocialHubCard';
import { MarketplaceHeader } from '../components/common/MarketplaceHeader';

interface HomeViewProps {
    products: Product[];
    users: User[];
    globalCategories: { id: string, name: string }[];
    addToCart: (p: Product) => void;
    currentUser: User | null;
    banners: any[];
    globalBrandName: string;
    activeCategory: string;
    setActiveCategory: (val: string) => void;
    ProductCard: any;
    onRecordSale?: (p: Product) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ 
    products, 
    users, 
    globalCategories, 
    addToCart, 
    currentUser,
    banners,
    globalBrandName,
    activeCategory,
    setActiveCategory,
    ProductCard: PassedProductCard,
    onRecordSale
}) => {
    const navigate = useNavigate();
    const [visibleSections, setVisibleSections] = useState(3);
    const observerTarget = useRef(null);



    /**
     * 🧠 ALGORITMO 70/30 (Recomendación inteligente)
     */
    const smartSections = useMemo(() => {
        const userPrefs = (currentUser as any)?.categoryPrefs || {};
        const sortedCats = [...globalCategories]
            .filter(c => c.id !== 'all')
            .sort((a,b) => (userPrefs[b.id]||0) - (userPrefs[a.id]||0));

        // ✅ CRITICAL FIX: Only use PUBLISHED products for the storefront
        const publishedProducts = products.filter(p => (p as any).published !== false);

        const topCat = sortedCats[0]?.id || 'ropa';

        const getMix = (prefCatId: string, count: number) => {
            const prefItems = publishedProducts.filter(p => prefCatId === 'all' ? true : p.categoryId === prefCatId).slice(0, Math.ceil(count * 0.7));
            const otherItems = publishedProducts.filter(p => p.categoryId !== prefCatId).slice(0, count - prefItems.length);
            return [...prefItems, ...otherItems]; // Removed random sort
        };

        const baseSections = [
            {
                id: 'hot_carousel',
                title: 'Lo Más Pedido 🔥',
                layout: 'carousel',
                items: [...publishedProducts].slice(0, 8) // Deterministic order
            },
            {
                id: 'recommended_grid',
                title: 'Recomendado para ti ✨',
                layout: 'grid',
                items: getMix(topCat, 4)
            },
            {
                id: 'new_arrivals',
                title: 'Lo Nuevo en la Selva 🌿',
                layout: 'grid',
                items: getMix('all', 4)
            }
        ];

        // 🌊 STABLE INFINITE SCROLL GENERATOR
        // We generate a reasonable number of sections (e.g., 20) instead of 50.
        // We use a deterministic approach instead of Math.random() in every loop.
        const infiniteSections: any[] = [];
        const pool = [...publishedProducts];
        
        for (let i = 0; i < 20; i++) {
            // Pick a stable set of items based on index to prevent reshuffling
            const startIndex = (i * 4) % Math.max(1, pool.length);
            const slice = pool.slice(startIndex, startIndex + 4);
            if (slice.length < 4) slice.push(...pool.slice(0, 4 - slice.length));

            // ✅ No more automated hero promos per user request
            infiniteSections.push({
                id: `inf_grid_${i}`,
                title: '',
                layout: 'grid',
                items: slice
            });
        }

        return [...baseSections, ...infiniteSections];
    }, [products, currentUser, globalCategories]);

    /**
     * ⚡ INFINITE SCROLL LOGIC
     */
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleSections < smartSections.length) {
                    // Small delay for smooth feel
                    setTimeout(() => setVisibleSections(prev => prev + 1), 200);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [visibleSections, smartSections.length]);

    return (
        <div className="home-view" style={{ fontFamily: '"Outfit", sans-serif', background: '#F8F9FA', minHeight: '100vh' }}>
            <main style={{ padding: '0 0 80px' }}>
                
                {/* ── UNIFIED MARKETPLACE HEADER ── */}
                <MarketplaceHeader 
                    categories={globalCategories}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    globalBrandName={globalBrandName}
                    banners={banners}
                />

                <div className="content-shell" style={{ maxWidth: '1400px', margin: '0 auto' }}>

                    {/* ── SECCIONES SMART ── */}
                    {smartSections.slice(0, visibleSections).map((section) => (
                        <section 
                            key={section.id} 
                            className="fade-in"
                            style={{ marginBottom: '30px' }}
                        >
                            {section.title && (
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'flex-end', 
                                    padding: '0 20px',
                                    gap: '15px',
                                    marginBottom: '15px' 
                                }}>
                                    <h3 style={{ 
                                        fontSize: '1.25rem', 
                                        fontWeight: 900, 
                                        color: '#111', 
                                        margin: 0, 
                                        letterSpacing: '-0.3px',
                                        lineHeight: 1.1 
                                    }}>
                                        {section.title}
                                    </h3>
                                    <button 
                                        onClick={() => navigate('/tienda')} 
                                        style={{ 
                                            background: 'none', border: 'none', color: '#00a651', 
                                            fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer',
                                            letterSpacing: '0.5px', flexShrink: 0, whiteSpace: 'nowrap',
                                            paddingBottom: '3px'
                                        }}
                                    >
                                        VER TODO →
                                    </button>
                                </div>
                            )}

                            {/* CAROUSEL FORMAT */}
                            {section.layout === 'carousel' && (
                                <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '0 20px 10px', scrollbarWidth: 'none' }}>
                                    {section.items.map((p: any) => (
                                        <div key={p.id} style={{ minWidth: '165px' }}>
                                            <PassedProductCard product={p} users={users} onQuickAdd={addToCart} currentUser={currentUser} onRecordSale={onRecordSale} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* RESPONSIVE GRID */}
                            {section.layout === 'grid' && (
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', 
                                    gap: '12px', 
                                    padding: '0 20px' 
                                }}>
                                    {section.items.map((p: any) => (
                                        <PassedProductCard key={p.id} product={p} users={users} onQuickAdd={addToCart} currentUser={currentUser} onRecordSale={onRecordSale} />
                                    ))}
                                </div>
                            )}

                            {/* SOCIAL HUB */}
                            {section.layout === 'social' && (
                                <div style={{ display: 'flex', gap: '22px', overflowX: 'auto', padding: '0 20px 20px', scrollbarWidth: 'none' }}>
                                    {section.items.map((p: any) => {
                                        const author = users.find(u => u.id === p.userId);
                                        return (
                                            <div key={p.id} style={{ minWidth: '285px' }}>
                                                <SocialHubCard product={p} author={author} onQuickAdd={addToCart} onRecordSale={onRecordSale} currentUser={currentUser} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* HERO PRO (Con 'Difuminado') */}
                            {section.layout === 'hero' && section.items[0] && (
                                <div style={{ padding: '0 20px' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary)', opacity: 0.5, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        💎 PRODUCTO DESTACADO
                                    </p>
                                    <div 
                                        onClick={() => navigate(`/producto/${section.items[0].id}`)}
                                        className="hero-promo-card"
                                        style={{ 
                                            position: 'relative', 
                                            borderRadius: '30px', 
                                            overflow: 'hidden', 
                                            cursor: 'pointer',
                                            boxShadow: 'var(--shadow-lg)',
                                            background: '#151515'
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            backgroundImage: `url(${section.items[0].image})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            filter: 'blur(35px) brightness(0.6)',
                                            transform: 'scale(1.2)',
                                        }} />
                                        <div className="hero-promo-split">
                                            <div className="hero-promo-img">
                                                <img 
                                                    src={section.items[0].image} 
                                                    className="hero-promo-img-inner"
                                                    alt={section.items[0].title}
                                                />
                                            </div>
                                            <div className="hero-promo-text">
                                                <h4 style={{ color: 'white', fontSize: '1.6rem', margin: '0 0 8px', fontWeight: 950, letterSpacing: '-0.5px' }}>{section.items[0].title}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Colección Exclusiva</span>
                                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                                    <span style={{ fontSize: '1.2rem', color: '#FFD700', fontWeight: 950 }}>S/ {section.items[0].price}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    ))}

                    {/* SENTINEL FOR INFINITE SCROLL */}
                    <div ref={observerTarget} style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {visibleSections < smartSections.length ? (
                            <div className="pro-spinner"></div>
                        ) : (
                            <div style={{ padding: '60px 0', textAlign: 'center', opacity: 0.3, fontSize: '0.8rem', fontWeight: 800 }}>
                                <p>• FIN DE RESULTADOS •</p>
                            </div>
                        )}
                    </div>
                </div>
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#bbb', fontWeight: 900, letterSpacing: '3px', marginTop: '40px', textTransform: 'uppercase' }}>
                    Delva · Smart Marketplace Pro
                </p>
            </main>
        </div>
    );
};

export default HomeView;