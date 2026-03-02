import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../data/products';
import type { User } from '../App';

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
}

// --- SUB-COMPONENT: SOCIAL HUB CARD ---
const SocialHubCard = ({ product, author }: { product: Product, author?: User }) => {
    const navigate = useNavigate();
    const [hypeCount, setHypeCount] = React.useState(Math.floor(Math.random() * 80) + 20);
    const [isHype, setIsHype] = React.useState(false);

    const isStore = !!author?.storeName;
    const authorName = author?.storeName || author?.name || "DELVA Pro";
    const authorLogo = author?.storeLogo || author?.photoURL;

    return (
        <div className={`peeking-item social-card ${!isStore ? 'glass' : ''}`} style={{
            background: isStore ? 'white' : 'rgba(255,255,255,0.6)',
            borderRadius: '24px',
            paddingBottom: '15px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
            border: isStore ? '1px solid #f0f0f0' : '1px solid rgba(255,255,255,0.4)',
            overflow: 'hidden'
        }}>
            <div
                onClick={() => navigate(`/tienda?u=${author?.id || 'master'}&viewAsGuest=true`)}
                style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
                <div className={isStore ? 'premium-ring' : 'social-ring'} style={{ width: '42px', height: '42px', flexShrink: 0 }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#eee', overflow: 'hidden', border: '2px solid white' }}>
                        {authorLogo ? <img src={authorLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontWeight: 'bold' }}>{authorName[0]}</span>}
                    </div>
                </div>
                <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontWeight: 900, fontSize: '0.8rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {authorName} {isStore && <span style={{ fontSize: '0.65rem', background: '#FFD700', padding: '1px 6px', borderRadius: '10px', marginLeft: '5px', color: '#000' }}>STORE</span>}
                    </p>
                    <p style={{ fontSize: '0.65rem', opacity: 0.5, margin: 0 }}>{isStore ? 'Tienda Verificada' : 'Publicación Libre'}</p>
                </div>
            </div>

            <div style={{ position: 'relative', height: '220px', margin: '0 10px', borderRadius: '18px', overflow: 'hidden' }}>
                <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => navigate(`/producto/${product.id}`)} />
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 900 }}>
                    S/ {product.price}
                </div>
            </div>

            <div style={{ padding: '15px 15px 0' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.title}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => { setIsHype(!isHype); setHypeCount(prev => isHype ? prev - 1 : prev + 1); }}
                        className={isHype ? 'on-fire' : ''}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '14px', border: 'none',
                            background: isHype ? 'linear-gradient(45deg, #ff5722, #ff9800)' : 'rgba(0,0,0,0.05)',
                            color: isHype ? 'white' : '#555', fontSize: '0.75rem', fontWeight: 900,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                        }}
                    >
                        {isHype ? '🔥' : '⚡'} ({hypeCount})
                    </button>
                    <button
                        onClick={() => navigate(`/producto/${product.id}`)}
                        className="btn-vibrant"
                        style={{ flex: 1, padding: '10px', fontSize: '0.75rem', borderRadius: '14px' }}
                    >
                        LO QUIERO
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: SERVICE CARD ---
const ServiceHubCard = ({ product, author }: { product: Product, author?: User }) => {
    const navigate = useNavigate();
    return (
        <div className="peeking-item service-card" onClick={() => navigate(`/tienda?u=${author?.id || 'master'}&viewAsGuest=true`)} style={{ cursor: 'pointer' }}>
            <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div className="service-overlay">
                <span style={{ background: '#ff5722', color: 'white', padding: '3px 10px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 900, marginBottom: '8px', width: 'fit-content' }}>SERVICIO PRO</span>
                <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: '0 0 5px' }}>{product.title}</h4>
                <p style={{ fontSize: '0.7rem', opacity: 0.8, margin: 0 }}>Desde S/ {product.price} • Por {author?.name || 'DELVA'}</p>
            </div>
        </div>
    );
};

const Header = ({ onVenderClick, navigate }: { onVenderClick: () => void, navigate: any }) => {
    return (
        <div style={{ position: 'sticky', top: 0, zIndex: 1001, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', padding: '15px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
            <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-1.5px', margin: 0, background: 'linear-gradient(45deg, #1A3C34, #2E7D32)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DELVA<span style={{ color: '#ff5722', WebkitTextFillColor: '#ff5722' }}>HUB</span></h1>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button onClick={onVenderClick} className="btn-vibrant btn-pulse-gold" style={{ padding: '8px 18px', borderRadius: '15px', fontSize: '0.75rem' }}>
                    VENDER YA 🚀
                </button>
            </div>
        </div>
    );
};

const HomeView: React.FC<HomeViewProps> = (props) => {
    const { banners, products, users, globalCategories } = props;
    const navigate = useNavigate();

    // --- SMART-MIX FEED LOGIC ---
    const smartMixFeed = React.useMemo(() => {
        return products.map(p => ({
            ...p,
            hypeScore: (Number(p.id) > Date.now() - (86400000 * 3) ? 100 : 0) +
                Math.random() * 50
        })).sort((a, b) => b.hypeScore - a.hypeScore);
    }, [products]);

    const discoverSections = React.useMemo(() => {
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
        <div className="home-view" style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--primary)', colorScheme: 'light' }}>
            <Header onVenderClick={() => navigate('/admin')} navigate={navigate} />

            <main style={{ maxWidth: '100%', margin: '0 auto', overflowX: 'hidden' }}>

                {/* 1. DISCOVERY MOSAIC */}
                <section style={{ margin: '30px 0 20px', padding: '0 20px' }}>
                    <div className="peeking-container" style={{ gap: '12px', paddingBottom: '10px' }}>
                        {banners.length > 0 ? banners.slice(0, 3).map((b, i) => (
                            <div key={b.id || i} onClick={() => navigate('/tienda')} className="banner-peeking-item" style={{ cursor: 'pointer', minWidth: '85%', borderRadius: '30px', background: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4)), url(${b.image})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '200px', flexShrink: 0, display: 'flex', alignItems: 'flex-end', padding: '20px' }}>
                                <div style={{ color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                                    <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>{b.title || 'DESCUBRE DELVA'}</h2>
                                    <p style={{ fontSize: '0.7rem', opacity: 0.9, margin: '5px 0 0' }}>Lo mejor de tu ciudad 🌿</p>
                                </div>
                            </div>
                        )) : (
                            <div className="banner-peeking-item" style={{ minWidth: '100%', borderRadius: '30px', background: 'linear-gradient(135deg, #FF9800, #F44336)', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p style={{ color: 'white', fontWeight: 800 }}>¡Acariciando la Selva! 🌿</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* 2. CATEGORY SELECTOR */}
                <section style={{ padding: '10px 0 30px' }}>
                    <div className="peeking-container" style={{ gap: '15px' }}>
                        {[{ id: 'all', name: '✨ Todo', color: '#ff5722' }, ...globalCategories.filter(c => c.id !== 'all')].map((cat: any) => (
                            <button
                                key={cat.id}
                                onClick={() => navigate(`/tienda?viewAsGuest=true`)}
                                style={{ flexShrink: 0, padding: '12px 25px', borderRadius: '25px', border: 'none', background: cat.color ? `linear-gradient(135deg, ${cat.color}, #000)` : 'white', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', color: cat.color ? 'white' : 'var(--primary)', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', transition: '0.3s' }}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </section>

                {/* 3. INTERCALATED SECTIONS */}
                {discoverSections.map((sect, idx) => (
                    <section key={idx} style={{ marginBottom: '50px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>{sect.title}</h3>
                            <button onClick={() => navigate('/tienda?viewAsGuest=true')} className="btn-vibrant" style={{ padding: '8px 18px', borderRadius: '15px', fontSize: '0.7rem' }}>VER MÁS</button>
                        </div>

                        {sect.layout === 'grid' ? (
                            <div style={{ padding: '0 20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    {sect.items.map((p, i) => {
                                        const author = users.find(u => u.id === p.userId);
                                        return (
                                            <div key={p.id} className="fade-in" style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid #eee' }} onClick={() => navigate(`/producto/${p.id}`)}>
                                                <div style={{ position: 'relative', paddingBottom: i % 2 === 0 ? '120%' : '140%' }}>
                                                    <img src={p.image} alt={p.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    {author?.isPremium && <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'gold', padding: '4px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 900 }}>GOLDEN ✨</div>}
                                                </div>
                                                <div style={{ padding: '15px' }}>
                                                    <p style={{ fontSize: '0.85rem', fontWeight: 900, margin: '0 0 5px' }}>{p.title}</p>
                                                    <p style={{ fontSize: '0.8rem', fontWeight: 900, margin: 0, color: '#ff5722' }}>S/ {p.price}</p>
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
                                    return <SocialHubCard key={p.id} product={p} author={author} />;
                                })}
                            </div>
                        )}
                    </section>
                ))}

                {/* 4. PROFESSIONAL SERVICES */}
                {services.length > 0 && (
                    <section style={{ marginTop: '50px', background: 'linear-gradient(to bottom, #111, #000)', padding: '50px 0', borderRadius: '40px 40px 0 0' }}>
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

                <div style={{ padding: '50px 20px', textAlign: 'center' }}>
                    <button
                        onClick={() => navigate('/tienda?viewAsGuest=true')}
                        className="btn-vibrant btn-pulse-gold"
                        style={{ padding: '18px 45px', borderRadius: '35px', fontSize: '0.9rem', width: '100%', maxWidth: '300px' }}
                    >
                        EXPLORAR LA SELVA 🌿
                    </button>
                    <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '20px' }}>Hecho con ❤️ para el comercio local</p>
                </div>
            </main>
        </div>
    );
};

export default HomeView;
