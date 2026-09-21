'use client';

import React, { useState, useEffect, useMemo, useRef, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Product } from '@/lib/data/products';
import { type User } from '@/lib/types';
import { useApp } from '@/lib/context/AppContext';
import ProductCarousel from '@/components/home/ProductCarousel';
import { matchesQuery } from '@/lib/utils/search';

import SocialHubCard from '@/components/home/SocialHubCard';
import { MarketplaceHeader } from '@/components/common/MarketplaceHeader';
import { MarketplaceSidebar } from '@/components/common/MarketplaceSidebar';
import { CategoryMenu } from '@/components/common/CategoryMenu';
import { ShortcutRibbon } from '@/components/common/ShortcutRibbon';
import ProductCard from '@/components/common/ProductCard';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, limit, orderBy } from 'firebase/firestore';

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
    const router = useRouter();
    const params = useParams();
    const categoryId = params?.categoryId || params?.slug;
    const subCategoryId = params?.subCategoryId || params?.subSlug;

    const [visibleSections, setVisibleSections] = useState(3);
    const observerTarget = useRef(null);
    const [, startTransition] = useTransition();
    const isProgrammaticNav = useRef(false); // Flag to avoid double-update from useEffect
    const { searchTerm, setSearchTerm } = useApp();
    const [activeColor, setActiveColor] = useState('');
    const [activeGlobalFilter, setActiveGlobalFilter] = useState<'all' | 'offers' | 'reservations' | 'new'>('all');

    // Hydration-safe resize handler
    const [innerWidth, setInnerWidth] = useState(0); // 0 = aún no medido (evita mostrar el diseño equivocado al cargar)
    useEffect(() => {
        setInnerWidth(window.innerWidth);
        const handleResize = () => setInnerWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 🚀 LOCAL STATE: Inicializar desde URL
    const getInitialCat = () => {
        const targetSlug = categoryId as string;
        if (!targetSlug) return 'all';
        const foundCat = globalCategories.find(c =>
            (c as any).slug?.toLowerCase() === targetSlug.toLowerCase() ||
            c.id.toLowerCase() === targetSlug.toLowerCase() ||
            c.name.toLowerCase().replace(/\s+/g, '-') === targetSlug.toLowerCase()
        );
        return foundCat?.id || targetSlug;
    };
    const [localActiveCat, setLocalActiveCat] = useState<string>(getInitialCat);
    const [activeSub, setActiveSub] = useState('all');
    // 🔑 SESSION SEED: Persiste en sessionStorage para que no cambie al navegar entre categorías
    const sessionSeed = useRef((() => {
        if (typeof window === 'undefined') return 42; // SSR fallback
        const key = 'delva_session_seed_v1';
        const stored = sessionStorage.getItem(key);
        if (stored) return parseInt(stored, 10);
        const seed = Math.floor(Math.random() * 10000);
        sessionStorage.setItem(key, String(seed));
        return seed;
    })()).current;
    // 🔄 ROTATION SEED: Cambia cada 4 horas, igual para todos los dispositivos con el mismo horario
    const rotationSeed = useRef(Math.floor(Date.now() / (1000 * 60 * 60 * 4))).current;
    const [manualRefresh, setManualRefresh] = useState(0); 

    // 🚀 UNIFIED SYNC
    useEffect(() => {
        const targetSlug = categoryId as string;
        if (!targetSlug) {
            if (localActiveCat !== 'all') {
                setLocalActiveCat('all');
                setActiveSub('all');
            }
            if (activeCategory !== 'all') setActiveCategory('all');
            return;
        }

        const foundCat = globalCategories.find(c =>
            (c as any).slug?.toLowerCase() === targetSlug.toLowerCase() ||
            c.id.toLowerCase() === targetSlug.toLowerCase() ||
            c.name.toLowerCase().replace(/\s+/g, '-') === targetSlug.toLowerCase()
        );
        const actualId = foundCat?.id || targetSlug;

        if (actualId !== localActiveCat) {
            // Only update if NOT already handled by handleCategoryChange
            if (!isProgrammaticNav.current) {
                setLocalActiveCat(actualId);
                setVisibleSections(3);
            }
            isProgrammaticNav.current = false;
        }
        if (actualId !== activeCategory) setActiveCategory(actualId);

        let actualSubId = 'all';
        if (subCategoryId) {
            const foundSub = (foundCat as any)?.subCategories?.find((s: any) =>
                s.slug?.toLowerCase() === (subCategoryId as string).toLowerCase() ||
                s.id.toLowerCase() === (subCategoryId as string).toLowerCase() ||
                s.name.toLowerCase().replace(/\s+/g, '-') === (subCategoryId as string).toLowerCase()
            );
            actualSubId = foundSub?.id || (subCategoryId as string);
        }
        if (actualSubId !== activeSub) setActiveSub(actualSubId);
    }, [categoryId, subCategoryId, globalCategories]);

    const handleCategoryChange = (id: string) => {
        const cat = globalCategories.find(c => c.id === id);
        const slug = (cat as any)?.slug || cat?.id || 'categoria';
        isProgrammaticNav.current = true; // Signal to useEffect to skip double-update
        startTransition(() => {
            setLocalActiveCat(id);
            setActiveCategory(id);
            setVisibleSections(3);
        });
        if (id === 'all') router.push('/');
        else router.push(`/categoria/${slug}`);
        window.scrollTo({ top: 0 }); // instant, no 'smooth' during transition
    };

    const smartSections = useMemo(() => {
        const userPrefs = (currentUser as any)?.categoryPrefs || {};
        const isPC = innerWidth > 1024;
        const count = isPC ? 10 : 4;

        const sortedCats = [...globalCategories]
            .filter(c => c.id !== 'all')
            .sort((a,b) => (userPrefs[b.id]||0) - (userPrefs[a.id]||0));

        let basePool = products.filter(p => (p as any).published !== false);

        if (searchTerm) {
            basePool = basePool.filter(p => matchesQuery([p.title, p.category, p.sku, (p as any).description], searchTerm));
        }

        if (activeColor) {
            basePool = basePool.filter(p => (p.colors || []).includes(activeColor));
        }

        if (activeGlobalFilter === 'offers') {
            basePool = basePool.filter(p => (p.hasOffer || (p.originalPrice && Number(p.originalPrice) > Number(p.price))) && (Number(p.stock) || 0) > 0);
        } else if (activeGlobalFilter === 'reservations') {
            basePool = basePool.filter(p => (Number(p.stock) || 0) <= 0);
        } else if (activeGlobalFilter === 'new') {
            const oneWeekAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
            basePool = basePool.filter(p => p.createdAt && new Date(p.createdAt).getTime() > oneWeekAgo && (Number(p.stock) || 0) > 0);
        }
        
        if (activeCategory !== 'all') {
            basePool = basePool.filter(p => {
                const matchesParent = (p as any).categoryId === activeCategory || (p as any).category?.toLowerCase() === globalCategories.find(c => c.id === activeCategory)?.name?.toLowerCase();
                if (!matchesParent) return false;
                if (activeSub !== 'all') {
                    return (p as any).subCategoryId === activeSub || (p as any).subCategory?.toLowerCase() === activeSub.toLowerCase();
                }
                return true;
            });
        }

        const weightedShuffle = (arr: any[], mode: 'popular' | 'random' | 'recent' = 'random') => {
            return [...arr].sort((a, b) => {
                const stockA = (Number(a.stock) || 0) > 0 ? 1 : 0;
                const stockB = (Number(b.stock) || 0) > 0 ? 1 : 0;
                
                // 1. Stock Priority (Always first)
                if (stockA !== stockB) return stockB - stockA; 

                // 2. Mode specific weights
                let weightA = 0;
                let weightB = 0;

                const oneWeekAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
                const isRecentA = a.createdAt && new Date(a.createdAt).getTime() > oneWeekAgo;
                const isRecentB = b.createdAt && new Date(b.createdAt).getTime() > oneWeekAgo;

                if (mode === 'popular') {
                    // Weighted by viewCount + rotation
                    const randA = (a.id.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) * 17 + rotationSeed) % 50;
                    const randB = (b.id.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) * 17 + rotationSeed) % 50;
                    weightA = (Number(a.viewCount) || 0) * 5 + randA;
                    weightB = (Number(b.viewCount) || 0) * 5 + randB;
                } else if (mode === 'recent') {
                    // Strictly by date, then popularity
                    weightA = isRecentA ? 1000 + (Number(a.viewCount) || 0) : (Number(a.viewCount) || 0);
                    weightB = isRecentB ? 1000 + (Number(b.viewCount) || 0) : (Number(b.viewCount) || 0);
                } else {
                    // Default Stable Random (Stable across categories)
                    const idANum = a.id.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
                    const idBNum = b.id.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
                    weightA = ((idANum * 13 + sessionSeed + manualRefresh) % 100);
                    weightB = ((idBNum * 13 + sessionSeed + manualRefresh) % 100);
                    
                    // Small boost for popular and new even in random
                    if (isRecentA) weightA += 10;
                    if (isRecentB) weightB += 10;
                    weightA += (Number(a.viewCount) || 0) / 10;
                    weightB += (Number(b.viewCount) || 0) / 10;
                }

                return weightB - weightA;
            });
        };

        if (activeCategory !== 'all' || activeGlobalFilter !== 'all' || searchTerm) {
            let displayTitle = 'Resultados';
            if (activeGlobalFilter === 'offers') displayTitle = '🔥 Ofertas Imperdibles';
            else if (activeGlobalFilter === 'reservations') displayTitle = '🗓️ Próximas Llegadas';
            else if (activeGlobalFilter === 'new') displayTitle = '✨ Lo Más Nuevo';
            
            return [{ id: 'results_grid', title: displayTitle, layout: 'grid', items: weightedShuffle(basePool) }];
        }

        const inStockPool = basePool.filter(p => (Number(p.stock) || 0) > 0);
        const outOfStockPool = basePool.filter(p => (Number(p.stock) || 0) <= 0);

        // 🧠 ALGORITMO 70/30 PARA RECOMENDADOS
        const getRecommended = (n: number = count) => {
            const userPrefs = (currentUser as any)?.categoryPrefs || {};
            const favoriteCategoryIds = Object.entries(userPrefs)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 2)
                .map(([id]) => id);

            if (favoriteCategoryIds.length === 0) return weightedShuffle(inStockPool).slice(0, n);

            const personalizedPool = inStockPool.filter(p => favoriteCategoryIds.includes(p.categoryId));
            const explorationPool = inStockPool.filter(p => !favoriteCategoryIds.includes(p.categoryId));

            const personalizedCount = Math.ceil(n * 0.7);
            const explorationCount = n - personalizedCount;

            const res = [
                ...weightedShuffle(personalizedPool).slice(0, personalizedCount),
                ...weightedShuffle(explorationPool).slice(0, explorationCount)
            ];
            // Final shuffle of the results to mix personalized and exploration
            return weightedShuffle(res);
        };

        const offersPool = inStockPool.filter(p => p.hasOffer || (p.originalPrice && Number(p.originalPrice) > Number(p.price)));
        const baseSections = [
            { id: 'hot_carousel', title: '🔥 Lo Más Pedido', layout: 'carousel', items: weightedShuffle(inStockPool, 'popular').slice(0, 12) },
            { id: 'recommended_grid', title: 'Recomendado para ti', layout: isPC ? 'grid' : 'carousel', items: getRecommended(isPC ? count : 12) },
            ...(offersPool.length > 0 ? [{ id: 'offers_carousel', title: '🔥 Promos', layout: 'carousel', items: weightedShuffle(offersPool).slice(0, 12) }] : []),
            { id: 'new_arrivals', title: '✨ Novedades', layout: 'carousel', items: weightedShuffle(inStockPool, 'recent').slice(0, count) },
            ...(outOfStockPool.length > 0 ? [{ id: 'reservations_carousel', title: '🗓️ Reserva', layout: 'carousel', items: weightedShuffle(outOfStockPool).slice(0, 12) }] : [])
        ];

        // El Home termina con un acceso a la Tienda (ahí está el catálogo completo, con filtros).
        const infiniteSections: any[] = [{ id: 'see_all', title: '', layout: 'cta', items: [] }];

        return [...baseSections, ...infiniteSections];
    }, [products, currentUser, globalCategories, activeCategory, activeSub, manualRefresh, searchTerm, activeColor, activeGlobalFilter, sessionSeed]);

    const availableColors = useMemo(() => {
        const pool = activeCategory === 'all' ? products : products.filter(p => p.categoryId === activeCategory);
        return Array.from(new Set(pool.flatMap(p => p.colors || [])));
    }, [products, activeCategory]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && visibleSections < smartSections.length) {
                setTimeout(() => setVisibleSections(prev => prev + 1), 200);
            }
        }, { threshold: 0.1 });
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [visibleSections, smartSections.length]);

    // Space where resize handler used to be


    const isDesktop = innerWidth > 1024;

    return (
        <div className="home-content" style={{ padding: '0 0 8px', visibility: innerWidth > 0 ? 'visible' : 'hidden' }}>
            {/* ── UNIFIED MARKETPLACE HEADER ── */}
            {!isDesktop && (
            <MarketplaceHeader 
                categories={globalCategories}
                activeCategory={localActiveCat}
                setActiveCategory={handleCategoryChange}
                globalBrandName={globalBrandName}
                banners={banners}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                activeGlobalFilter={activeGlobalFilter}
                setActiveGlobalFilter={setActiveGlobalFilter}
            />
            )}

            {/* ── MAIN MARKETPLACE BODY (2 Columns on PC) ── */}
            <div 
                className="marketplace-main-layout"
                style={{ 
                    maxWidth: '1400px', 
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: isDesktop ? 'row' : 'column',
                    gap: '30px',
                    padding: '0 20px'
                }}
            >
                    {/* 🛠️ SIDEBAR (Visible on PC) */}
                    {isDesktop && (
                        <MarketplaceSidebar 
                            activeGlobalFilter={activeGlobalFilter}
                            setActiveGlobalFilter={setActiveGlobalFilter}
                            globalCategories={globalCategories}
                            localActiveCat={localActiveCat}
                            handleCategoryChange={handleCategoryChange}
                            availableColors={availableColors}
                            activeColor={activeColor}
                            setActiveColor={setActiveColor}
                        />
                    )}

                {/* 📦 CONTENT AREA (Grid & Sections) */}
                <main style={{ flex: 1, minWidth: 0 }}>
                    {isDesktop && (
<MarketplaceHeader 
                categories={globalCategories}
                activeCategory={localActiveCat}
                setActiveCategory={handleCategoryChange}
                globalBrandName={globalBrandName}
                banners={banners}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                activeGlobalFilter={activeGlobalFilter}
                setActiveGlobalFilter={setActiveGlobalFilter}
            />
                    )}
                    
                    {/* ── FILTROS RÁPIDOS: Promos / Reserva / Novedad ── */}
                    {!isDesktop && (
                        <div style={{ margin: '0 -14px 8px' }}>
                            <ShortcutRibbon
                                activeGlobalFilter={activeGlobalFilter}
                                setActiveGlobalFilter={setActiveGlobalFilter}
                            />
                        </div>
                    )}

                    {/* ── SUBCATEGORY RIBBON ── */}
                    {localActiveCat !== 'all' && (
                        <div className="subcategory-ribbon" style={{ marginBottom: '25px', overflowX: 'auto', display: 'flex', gap: '10px', scrollbarWidth: 'none' }}>
                            <button 
                                onClick={() => {
                                    const cat = globalCategories.find(c => c.id === localActiveCat);
                                    const slug = (cat as any)?.slug || cat?.id || localActiveCat;
                                    setActiveSub('all');
                                    router.push(`/categoria/${slug}`);
                                }}
                                style={{ 
                                    padding: '8px 18px', borderRadius: '12px', border: 'none',
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
                                        router.push(`/categoria/${parentSlug}/${subSlug}`);
                                    }}
                                    style={{ 
                                        padding: '8px 18px', borderRadius: '12px', border: 'none',
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

                    <div className="sections-container">
                        {isLoading && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: '15px' }}>
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '16px' }} />
                                ))}
                            </div>
                        )}

                        {smartSections.slice(0, visibleSections).map((section) => (
                            <section key={section.id} className="fade-in" style={{ marginBottom: '30px' }}>
                                {section.title && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: isDesktop ? '0' : '0 10px', gap: '15px', marginBottom: '12px' }}>
                                        <h3 className="section-title">{section.title}</h3>
                                        {activeCategory === 'all' && (
                                            <button className="section-link" onClick={() => router.push('/tienda')}>Ver todo →</button>
                                        )}
                                    </div>
                                )}

                                {section.layout === 'carousel' && (
                                    <ProductCarousel>
                                        {section.items.map((p: any) => (
                                            <div key={p.id} className="pcar-item" style={{ width: isDesktop ? '230px' : '164px' }}>
                                                <ProductCard product={p} users={users} onQuickAdd={addToCart} />
                                            </div>
                                        ))}
                                    </ProductCarousel>
                                )}

                                {section.layout === 'cta' && (
                                    <div className="see-all-wrap">
                                        <button className="see-all-btn" onClick={() => router.push('/tienda')}>Ver toda la tienda →</button>
                                    </div>
                                )}

                                {section.layout === 'grid' && (
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: isDesktop ? 'repeat(auto-fill, minmax(180px, 1fr))' : 'repeat(2, 1fr)', 
                                        gap: isDesktop ? '20px' : '12px' 
                                    }}>
                                        {section.items.map((p: any) => (
                                            <ProductCard key={p.id} product={p} users={users} onQuickAdd={addToCart} />
                                        ))}
                                    </div>
                                )}
                            </section>
                        ))}
                        
                        <div ref={observerTarget} style={{ height: visibleSections < smartSections.length ? '100px' : '1px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {visibleSections < smartSections.length ? (
                                <div className="pro-spinner"></div>
                            ) : smartSections[0]?.id === 'results_grid' ? (
                                <div style={{ padding: '60px 0', textAlign: 'center', opacity: 0.3, fontSize: '0.8rem', fontWeight: 800 }}>
                                    <p>• FIN DE RESULTADOS •</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </main>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#bbb', fontWeight: 900, letterSpacing: '3px', marginTop: '4px', textTransform: 'uppercase' }}>
                Delva · La tienda de la selva
            </p>
        </div>
    );
};

export default HomeView;