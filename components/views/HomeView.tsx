'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Product } from '@/lib/data/products';
import { type User } from '@/lib/types';

import SocialHubCard from '@/components/home/SocialHubCard';
import { MarketplaceHeader } from '@/components/common/MarketplaceHeader';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [activeColor, setActiveColor] = useState('');
    const [isFloating, setIsFloating] = useState(false);
    const [activeGlobalFilter, setActiveGlobalFilter] = useState<'all' | 'offers' | 'reservations' | 'new'>('all');

    // 🚀 LOCAL STATE: Inicializar desde URL directamente para evitar el flash
    // Si hay slug en la URL, buscar el categoryId real en globalCategories
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
    const sessionSeed = useRef(Math.floor(Math.random() * 100)).current;
    const [manualRefresh, setManualRefresh] = useState(0); // 🎲 Allows forced re-shuffle
    const isPC = typeof window !== 'undefined' && window.innerWidth > 768;

    // ⚡ SCROLL OBSERVER for Floating Search
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 200) setIsFloating(true);
            else setIsFloating(false);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 🚀 UNIFIED SYNC: URL DRIVES STATE (solo sincroniza contexto, no re-renderiza UI)
    useEffect(() => {
        const targetSlug = categoryId as string;

        if (!targetSlug) {
            // Estamos en /
            if (localActiveCat !== 'all') {
                setLocalActiveCat('all');
                setActiveSub('all');
                setVisibleSections(3);
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

        // 👻 GHOST REDIRECT: moda -> moda-selva
        if (actualId === 'moda') {
            router.replace('/categoria/moda-selva');
            return;
        }

        // Sync localActiveCat con URL si divergió
        if (actualId !== localActiveCat) {
            setLocalActiveCat(actualId);
            setVisibleSections(3);
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
        // Sync contexto global
        if (actualId !== activeCategory) setActiveCategory(actualId);

        // Subcategory sync
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

    }, [categoryId, subCategoryId, globalCategories]);  // ← NO incluir activeCategory ni localActiveCat aquí para evitar loops

    // Handle Category Click (SEO Hybrid)
    const handleCategoryChange = (id: string) => {
        if (id === localActiveCat && id === 'all') {
            setManualRefresh(prev => prev + 1); // Re-shuffle on re-click
        }

        const cat = globalCategories.find(c => c.id === id);
        const slug = (cat as any)?.slug || cat?.id || 'categoria';

        setLocalActiveCat(id); // Instant visual update
        setActiveCategory(id);
        if (id === 'all') router.push('/');
        else router.push(`/categoria/${slug}`);
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

        // --- GLOBAL FILTERS ---
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            basePool = basePool.filter(p => 
                p.title.toLowerCase().includes(lowSearch) || 
                p.category?.toLowerCase().includes(lowSearch) ||
                (p.description || '').toLowerCase().includes(lowSearch)
            );
        }

        if (activeColor) {
            basePool = basePool.filter(p => (p.colors || []).includes(activeColor));
        }

        // --- GLOBAL FILTERS (Promos, Reservas, Novedades) ---
        if (activeGlobalFilter === 'offers') {
            basePool = basePool.filter(p => p.hasOffer || (p.originalPrice && Number(p.originalPrice) > Number(p.price)));
        } else if (activeGlobalFilter === 'reservations') {
            basePool = basePool.filter(p => (Number(p.stock) || 0) <= 0);
        } else if (activeGlobalFilter === 'new') {
            const oneWeekAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
            basePool = basePool.filter(p => p.createdAt && new Date(p.createdAt).getTime() > oneWeekAgo);
        }
        
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

        if (activeCategory !== 'all' || activeGlobalFilter !== 'all' || searchTerm) {
            const activeCatObj = globalCategories.find(c => c.id === activeCategory);
            const activeSubObj = (activeCatObj as any)?.subCategories?.find((s: any) => s.id === activeSub);
            
            let displayTitle = 'Resultados';
            if (activeGlobalFilter === 'offers') displayTitle = '🔥 Ofertas Imperdibles';
            else if (activeGlobalFilter === 'reservations') displayTitle = '🗓️ Próximas Llegadas';
            else if (activeGlobalFilter === 'new') displayTitle = '✨ Lo Más Nuevo';
            else if (activeCategory !== 'all') displayTitle = activeSub !== 'all' && activeSubObj ? `${activeCatObj?.name} → ${activeSubObj.name}` : (activeCatObj?.name || 'Productos');

            return [
                {
                    id: 'results_grid',
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
    }, [products, currentUser, globalCategories, activeCategory, activeSub, manualRefresh, searchTerm, activeColor, activeGlobalFilter]);

    // Extract available colors for filtering
    const availableColors = useMemo(() => {
        const pool = activeCategory === 'all' 
            ? products 
            : products.filter(p => p.categoryId === activeCategory || p.category === globalCategories.find(c => c.id === activeCategory)?.name);
        return Array.from(new Set(pool.flatMap(p => p.colors || [])));
    }, [products, activeCategory, globalCategories]);

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
        <div className="home-content" style={{ padding: '0 0 80px' }}>

                {/* ── FLOATING SEARCH BAR ── */}
                <div style={{
                    position: 'fixed',
                    top: isFloating ? '15px' : '-80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '90%',
                    maxWidth: '600px',
                    zIndex: 1000,
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    opacity: isFloating ? 1 : 0
                }}>
                    <div style={{ 
                        background: 'rgba(255, 255, 255, 0.9)', 
                        backdropFilter: 'blur(15px)',
                        borderRadius: '25px', 
                        padding: '8px 20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
                        border: '1.5px solid rgba(255,255,255,0.5)'
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>🔍</span>
                        <input 
                            type="text" 
                            placeholder="Buscar en Delva..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                flex: 1, 
                                border: 'none', 
                                outline: 'none', 
                                fontSize: '0.9rem', 
                                fontWeight: 700,
                                color: '#1a1a1a',
                                background: 'transparent'
                            }}
                        />
                        <button 
                            onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                setSearchTerm('');
                            }}
                            style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '15px', padding: '6px 12px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}
                        >
                            ↑ Subir
                        </button>
                    </div>
                </div>
                
                {/* ── UNIFIED MARKETPLACE HEADER ── */}
                <MarketplaceHeader 
                    categories={globalCategories}
                    activeCategory={localActiveCat}
                    setActiveCategory={handleCategoryChange}
                    globalBrandName={globalBrandName}
                    banners={banners}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                />

                {/* ── APP-STYLE ACTION SHORTCUTS (Yape Style) ── */}
                <div style={{ 
                    padding: '10px 20px 25px',
                    display: 'flex', 
                    gap: '20px', 
                    overflowX: 'auto', 
                    scrollbarWidth: 'none',
                    marginTop: '-10px'
                }}>
                    {[
                        { id: 'all', label: 'Inicio', icon: '🏠', color: '#6C4AB6', bg: '#F2EBFF' },
                        { id: 'offers', label: 'Promos', icon: '🔥', color: '#E91E63', bg: '#FFF0F5', badge: '¡Dscto!' },
                        { id: 'reservations', label: 'Reserva', icon: '🗓️', color: '#F39C12', bg: '#FFF8F0' },
                        { id: 'new', label: 'Novedad', icon: '✨', color: '#00A651', bg: '#F1F9F5', badge: 'Nuevo' }
                    ].map((btn: any) => (
                        <div 
                            key={btn.id}
                            onClick={() => {
                                setActiveGlobalFilter(btn.id);
                                window.scrollTo({ top: isPC ? 400 : 300, behavior: 'smooth' });
                            }}
                            style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                gap: '8px', 
                                flexShrink: 0,
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                position: 'relative',
                                width: '65px',
                                height: '65px',
                                background: btn.bg,
                                borderRadius: '22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.8rem',
                                border: activeGlobalFilter === btn.id ? `3px solid ${btn.color}` : 'none',
                                boxShadow: activeGlobalFilter === btn.id ? `0 10px 20px ${btn.color}22` : '0 4px 12px rgba(0,0,0,0.03)',
                                transition: 'all 0.2s'
                            }}>
                                {btn.icon}
                                {btn.badge && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-10px',
                                        right: '-10px',
                                        background: btn.color,
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '10px',
                                        fontSize: '0.6rem',
                                        fontWeight: 950,
                                        boxShadow: `0 4px 10px ${btn.color}44`,
                                        whiteSpace: 'nowrap',
                                        zIndex: 10
                                    }}>
                                        {btn.badge}
                                    </div>
                                )}
                            </div>
                            <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: activeGlobalFilter === btn.id ? 900 : 700, 
                                color: activeGlobalFilter === btn.id ? btn.color : '#555',
                                transition: 'all 0.2s'
                            }}>
                                {btn.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* ── COLOR FILTER BAR ── */}
                {availableColors.length > 0 && (
                    <div style={{ 
                        padding: '0 20px', 
                        marginBottom: '20px',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px' 
                    }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 950, color: '#aaa', letterSpacing: '1px' }}>COLORES:</span>
                        <div style={{ 
                            display: 'flex', 
                            gap: '10px', 
                            overflowX: 'auto', 
                            padding: '5px 0',
                            scrollbarWidth: 'none',
                            flex: 1
                        }}>
                            {activeColor && (
                                <button 
                                    onClick={() => setActiveColor('')}
                                    style={{ 
                                        background: '#f0f0f0', 
                                        border: 'none', 
                                        borderRadius: '12px', 
                                        padding: '5px 12px', 
                                        fontSize: '0.7rem', 
                                        fontWeight: 900, 
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    Limpiar ✕
                                </button>
                            )}
                            {availableColors.map(c => (
                                <button 
                                    key={c}
                                    onClick={() => setActiveColor(activeColor === c ? '' : c)}
                                    style={{ 
                                        width: '32px', 
                                        height: '32px', 
                                        borderRadius: '50%', 
                                        background: c, 
                                        border: activeColor === c ? '3px solid var(--primary, #1B4332)' : '3px solid white', 
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        transition: 'all 0.2s',
                                        transform: activeColor === c ? 'scale(1.15)' : 'scale(1)'
                                    }}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── SUBCATEGORY RIBBON ── */}
                {localActiveCat !== 'all' && (
                    <div className="subcategory-ribbon" style={{ padding: '0 20px', marginBottom: '20px', overflowX: 'auto', display: 'flex', gap: '10px', scrollbarWidth: 'none' }}>
                        <button 
                            onClick={() => {
                                const cat = globalCategories.find(c => c.id === localActiveCat);
                                const slug = (cat as any)?.slug || cat?.id || localActiveCat;
                                setActiveSub('all');
                                router.push(`/categoria/${slug}`);
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
                                    router.push(`/categoria/${parentSlug}/${subSlug}`);
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
                                            onClick={() => router.push('/tienda')} 
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
                                        const author = (users && users.length > 0) 
                                            ? (users.find(u => u.id === p.userId) || users.find(u => u.id === 'master') || users[0])
                                            : { 
                                                name: 'Vendedor Delva', 
                                                storeName: 'Tienda Delva', 
                                                id: 'default',
                                                photoURL: '',
                                                initials: 'TD',
                                                customPrimary: '#1A3C34',
                                                role: 'socio',
                                                whatsapp: '',
                                                email: ''
                                            } as any;
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
                                        onClick={() => router.push(`/producto/${section.items[0].id}`)}
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
    );
};

export default HomeView;