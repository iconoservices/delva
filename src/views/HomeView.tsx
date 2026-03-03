import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../data/products';
import type { User } from '../App';

// --- COMPONENTS ---
import GrandHeroCarousel from '../components/common/GrandHeroCarousel';
import SocialHubCard from '../components/home/SocialHubCard';
import ServiceHubCard from '../components/home/ServiceHubCard';
import SmartFab from '../components/home/SmartFab';

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
}

const HomeView: React.FC<HomeViewProps> = ({ products, users, globalCategories, addToCart }) => {
    const navigate = useNavigate();

    // --- UI STATE ---
    const [fabExpanded, setFabExpanded] = useState(true);

    useEffect(() => {
        const onScroll = () => setFabExpanded(window.scrollY < 80);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // --- FEED LOGIC ---
    const smartMixFeed = useMemo(() => {
        return products.map(p => ({
            ...p,
            hypeScore: (Number(p.id) > Date.now() - (86400000 * 3) ? 100 : 0) + Math.random() * 50
        })).sort((a, b) => b.hypeScore - a.hypeScore);
    }, [products]);

    const discoverSections = useMemo(() => {
        const sections: { title: string, items: any[], layout: 'grid' | 'carousel' }[] = [];
        sections.push({ title: '🔥 Lo Más Caliente', items: smartMixFeed.slice(0, 6), layout: 'carousel' });
        const remaining = smartMixFeed.slice(6);
        for (let i = 0; i < remaining.length; i += 4) {
            const chunk = remaining.slice(i, i + 4);
            if (chunk.length === 0) break;
            sections.push({
                title: i === 0 ? '🌿 Para Descubrir' : '✨ Más para ti',
                items: chunk,
                layout: i % 8 === 0 ? 'grid' : 'carousel'
            });
        }
        return sections;
    }, [smartMixFeed]);

    const services = products.filter(p => p.categoryId === 'services').slice(0, 6);

    return (
        <div className="home-view" style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--primary)', colorScheme: 'light', paddingTop: '0px' }}>

            <main style={{ maxWidth: '100%', margin: '0 auto', overflowX: 'hidden' }}>
                {/* HERO */}
                <div style={{ borderRadius: 0, overflow: 'hidden' }}>
                    <GrandHeroCarousel onCtaClick={(link) => navigate(link)} />
                </div>

                {/* CATEGORIES */}
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

                {/* FEED SECTIONS */}
                {discoverSections.map((sect, idx) => (
                    <section key={idx} className="section-compact" style={{ padding: '0', marginTop: idx === 0 ? '-10px' : '0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '6px' }}>
                            <h3 className="modern-title" style={{ fontSize: '1.2rem', margin: 0, fontWeight: 900, color: '#111' }}>{sect.title}</h3>
                            <button onClick={() => navigate('/tienda?viewAsGuest=true')} className="btn-vibrant modern-title" style={{ padding: '4px 12px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 900 }}>VER MÁS</button>
                        </div>

                        {sect.layout === 'grid' ? (
                            <div style={{ padding: '0 20px' }}>
                                <div className="compact-grid">
                                    {sect.items.slice(0, 4).map((p) => {
                                        const author = users.find(u => u.id === p.userId);
                                        return (
                                            <div key={p.id} className="fade-in" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', border: '1px solid #f2f2f2' }} onClick={() => navigate(`/producto/${p.id}`)}>
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
                        ) : (
                            <div className="peeking-container">
                                {sect.items.map(p => {
                                    const author = users.find(u => u.id === p.userId);
                                    return <SocialHubCard key={p.id} product={p} author={author} onQuickAdd={addToCart} />;
                                })}
                            </div>
                        )}
                    </section>
                ))}

                {/* SERVICES */}
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

                {/* CTA */}
                <div style={{ padding: '50px 20px', textAlign: 'center' }}>
                    <button onClick={() => navigate('/tienda?viewAsGuest=true')} className="btn-vibrant btn-pulse-gold" style={{ padding: '18px 45px', borderRadius: '35px', fontSize: '0.9rem', width: '100%', maxWidth: '300px' }}>EXPLORAR LA SELVA 🌿</button>
                    <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '20px' }}>Hecho con ❤️ para el comercio local</p>
                </div>
            </main>

            <SmartFab expanded={fabExpanded} />
        </div>
    );
};

export default HomeView;
