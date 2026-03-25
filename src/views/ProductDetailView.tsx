import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Product } from '../data/products';
import type { User } from '../App';
import useUserPreferences from '../utils/useUserPreferences';

/**
 * 🌿 VISTA DE DETALLE DE PRODUCTO - REFACTORIZACIÓN PREMIUM v2.0
 * -----------------------------------------------------------
 * Rediseño sólido con enfoque Mobile-First (iPhone 13) y PC Optimizado.
 */

interface ProductDetailViewProps {
    products: Product[];
    users: User[];
    addToCart: (product: Product, color?: string) => void;
    getWhatsAppLink: (product: Product, color?: string) => string;
    cartCount: number;
    currentUser: User | null;
    onRecordSale?: (product: Product) => void;
}

const ProductDetailView: React.FC<ProductDetailViewProps> = ({
    products,
    users,
    addToCart,
    getWhatsAppLink,
    cartCount,
    currentUser,
    onRecordSale
}) => {
    const [selectedColor, setSelectedColor] = useState<string>('');
    const { trackView } = useUserPreferences(currentUser);
    const { id } = useParams();
    const navigate = useNavigate();

    const [currentImg, setCurrentImg] = useState(0);
    const [isHype, setIsHype] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    const product = products.find(p => p.id === id);

    useEffect(() => {
        if (product && product.categoryId) {
            trackView(product.categoryId);
        }
    }, [id, product, trackView]);

    if (!product) return (
        <div style={{ padding: '100px 20px', textAlign: 'center', background: 'white', minHeight: '100vh' }}>
            <h2 style={{ marginBottom: '20px', fontWeight: 900 }}>Producto no encontrado 🌿</h2>
            <button onClick={() => navigate('/')} className="btn-vibrant" style={{ padding: '15px 40px', borderRadius: '20px' }}>Volver a la tienda</button>
        </div>
    );

    const seller = users.find(u => u.id === product.userId) || users.find(u => u.id === 'master') || users[0];
    const isOwner = currentUser && (currentUser.id === seller.id || (currentUser.role === 'master' && !product.userId));
    const themeColor = seller?.customPrimary || '#1A3C34';

    const images = [product.image, ...(product.gallery || [])];
    const details = product.details && product.details.length > 0 ? product.details : [];

    return (
        <div className="product-mobile-container fade-in" style={{ '--theme-accent': themeColor } as any}>

            {/* 🏪 CABECERA DINÁMICA */}
            <header className="product-sticky-header">
                <button onClick={() => navigate(-1)} className="back-btn-native">←</button>

                <div className="seller-profile-anchor" onClick={() => navigate('/')}>
                    <div className="seller-mini-avatar" style={{ border: `2px solid ${themeColor}22` }}>
                        <img src={seller.photoURL || 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=100&q=80'} alt="avatar" />
                    </div>
                    <div className="seller-header-info">
                        <span className="seller-store-name">{seller.storeName || seller.name}</span>
                        <div className="seller-status-row">
                            <span className="status-dot" style={{ background: themeColor }}></span>
                            <span className="status-text" style={{ color: themeColor }}>Verificado</span>
                        </div>
                    </div>
                </div>

                <div className="header-actions-native">
                    <div className="cart-trigger-native" onClick={() => (window as any).dispatchEvent(new CustomEvent('openCart'))}>
                        <span style={{ fontSize: '1.2rem' }}>🛒</span>
                        {cartCount > 0 && <span className="cart-badge-native" style={{ background: themeColor }}>{cartCount}</span>}
                    </div>
                </div>
            </header>

            <div className="product-detail-grid">

                {/* 📸 SECCIÓN VISUAL (Móvil y PC) */}
                <div className="carousel-section">
                    <div className="image-carousel-wrapper">
                        <img src={images[currentImg]} alt={product.title} className="main-detail-img" />

                        <div
                            className={`hype-heart ${isHype ? 'active' : ''}`}
                            onClick={() => setIsHype(!isHype)}
                            style={{ position: 'absolute', top: '20px', right: '20px', bottom: 'auto' }}
                        >
                            {isHype ? '🧡' : '🤍'}
                        </div>

                        <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', color: 'white', padding: '4px 12px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900 }}>
                            {currentImg + 1} / {images.length}
                        </div>
                    </div>

                    {/* Galería de Miniaturas */}
                    {images.length > 1 && (
                        <div className="thumb-gallery">
                            {images.map((img, i) => (
                                <div
                                    key={i}
                                    className={`thumb-item ${currentImg === i ? 'active' : ''}`}
                                    onClick={() => setCurrentImg(i)}
                                >
                                    <img src={img} alt="thumb" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 📝 PANEL DE INFORMACIÓN (Sticky en PC) */}
                <div className="product-info-sticky">
                    <div className="product-info-sheet">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span className="category-label-compact" style={{ color: themeColor }}>{product.category}</span>
                            <div className="fire-stats" style={{ marginTop: 0 }}>
                                <span className="fire-icon">🔥</span>
                                <span style={{ fontWeight: 800 }}>{Math.floor(Math.random() * 50) + 10} interesados</span>
                            </div>
                        </div>

                        <h1 className="product-title-native">{product.title}</h1>
                        <div className="product-price-native" style={{ color: themeColor }}>S/ {Number(product.price || product.originalPrice || 0).toFixed(0)}</div>

                        {/* SELECTOR DE COLOR */}
                        {product.colors && product.colors.length > 0 && (
                            <div className="selector-section" style={{ marginTop: '30px' }}>
                                <span className="selector-label" style={{ fontWeight: 950, opacity: 0.8, fontSize: '0.75rem', letterSpacing: '0.5px' }}>COLORES</span>
                                <div className="color-row-native" style={{ marginTop: '12px' }}>
                                    {product.colors.map((c, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedColor(c)}
                                            className={`color-bubble ${selectedColor === c ? 'active' : ''}`}
                                            style={{ backgroundColor: c, width: '48px', height: '48px', border: selectedColor === c ? `3px solid ${themeColor}` : '2px solid #eee' } as any}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ACCIONES PRINCIPALES (Visible en PC, Oculto en Móvil por el Sticky Bar) */}
                        <div className="action-row-native mobile-hide" style={{ marginTop: '40px' }}>
                            <a
                                href={getWhatsAppLink(product, selectedColor)}
                                target="_blank"
                                className="btn-native-wsp"
                                style={{ textDecoration: 'none', flex: 1, height: '60px' }}
                            >
                                💬 LO QUIERO
                            </a>
                            <button
                                className="btn-native-cart"
                                onClick={() => addToCart(product, selectedColor)}
                                disabled={!!(product.colors?.length && !selectedColor)}
                                style={{ backgroundColor: themeColor, border: 'none', flex: 1.5, height: '60px' }}
                            >
                                🛒 AGREGAR AL CARRITO
                            </button>
                        </div>

                        {/* CARACTERÍSTICAS */}
                        <div className="details-card-native" style={{ marginTop: '40px', background: '#fdfdfd', border: '1px solid #f0f0f0', borderRadius: '25px', padding: '25px' }}>
                            <h4 style={{ color: themeColor, fontSize: '0.75rem', letterSpacing: '1px', fontWeight: 950 }}>ESPECIFICACIONES</h4>
                            <div className="details-list-native" style={{ marginTop: '20px' }}>
                                {details.map((d, i) => (
                                    <div key={i} className="detail-item-native" style={{ padding: '10px 0', borderBottom: i === details.length - 1 ? 'none' : '1px solid #f5f5f5' }}>
                                        <span className="check-native" style={{ color: themeColor, fontSize: '1.1rem' }}>✦</span>
                                        <span style={{ fontSize: '0.95rem', color: '#333', fontWeight: 600 }}>{d}</span>
                                    </div>
                                ))}
                                {details.length === 0 && (
                                    <p style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>Información Premium de Delva.</p>
                                )}
                            </div>
                        </div>

                        {/* ACCIONES DE MASTER */}
                        {isOwner && onRecordSale && (
                            <div style={{ marginTop: '30px', padding: '20px', border: `2px dashed ${themeColor}44`, borderRadius: '25px', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 950, marginBottom: '12px', opacity: 0.6 }}>GESTIÓN DE STOCK</p>
                                <button
                                    onClick={() => onRecordSale(product)}
                                    className="lo-quiero-btn"
                                    style={{ width: '100%', background: themeColor, height: '50px' }}
                                >
                                    REGISTRAR VENTA (+1)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BARRA DE ACCIÓN PEGAJOSA (Solo Móvil) */}
            <div className="sticky-action-bar">
                <a
                    href={getWhatsAppLink(product, selectedColor)}
                    target="_blank"
                    className="btn-native-wsp"
                    style={{ textDecoration: 'none', flex: 1, borderRadius: '18px' }}
                >
                    💬 LO QUIERO
                </a>
                <button
                    className="btn-native-cart"
                    onClick={() => addToCart(product, selectedColor)}
                    disabled={!!(product.colors?.length && !selectedColor)}
                    style={{ backgroundColor: themeColor, border: 'none', flex: 2, borderRadius: '18px' }}
                >
                    🛒 AGREGAR
                </button>
            </div>

            <style>{`
                @media (max-width: 1023px) {
                    .mobile-hide { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default ProductDetailView;
