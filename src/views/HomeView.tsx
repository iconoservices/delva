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

// --- SUB-COMPONENT FOR INTERACTIVE SOCIAL CARD ---
const SocialFeedCard = ({ product, author }: { product: Product, author?: User }) => {
    const [votes, setVotes] = React.useState(Math.floor(Math.random() * 50) + 10);
    const [hasVoted, setHasVoted] = React.useState(false);
    const navigate = useNavigate();

    const handleVote = () => {
        if (!hasVoted) {
            setVotes(v => v + 1);
            setHasVoted(true);
        } else {
            setVotes(v => v - 1);
            setHasVoted(false);
        }
    };

    const authorName = author?.storeName || author?.name || "DELVA Official";
    const authorLogo = author?.storeLogo || author?.photoURL || null;
    const authorInitials = author?.initials || authorName.substring(0, 1) || "D";

    return (
        <div className="social-card" style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(0,0,0,0.03)' }}>
            <div
                onClick={() => navigate(`/tienda?u=${author?.id || 'master'}`)}
                style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7rem', overflow: 'hidden' }}>
                    {authorLogo ? <img src={authorLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : authorInitials}
                </div>
                <div>
                    <p style={{ fontWeight: 800, fontSize: '0.75rem', margin: 0 }}>{authorName}</p>
                    <p style={{ fontSize: '0.6rem', opacity: 0.5, margin: 0 }}>{author?.storeBio ? author.storeBio.substring(0, 30) + '...' : 'Publicación Interactiva'}</p>
                </div>
            </div>

            <img src={product.image} style={{ width: '100%', objectFit: 'cover', display: 'block' }} />

            <div style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '5px' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>{product.title}</h4>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)' }}>S/ {product.price.toFixed(2)}</span>
                </div>
                <p style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '12px', lineHeight: '1.4' }}>¿Qué tanto te gusta este producto de nuestra colección? ✨</p>

                {/* INTERACTIVE ACTIONS */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                        onClick={handleVote}
                        style={{
                            flex: 1,
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px',
                            background: hasVoted ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg)',
                            color: hasVoted ? 'var(--accent)' : 'var(--primary)',
                            border: `1px solid ${hasVoted ? 'var(--accent)' : 'rgba(0,0,0,0.1)'}`,
                            padding: '8px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 800,
                            transition: 'var(--transition)'
                        }}>
                        <span style={{ transform: hasVoted ? 'scale(1.2)' : 'scale(1)', transition: '0.2s' }}>🔥</span>
                        {hasVoted ? 'Top!' : 'Hype'} ({votes})
                    </button>
                    <button
                        onClick={() => navigate(`/producto/${product.id}`)}
                        style={{
                            flex: 1,
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            padding: '8px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 800,
                            transition: 'var(--transition)'
                        }}>
                        👀 Ver Detalles
                    </button>
                </div>
            </div>
        </div>
    );
};

const HomeView: React.FC<HomeViewProps> = ({
    banners,
    currentBannerIndex,
    globalBrandName,
    products,
    users,
    ProductCard,
    activeCategory,
    setActiveCategory,
    globalCategories,
    viewMode,
    setViewMode
}) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredProducts = products.filter(p => {
        const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="container">
            <header className="hero" style={{ padding: '20px 0 20px' }}>
                {/* VIEW MODE TOGGLE (INICIO) */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.03)', padding: '5px', borderRadius: '30px', marginBottom: '20px', gap: '5px' }}>
                    <button
                        onClick={() => setViewMode('social')}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '25px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px',
                            background: viewMode === 'social' ? 'white' : 'transparent',
                            color: viewMode === 'social' ? 'var(--primary)' : 'var(--text-muted)',
                            boxShadow: viewMode === 'social' ? 'var(--shadow-sm)' : 'none',
                            transform: viewMode === 'social' ? 'scale(1)' : 'scale(0.95)',
                            transition: 'var(--transition)'
                        }}>
                        🌟 Marketplace
                    </button>
                    <button
                        onClick={() => setViewMode('shop')}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '25px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px',
                            background: viewMode === 'shop' ? 'white' : 'transparent',
                            color: viewMode === 'shop' ? 'var(--primary)' : 'var(--text-muted)',
                            boxShadow: viewMode === 'shop' ? 'var(--shadow-sm)' : 'none',
                            transform: viewMode === 'shop' ? 'scale(1)' : 'scale(0.95)',
                            transition: 'var(--transition)'
                        }}>
                        📦 Catálogo
                    </button>
                </div>

                {/* SEARCH BAR */}
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="Buscar productos, marcas o tesoros... 🎋"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '15px 50px 15px 20px',
                            borderRadius: '20px',
                            border: '1px solid rgba(0,0,0,0.05)',
                            background: 'var(--surface)',
                            boxShadow: 'var(--shadow-sm)',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            outline: 'none',
                            transition: 'var(--transition)'
                        }}
                    />
                    <span style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3, fontSize: '1.2rem' }}>🔍</span>
                </div>

                <div className="banner-container" style={{ borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {banners.map((b, idx) => (
                        <div key={b.id} className={`banner-slide ${idx === currentBannerIndex ? 'active' : ''}`}>
                            <img src={b.image} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div className="banner-overlay" style={{ background: 'linear-gradient(to top, rgba(15, 48, 37, 0.9), transparent)' }}>
                                <h1 className="hero-title" style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(2rem, 5vw, 3rem)' }}>{b.title || globalBrandName}</h1>
                                <p style={{ fontSize: '0.9rem', opacity: 0.9, marginTop: '5px', marginBottom: '15px', color: 'rgba(255,255,255,0.8)' }}>Explora la esencia de lo auténtico</p>
                                <button className="btn-wa" style={{ width: 'fit-content', background: 'var(--accent)', color: 'var(--primary)', border: 'none', padding: '10px 20px' }} onClick={() => navigate('/tienda')}>Ver Colección 🕶️</button>
                            </div>
                        </div>
                    ))}
                </div>
            </header>

            {/* MARKETPLACE CATEGORIES BAR */}
            <div style={{ position: 'sticky', top: '75px', background: 'var(--bg)', zIndex: 900, padding: '15px 0', margin: '0 -20px', paddingLeft: '20px' }}>
                <div className="gallery-scroll" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingRight: '20px' }}>
                    <button
                        onClick={() => setActiveCategory('all')}
                        style={{
                            padding: '12px 25px', borderRadius: '40px', fontWeight: 800, fontSize: '0.75rem', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '1px',
                            background: activeCategory === 'all' ? 'var(--primary)' : 'var(--surface)',
                            color: activeCategory === 'all' ? 'white' : 'var(--primary)',
                            border: '1px solid ' + (activeCategory === 'all' ? 'var(--primary)' : 'rgba(0,0,0,0.05)'),
                            boxShadow: activeCategory === 'all' ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                            transition: 'var(--transition)'
                        }}
                    >
                        🏠 Todo
                    </button>
                    {globalCategories.slice(1).map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                padding: '12px 25px', borderRadius: '40px', fontWeight: 800, fontSize: '0.75rem', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '1px',
                                background: activeCategory === cat.id ? 'var(--primary)' : 'var(--surface)',
                                color: activeCategory === cat.id ? 'white' : 'var(--primary)',
                                border: '1px solid ' + (activeCategory === cat.id ? 'var(--primary)' : 'rgba(0,0,0,0.05)'),
                                boxShadow: activeCategory === cat.id ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                                transition: 'var(--transition)'
                            }}
                        >
                            {cat.id === 'moda' ? '👕 ' : cat.id === 'cafe' ? '☕ ' : cat.id === 'artesania' ? '🏺 ' : '🎨 '}
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            <section style={{ marginBottom: '60px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        {activeCategory === 'all'
                            ? (viewMode === 'social' ? '✨ Últimas Novedades' : '🌐 Explorar Directorio')
                            : globalCategories.find(c => c.id === activeCategory)?.name}
                    </h2>
                </div>
                <div className={viewMode === 'shop' ? "grid" : "social-grid"}>
                    {filteredProducts.map(p => {
                        const author = users.find(u => u.id === p.userId);
                        return viewMode === 'shop' ? (
                            <ProductCard key={p.id} product={p} />
                        ) : (
                            <SocialFeedCard key={p.id} product={p} author={author} />
                        )
                    })}
                </div>
                {filteredProducts.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
                        <p style={{ fontSize: '3rem' }}>🍃</p>
                        <p>Aún no hay productos en esta sección del marketplace.</p>
                    </div>
                )}
            </section>
        </div >
    );
};

export default HomeView;
