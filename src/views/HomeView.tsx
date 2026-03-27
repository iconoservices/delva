import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Product } from '../data/products';
import { type User } from '../types';

import SocialHubCard from '../components/home/SocialHubCard';
import { MarketplaceHeader } from '../components/common/MarketplaceHeader';
import ProductCard from '../components/common/ProductCard';

interface HomeViewProps {
    products: Product[];
    users: User[];
    globalCategories: { id: string, name: string }[];
    isLoading?: boolean;
    addToCart: (p: Product) => void;
    currentUser: User | null;
    banners: any[];
    globalBrandName: string;
    activeCategory: string;
    setActiveCategory: (val: string) => void;
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
    onRecordSale,
    isLoading
}) => {
    const navigate = useNavigate();
    const { categoryId, subCategoryId } = useParams();
    const [visibleSections, setVisibleSections] = useState(3);
    const observerTarget = useRef(null);

    // 🚀 LOCAL STATE FOR INSTANT UI FEEDBACK (Eliminates lag)
    const [localActiveCat, setLocalActiveCat] = useState(activeCategory);
    const [activeSub, setActiveSub] = useState('all');
    const sessionSeed = useRef(Math.floor(Math.random() * 100)).current;
    const [manualRefresh, setManualRefresh] = useState(0); // 🎲 Allows forced re-shuffle

    // Sync URL parameter with global state + Reset scroll
    useEffect(() => {
        const targetSlug = categoryId;
        if (targetSlug) {
            // Find category by slug, id, or normalized name
            const foundCat = globalCategories.find(c => 
                (c as any).slug?.toLowerCase() === targetSlug.toLowerCase() ||
                c.id.toLowerCase() === targetSlug.toLowerCase() || 
                c.name.toLowerCase().replace(/\s+/g, '-') === targetSlug.toLowerCase()
            );
            const actualId = foundCat?.id || targetSlug;
            
            // 👻 GHOST REDIRECT: moda -> moda-selva
            if (actualId === 'moda') {
                navigate('/categoria/moda-selva', { replace: true });
                return;
            }

            if (actualId !== activeCategory) {
                setActiveCategory(actualId);
                setLocalActiveCat(actualId);
                
                // Find subcategory by slug if subCategoryId exists in URL
                let actualSubId = 'all';
                if (subCategoryId) {
                    const foundSub = (foundCat as any)?.subCategories?.find((s: any) => 
                        s.slug?.toLowerCase() === subCategoryId.toLowerCase() ||
                        s.id.toLowerCase() === subCategoryId.toLowerCase() ||
                        s.name.toLowerCase().replace(/\s+/g, '-') === subCategoryId.toLowerCase()
                    );
                    actualSubId = foundSub?.id || subCategoryId;
                }
                
                setActiveSub(actualSubId);
                setVisibleSections(3);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // Same category, but subcategory might have changed in URL
                let actualSubId = 'all';
                if (subCategoryId) {
                    const foundSub = (foundCat as any)?.subCategories?.find((s: any) => 
                        s.slug?.toLowerCase() === subCategoryId.toLowerCase() ||
                        s.id.toLowerCase() === subCategoryId.toLowerCase() ||
                        s.name.toLowerCase().replace(/\s+/g, '-') === subCategoryId.toLowerCase()
                    );
                    actualSubId = foundSub?.id || subCategoryId;
                }
                setActiveSub(actualSubId);
            }
        } else if (activeCategory !== 'all') {
            setActiveCategory('all');
            setLocalActiveCat('all');
            setActiveSub('all');
            setVisibleSections(3);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [categoryId, subCategoryId, setActiveCategory, globalCategories]);

    // Handle Category Click (SEO Hybrid)
    const handleCategoryChange = (id: string) => {
        if (id === localActiveCat && id === 'all') {
            setManualRefresh(prev => prev + 1); // Re-shuffle on re-click
        }

        const cat = globalCategories.find(c => c.id === id);
        const slug = (cat as any)?.slug || cat?.id || 'categoria';

        setLocalActiveCat(id); // Instant visual update
        setActiveCategory(id);
        if (id === 'all') navigate('/');
        else navigate(`/categoria/${slug}`);
        setVisibleSections(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    /**
     * 🧠 ALGORITMO 70/30 (Recomendación inteligente y barajado pesado)
     */
    const smartSections = useMemo(() => {
        const userPrefs = (currentUser as any)?.categoryPrefs || {};
        
        // Determinar si es PC o Móvil (aproximación por ancho de ventana)
        const isPC = typeof window !== 'undefined' && window.innerWidth > 768;
        const count = isPC ? 10 : 4; // 4 para móvil (solicitado), 10 para PC

        const sortedCats = [...globalCategories]
            .filter(c => c.id !== 'all')
            .sort((a,b) => (userPrefs[b.id]||0) - (userPrefs[a.id]||0));

        // FILTER POOL BY ACTIVE CATEGORY FIRST
        let basePool = products.filter(p => (p as any).published !== false);
        
        if (activeCategory !== 'all') {
            const activeCatName = globalCategories.find(c => c.id === activeCategory)?.name?.toLowerCase();
            basePool = basePool.filter(p => {
                const pCatId = (p as any).categoryId?.toLowerCase();
                const pCatName = (p as any).category?.toLowerCase();
                const matchesParent = pCatId === activeCategory.toLowerCase() || 
                       pCatName === activeCategory.toLowerCase() ||
                       (activeCatName && pCatName === activeCatName);
                
                if (!matchesParent) return false;

                // Subcategory secondary filter
                if (activeSub !== 'all') {
                    const pSubId = (p as any).subCategoryId?.toLowerCase();
                    const pSubName = (p as any).subCategory?.toLowerCase();
                    return pSubId === activeSub.toLowerCase() || pSubName === activeSub.toLowerCase();
                }

                return true;
            });
        }

        // 🔒 STABLE-VARIETY SHUFFLE (Deterministic per session/category)
        const weightedShuffle = (arr: any[]) => {
            const catSeed = activeCategory.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
            return [...arr].sort((a, b) => {
                const idA = a.id.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
                const idB = b.id.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
                
                // Deterministic weights that vary by category, session AND manual refresh
                const weightA = ((idA * 17 + catSeed * 7 + sessionSeed + manualRefresh) % 100) + (Number(a.price || 0) * 0.01);
                const weightB = ((idB * 17 + catSeed * 7 + sessionSeed + manualRefresh) % 100) + (Number(b.price || 0) * 0.01);
                
                return weightB - weightA;
            });
        };


        const getMix = (prefCatId: string, limit: number) => {
            // Priority category matches
            const prefCatName = globalCategories.find(c => c.id === prefCatId)?.name?.toLowerCase();
            
            const allItems = prefCatId === 'all' 
                ? basePool 
                : basePool.filter(p => {
                    const pCatId = (p as any).categoryId?.toLowerCase();
                    const pCatName = (p as any).category?.toLowerCase();
                    return pCatId === prefCatId.toLowerCase() || 
                           pCatName === prefCatId.toLowerCase() ||
                           (prefCatName && pCatName === prefCatName);
                });
            
            const shuffled = weightedShuffle(allItems);
            const prefItems = shuffled.slice(0, Math.ceil(limit * 0.7));
            
            const others = basePool.filter(p => !prefItems.find(pi => pi.id === p.id));
            const shuffledOthers = weightedShuffle(others);
            
            return [...prefItems, ...shuffledOthers].slice(0, limit);
        };

        if (activeCategory !== 'all') {
            const activeCatObj = globalCategories.find(c => c.id === activeCategory);
            const activeSubObj = (activeCatObj as any)?.subCategories?.find((s: any) => s.id === activeSub);
            const displayTitle = activeSub !== 'all' && activeSubObj 
                ? `${activeCatObj?.name} → ${activeSubObj.name}` 
                : (activeCatObj?.name || 'Productos');

            return [
                {
                    id: 'category_grid',
                    title: displayTitle,
                    layout: 'grid',
                    items: weightedShuffle(basePool)
                }
            ];
        }

        const baseSections = [
            {
                id: 'hot_carousel',
                title: 'Lo Más Pedido',
                layout: 'carousel',
                items: weightedShuffle(basePool).slice(0, 12)
            },
            {
                id: 'recommended_grid',
                title: 'Recomendado para ti',
                layout: 'grid',
                items: getMix(sortedCats[0]?.id || 'ropa', count)
            },
            {
                id: 'new_arrivals',
                title: 'Lo Nuevo en la Selva',
                layout: 'grid',
                items: getMix('all', count)
            }
        ];

        // 🌊 STABLE INFINITE SCROLL GENERATOR (Only for "All")
        const infiniteSections: any[] = [];
        const pool = weightedShuffle(basePool);
        
        for (let i = 0; i < 15; i++) {
            const startIndex = (i * count) % Math.max(1, pool.length);
            let slice = pool.slice(startIndex, startIndex + count);
            if (slice.length < count) slice.push(...pool.slice(0, count - slice.length));

            if (i > 0 && i % 4 === 0 && pool.length > 0) {
                infiniteSections.push({
                    id: `inf_hero_${i}`,
                    title: '',
                    layout: 'hero',
                    items: [pool[(i * 2) % pool.length]]
                });
            }

            infiniteSections.push({
                id: `inf_grid_${i}`,
                title: '',
                layout: 'grid',
                items: slice
            });
        }

        return [...baseSections, ...infiniteSections];
    }, [products, currentUser, globalCategories, activeCategory, activeSub, manualRefresh]);

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
            <div className="home-content" style={{ padding: '0 0 80px' }}>
                
                {/* ── UNIFIED MARKETPLACE HEADER ── */}
                <MarketplaceHeader 
                    categories={globalCategories}
                    activeCategory={localActiveCat}
                    setActiveCategory={handleCategoryChange}
                    globalBrandName={globalBrandName}
                    banners={banners}
                />

                {/* ── SUBCATEGORY RIBBON ── */}
                {localActiveCat !== 'all' && (
                    <div className="subcategory-ribbon fade-in" style={{ padding: '0 20px', marginBottom: '20px', overflowX: 'auto', display: 'flex', gap: '10px', scrollbarWidth: 'none' }}>
                        <button 
                            onClick={() => {
                                const cat = globalCategories.find(c => c.id === localActiveCat);
                                const slug = (cat as any)?.slug || cat?.id || localActiveCat;
                                setActiveSub('all');
                                navigate(`/categoria/${slug}`);
                            }}
                            style={{ 
                                padding: '8px 18px', borderRadius: '14px', border: 'none',
                                background: activeSub === 'all' ? 'var(--primary)' : 'white',
                                color: activeSub === 'all' ? 'white' : '#666',
                                fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                                transition: '0.3s', whiteSpace: 'nowrap',
                                boxShadow: activeSub === 'all' ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 5px rgba(0,0,0,0.05)'
                            }}
                        >
                            Todo en {(globalCategories.find(c => c.id === localActiveCat) as any)?.name || 'Categoría'}
                        </button>
                        {((globalCategories.find(c => c.id === localActiveCat) as any)?.subCategories || []).map((sub: any) => (
                            <button 
                                key={sub.id}
                                onClick={() => {
                                    const cat = globalCategories.find(c => c.id === localActiveCat);
                                    const parentSlug = (cat as any)?.slug || cat?.id || localActiveCat;
                                    const subSlug = sub.slug || sub.id;
                                    setActiveSub(sub.id);
                                    navigate(`/categoria/${parentSlug}/${subSlug}`);
                                }}
                                style={{ 
                                    padding: '8px 18px', borderRadius: '14px', border: 'none',
                                    background: activeSub === sub.id ? 'var(--primary)' : 'white',
                                    color: activeSub === sub.id ? 'white' : '#666',
                                    fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                                    transition: '0.3s', whiteSpace: 'nowrap',
                                    boxShadow: activeSub === sub.id ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 5px rgba(0,0,0,0.05)'
                                }}
                            >
                                {sub.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="content-shell" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    {isLoading && (
                        <div className="container" style={{ marginTop: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: '15px' }}>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '20px' }} />
                                ))}
                            </div>
                        </div>
                    )}

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
                                    {activeCategory === 'all' && (
                                        <button 
                                            onClick={() => navigate('/tienda')} 
                                            style={{ 
                                                background: 'none', border: 'none', color: '#00a651', 
                                                fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer',
                                                letterSpacing: '0.5px', flexShrink: 0, whiteSpace: 'nowrap',
                                                paddingBottom: '3px'
                                            }}
                                        >
                                            DESCUBRIR MÁS →
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* CAROUSEL FORMAT */}
                            {section.layout === 'carousel' && (
                                <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '0 20px 10px', scrollbarWidth: 'none' }}>
                                    {section.items.map((p: any) => (
                                        <div key={p.id} style={{ minWidth: '165px' }}>
                                            <ProductCard product={p} users={users} onQuickAdd={addToCart} />
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
                                        <ProductCard key={p.id} product={p} users={users} onQuickAdd={addToCart} />
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
                </div>

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
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#bbb', fontWeight: 900, letterSpacing: '3px', marginTop: '40px', textTransform: 'uppercase' }}>
                    Delva · Smart Marketplace Pro
                </p>
            </div>
        </div>
    );
};

export default HomeView;