import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../data/products';
import { type User } from '../App';
import GrandHeroCarousel from '../components/common/GrandHeroCarousel';
import SocialHubCard from '../components/home/SocialHubCard';

interface HomeViewProps {
    products: Product[];
    users: User[];
    globalCategories: { id: string, name: string }[];
    addToCart: (p: Product) => void;
    currentUser: User | null;
    banners: any[];
    currentBannerIndex: number;
    globalBrandName: string;
    activeCategory: string;
    setActiveCategory: (val: string) => void;
    viewMode: string;
    setViewMode: (val: any) => void;
    ProductCard: any;
}

const HomeView: React.FC<HomeViewProps> = ({ 
    products, 
    users, 
    globalCategories, 
    addToCart, 
    currentUser,
    ProductCard: PassedProductCard 
}) => {
    const navigate = useNavigate();
    const [visibleSections, setVisibleSections] = useState(3);
    const observerTarget = useRef(null);

    // 🎨 Estilos 'Hoppy' para categorías
    const catStyles: Record<string, { bg: string, icon: string, color: string }> = {
        'all': { bg: '#FFF1F0', icon: '✨', color: '#CF1322' },
        'ropa': { bg: '#E6FFFB', icon: '👗', color: '#08979C' },
        'accesorios': { bg: '#F6FFED', icon: '💎', color: '#389E0D' },
        'cafe': { bg: '#FFF7E6', icon: '☕', color: '#D46B08' },
        'artesania': { bg: '#F9F0FF', icon: '🎨', color: '#531DAB' },
        'default': { bg: '#F5F5F5', icon: '📦', color: '#555555' }
    };

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
            const otherItems = publishedProducts.filter(p => p.categoryId !== prefCatId).sort(() => 0.5 - Math.random()).slice(0, count - prefItems.length);
            return [...prefItems, ...otherItems].sort(() => 0.5 - Math.random());
        };

        const baseSections = [
            {
                id: 'hot_carousel',
                title: 'Lo Más Pedido 🔥',
                layout: 'carousel',
                items: [...publishedProducts].sort(() => 0.5 - Math.random()).slice(0, 8)
            },
            {
                id: 'recommended_grid',
                title: 'Recomendado para ti ✨',
                layout: 'grid',
                items: getMix(topCat, 4)
            },
            {
                id: 'hero_featured',
                title: 'Boutique Destacada 💎',
                layout: 'hero',
                items: publishedProducts.filter(p => p.categoryId === topCat || p.categoryId === 'ropa').slice(0, 1)
            },
            {
                id: 'new_arrivals',
                title: 'Lo Nuevo en la Selva 🌿',
                layout: 'grid',
                items: getMix('all', 4).reverse()
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

            if (i % 6 === 5) {
                infiniteSections.push({
                    id: `inf_hero_${i}`,
                    title: '',
                    layout: 'hero',
                    items: [pool[i % pool.length]]
                });
            } else {
                infiniteSections.push({
                    id: `inf_grid_${i}`,
                    title: '',
                    layout: 'grid',
                    items: slice
                });
            }
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
                
                {/* ── BANER COMPACTO EXACTO ── */}
                <section style={{ marginTop: '20px', marginBottom: '0px' }}>
                    <GrandHeroCarousel onCtaClick={(link) => navigate(link)} />
                </section>

                <div className="content-shell" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {/* ── CATEGORIES PILLS (Hoppy Style) ── */}
                    <section style={{ 
                        padding: '15px 0 25px', 
                        overflowX: 'auto', 
                        display: 'flex', 
                        gap: '14px', 
                        paddingLeft: '20px',
                        paddingRight: '20px',
                        scrollbarWidth: 'none'
                    }}>
                        {[{ id: 'all', name: 'Todo' }, ...globalCategories.filter(c => c.id !== 'all')].map((cat: any) => {
                            const style = catStyles[cat.id] || catStyles.default;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => navigate(`/tienda${cat.id !== 'all' ? `?cat=${cat.id}` : ''}`)}
                                    style={{ 
                                        background: style.bg, 
                                        color: style.color,
                                        border: 'none',
                                        padding: '13px 24px',
                                        borderRadius: '50px',
                                        fontFamily: '"Outfit", sans-serif',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '9px',
                                        whiteSpace: 'nowrap',
                                        fontWeight: 800,
                                        fontSize: '0.92rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                                    }}
                                >
                                    <span>{style.icon}</span>
                                    <span>{cat.name}</span>
                                </button>
                            );
                        })}
                    </section>

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
                                            background: 'none', border: 'none', color: '#FF5722', 
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
                                            <PassedProductCard product={p} users={users} onQuickAdd={addToCart} />
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
                                        <PassedProductCard key={p.id} product={p} users={users} onQuickAdd={addToCart} />
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
                                                <SocialHubCard product={p} author={author} onQuickAdd={addToCart} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* HERO PRO (Con 'Difuminado') */}
                            {section.layout === 'hero' && section.items[0] && (
                                <div style={{ padding: '0 20px' }}>
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