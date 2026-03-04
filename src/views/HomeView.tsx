import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../data/products';
import type { User } from '../App';

// --- COMPONENTS ---
import GrandHeroCarousel from '../components/common/GrandHeroCarousel';
import SocialHubCard from '../components/home/SocialHubCard';
import ServiceHubCard from '../components/home/ServiceHubCard';
import useUserPreferences from '../utils/useUserPreferences';

interface HomeViewProps {
    banners: { id: string, image: string, title?: string }[];
    currentBannerIndex: number;
    globalBrandName: string;
    products: Product[];
    users: User[];
    ProductCard: React.ComponentType<{ product: Product }>;
    activeCategory: string;
    setActiveCategory: (val: string) => void;
    globalCategories: { id: string, name: string }[];
    viewMode: 'shop' | 'social';
    setViewMode: (val: 'shop' | 'social') => void;
    addToCart: (p: Product) => void;
    currentUser: User | null;
}

const HomeView: React.FC<HomeViewProps> = ({ products, users, globalCategories, addToCart, currentUser }) => {
    const navigate = useNavigate();

    // --- ALGORITMO 70/30 HÍBRIDO ---
    const { getPreferences } = useUserPreferences(currentUser);
    const [topCategory, setTopCategory] = useState<string | null>(null);

    useEffect(() => {
        const loadPrefs = async () => {
            const prefs = await getPreferences();
            if (prefs && Object.keys(prefs).length > 0) {
                // Encontrar la categoría con más puntos
                const top = Object.entries(prefs).sort(([, a], [, b]) => (b as number) - (a as number))[0][0];
                setTopCategory(top);
            }
        };
        loadPrefs();
    }, [getPreferences]);

    // --- FEED LOGIC: 70/30 HÍBRIDO ---
    const smartMixFeed = useMemo(() => {
        // 1. Separar productos por categoría
        const exploitPool = topCategory ? products.filter(p => p.categoryId === topCategory) : [];
        const explorePool = products.filter(p => p.categoryId !== topCategory);

        // Mezclar aleatoriamente el explorePool
        const shuffledExplore = [...explorePool].sort(() => Math.random() - 0.5);
        const shuffledExploit = [...exploitPool].sort(() => Math.random() - 0.5);

        // Si no hay preferencias, usamos el feed aleatorio original
        if (!topCategory || exploitPool.length === 0) {
            return products.map(p => ({
                ...p,
                hypeScore: Math.random() * 100
            })).sort((a, b) => b.hypeScore - a.hypeScore);
        }

        // 2. Construir el mix 70/30
        const finalFeed: Product[] = [];
        let exploitIdx = 0;
        let exploreIdx = 0;

        // Intentamos intercalar: por cada 7 de exploit, 3 de explore
        while (exploitIdx < shuffledExploit.length || exploreIdx < shuffledExplore.length) {
            // Añadir hasta 7 de exploit
            for (let k = 0; k < 7 && exploitIdx < shuffledExploit.length; k++) {
                finalFeed.push(shuffledExploit[exploitIdx++]);
            }
            // Añadir hasta 3 de explore
            for (let k = 0; k < 3 && exploreIdx < shuffledExplore.length; k++) {
                finalFeed.push(shuffledExplore[exploreIdx++]);
            }
        }

        return finalFeed;
    }, [products, topCategory]);

    const discoverSections = useMemo(() => {
        const sections: { title: string, items: any[], layout: 'grid' | 'carousel' | 'hero' }[] = [];

        // Sección Especial: "Recomendado para ti" (Solo si hay topCategory)
        if (topCategory && smartMixFeed.length > 0) {
            const catName = globalCategories.find(c => c.id === topCategory)?.name || 'Tu Favorito';
            sections.push({
                title: `⭐ Recomendado: ${catName}`,
                items: smartMixFeed.slice(0, 6),
                layout: 'carousel'
            });
        } else {
            sections.push({ title: '🔥 Lo Más Caliente', items: smartMixFeed.slice(0, 6), layout: 'carousel' });
        }

        const remaining = smartMixFeed.slice(6);
        let i = 0;
        let patternIndex = 0;

        while (i < remaining.length) {
            const layoutType = ['grid', 'hero', 'carousel'][patternIndex % 3] as 'grid' | 'carousel' | 'hero';
            const chunkSize = layoutType === 'hero' ? 1 : 4;
            const chunk = remaining.slice(i, i + chunkSize);

            if (chunk.length === 0) break;

            sections.push({
                title: layoutType === 'hero' ? '⭐ Destacado Exclusivo' : (patternIndex === 0 ? '✨ Descubre algo nuevo' : '🌿 Más para explorar'),
                items: chunk,
                layout: layoutType
            });

            i += chunkSize;
            patternIndex++;
        }
        return sections;
    }, [smartMixFeed, topCategory, globalCategories]);

    const services = products.filter(p => p.categoryId === 'services').slice(0, 6);

    return (
        <div className="home-view" style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--primary)', colorScheme: 'light', paddingTop: '0px' }}>

            <main style={{ maxWidth: '100%', margin: '0 auto', overflowX: 'hidden' }}>
                {/* HERO GIGANTE INICIAL */}
                <div style={{ borderRadius: 0, overflow: 'hidden' }}>
                    <GrandHeroCarousel onCtaClick={(link) => navigate(link)} />
                </div>

                {/* CATEGORIES CARRUSEL PEEKING */}
                <section style={{ padding: '0', marginTop: '-15px', position: 'relative', zIndex: 10 }}>
                    <div className="peeking-container" style={{ gap: '10px' }}>
                        {[{ id: 'all', name: '✨ Todo', color: '#ff5722' }, ...globalCategories.filter(c => c.id !== 'all')].map((cat: any) => (
                            <button
                                key={cat.id}
                                onClick={() => navigate(`/tienda?viewAsGuest=true`)}
                                style={{ flexShrink: 0, padding: '10px 20px', borderRadius: '25px', border: 'none', background: cat.color ? `linear-gradient(135deg, ${cat.color}, #000)` : 'white', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', color: cat.color ? 'white' : 'var(--primary)', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', transition: '0.3s' }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </section>

                {/* DINAMIC FEED SECTIONS */}
                {discoverSections.map((sect, idx) => (
                    <section key={idx} className="section-compact" style={{ padding: '0', marginTop: idx === 0 ? '-10px' : '0' }}>
                        {/* Título de la Sección */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '6px' }}>
                            <h3 className="modern-title" style={{ fontSize: '1.2rem', margin: 0, fontWeight: 900, color: '#111' }}>{sect.title}</h3>
                            <button onClick={() => navigate('/tienda?viewAsGuest=true')} className="btn-vibrant modern-title" style={{ padding: '4px 12px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 900 }}>VER MÁS</button>
                        </div>

                        {/* Layout Switcher */}
                        {sect.layout === 'grid' ? (
                            /* LAYOUT 1: GRILLA COMPACTA (2x2 en celular) */
                            <div style={{ padding: '0 20px' }}>
                                <div className="compact-grid">
                                    {sect.items.slice(0, 4).map((p) => {
                                        const author = users.find(u => u.id === p.userId);
                                        return (
                                            <div key={p.id} className="fade-in" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f2f2f2', cursor: 'pointer' }} onClick={() => navigate(`/producto/${p.id}`)}>
                                                <div style={{ position: 'relative', aspectRatio: '1/1', background: '#f9f9f9' }}>
                                                    <img src={p.image} alt={p.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    {author?.isPremium && <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'gold', padding: '2px 6px', borderRadius: '8px', fontSize: '8px', fontWeight: 900 }}>PRO</div>}
                                                </div>
                                                <div style={{ padding: '10px' }}>
                                                    <p className="modern-title" style={{ fontSize: '0.75rem', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700, color: '#222' }}>{p.title}</p>
                                                    <p className="modern-title" style={{ fontSize: '0.7rem', margin: 0, color: '#ff5722', fontWeight: 800 }}>S/ {p.price}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : sect.layout === 'hero' ? (
                            /* 🔥 LAYOUT 2: NUEVO BANNER GIGANTE HÍBRIDO (El truco Spotify/Netflix) 🔥 */
                            <div style={{ padding: '0 20px', marginBottom: '10px' }}>
                                {sect.items.map(p => (
                                    <div
                                        key={p.id}
                                        className="hero-single-card fade-in"
                                        onClick={() => navigate(`/producto/${p.id}`)}
                                        /* Usamos estilo en línea para pasar la imagen como variable CSS para el fondo borroso */
                                        style={{ '--bg-img': `url(${p.image})` } as any}
                                    >
                                        {/* Contenedor principal para el diseño híbrido en PC */}
                                        <div className="hero-single-content-wrapper">
                                            {/* Columna Izquierda: La foto nítida e intacta */}
                                            <div className="hero-single-image-col">
                                                <img src={p.image} alt={p.title} className="hero-single-img-crisp" />
                                            </div>

                                            {/* Columna Derecha: El texto gigante y precio */}
                                            <div className="hero-single-text-col">
                                                <span className="hero-label">RECOMENDADO</span>
                                                <h4 className="hero-title-text">{p.title}</h4>
                                                <p className="hero-price-text">S/ {p.price}</p>
                                                {/* En PC, un botón gigante adicional */}
                                                <button className="btn-vibrant desktop-only-btn" style={{ marginTop: '20px', padding: '15px 30px', borderRadius: '15px', width: 'auto' }}>
                                                    Ver Detalle 🌿
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* LAYOUT 3: CARRUSEL PEELING NORMAL */
                            <div className="peeking-container">
                                {sect.items.map(p => {
                                    const author = users.find(u => u.id === p.userId);
                                    return <SocialHubCard key={p.id} product={p} author={author} onQuickAdd={addToCart} />;
                                })}
                            </div>
                        )}
                    </section>
                ))}

                {/* SERVICES SECTION */}
                {services.length > 0 && (
                    <section style={{ marginTop: '20px', background: 'linear-gradient(to bottom, #111, #000)', padding: '30px 0', borderRadius: '40px 40px 0 0' }}>
                        <div style={{ padding: '0 20px', marginBottom: '25px' }}>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: 'white' }}>Servicios Premium</h3>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: '5px 0 0' }}>Experiencias y asesoría personalizada</p>
                        </div>
                        <div className="peeking-container">
                            {services.map(p => {
                                const author = users.find(u => u.id === p.userId);
                                return <ServiceHubCard key={p.id} product={p} author={author} />;
                            })}
                        </div>
                    </section>
                )}

                {/* FINAL CTA */}
                <div style={{ padding: '50px 20px', textAlign: 'center' }}>
                    <button onClick={() => navigate('/tienda?viewAsGuest=true')} className="btn-vibrant btn-pulse-gold" style={{ padding: '18px 45px', borderRadius: '35px', fontSize: '0.9rem', width: '100%', maxWidth: '300px' }}>EXPLORAR LA SELVA 🌿</button>
                    <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '20px' }}>Hecho con ❤️ para el comercio local</p>
                </div>
            </main>
        </div>
    );
};

export default HomeView;