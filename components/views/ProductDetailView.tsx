'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Product } from '@/lib/data/products';
import type { User } from '@/lib/types';
import useUserPreferences from '@/lib/utils/useUserPreferences';
import ColorSwatch from '../common/ColorSwatch';

/**
 * 🌿 VISTA DE DETALLE DE PRODUCTO — DELVA Premium v3.0
 * Estilo: Imagen hero full-width + panel info oscuro abajo.
 * Mobile-first inspirado en apps de delivery premium.
 */

interface ProductDetailViewProps {
    isLoading?: boolean;
    products: Product[];
    users: User[];
    addToCart: (product: Product, color?: string) => void;
    getWhatsAppLink: (product: Product, color?: string) => string;
    cartCount: number;
    currentUser: User | null;
    onRecordSale?: (product: Product) => void;
}

const ProductDetailView: React.FC<ProductDetailViewProps> = ({
    isLoading,
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
    const params = useParams();
    const slug = params?.slug as string;
    const router = useRouter();

    const [currentImg, setCurrentImg] = useState(0);
    const [isHype, setIsHype] = useState(false);
    const [currentUrl, setCurrentUrl] = useState('');
    const [addedBounce, setAddedBounce] = useState(false);

    useEffect(() => { window.scrollTo(0, 0); }, [slug]);
    useEffect(() => { setCurrentUrl(window.location.href); }, []);

    const canGoBack = useRef(false);
    useEffect(() => {
        canGoBack.current = window.history.length > 1 && document.referrer.includes(window.location.origin);
    }, []);

    const product = products.find(p => p.slug === slug || p.id === slug);

    useEffect(() => {
        if (product?.categoryId) trackView(product.categoryId);
    }, [slug, product, trackView]);

    if (isLoading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fafaf8' }}>
            <div className="loading-spinner" style={{ borderTopColor: '#1A3C34', width: '40px', height: '40px', marginBottom: '16px' }} />
            <p style={{ color: '#888', fontWeight: 600, fontSize: '0.9rem' }}>Cargando producto...</p>
        </div>
    );

    if (!product) return (
        <div style={{ padding: '100px 20px', textAlign: 'center', background: '#fafaf8', minHeight: '100vh' }}>
            <h2 style={{ color: '#1a1a1a', marginBottom: '20px', fontWeight: 900 }}>Producto no encontrado 🌿</h2>
            <button onClick={() => router.push('/')} style={{ padding: '15px 40px', borderRadius: '20px', background: '#1A3C34', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 800 }}>Volver a la tienda</button>
        </div>
    );

    const seller = (users && users.length > 0)
        ? (users.find(u => u.id === product.userId) || users.find(u => u.id === 'master') || users[0])
        : { name: 'Vendedor Delva', storeName: 'Tienda Delva', id: 'default', photoURL: '', initials: 'TD', customPrimary: '#1A3C34', role: 'socio' as any, whatsapp: '', email: '' };

    const isOwner = currentUser && (currentUser.id === seller.id || (currentUser.role === 'master' && !product.userId));
    const themeColor = seller?.customPrimary || '#1A3C34';

    const images = [product.image, ...(product.gallery || [])].filter(img => img && img.trim() !== '');
    const isOutOfStock = (Number(product.stock) || 0) <= 0;
    const details = product.details && product.details.length > 0 ? product.details : [];

    const discount = product.hasOffer && product.originalPrice
        ? Math.round((1 - Number(product.price) / Number(product.originalPrice)) * 100)
        : 0;

    const handleAddToCart = () => {
        addToCart(product, selectedColor);
        setAddedBounce(true);
        setTimeout(() => setAddedBounce(false), 600);
    };

    return (
        <div className="product-detail-layout">

            {/* ══ HERO IMAGE ══ */}
            <div className="product-image-section">
                {images.map((img, i) => (
                    <img
                        key={i}
                        src={img}
                        alt={`${product.title} - ${i}`}
                        style={{
                            position: 'absolute', top: 0, left: 0,
                            width: '100%', height: '100%', objectFit: 'cover',
                            opacity: currentImg === i ? 1 : 0,
                            transition: 'opacity 0.5s ease',
                            zIndex: currentImg === i ? 2 : 1
                        }}
                    />
                ))}

                {/* (Gradiente oscuro eliminado según solicitud) */}

                {/* Botón atrás */}
                <button
                    onClick={() => canGoBack.current ? router.back() : router.push('/')}
                    style={{
                        position: 'absolute', top: '20px', left: '16px', zIndex: 10,
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white', fontSize: '1.1rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900
                    }}
                >←</button>

                {/* Carrito */}
                <div
                    onClick={() => (window as any).dispatchEvent(new CustomEvent('openCart'))}
                    style={{
                        position: 'absolute', top: '20px', right: '16px', zIndex: 10,
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem'
                    }}
                >
                    🛒
                    {cartCount > 0 && (
                        <span style={{
                            position: 'absolute', top: '-4px', right: '-4px',
                            background: themeColor, color: 'white',
                            width: '18px', height: '18px', borderRadius: '50%',
                            fontSize: '0.65rem', fontWeight: 900,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>{cartCount}</span>
                    )}
                </div>

                {/* Like */}
                <button
                    onClick={() => setIsHype(!isHype)}
                    style={{
                        position: 'absolute', top: '70px', right: '16px', zIndex: 10,
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.1rem'
                    }}
                >{isHype ? '🧡' : '🤍'}</button>

                {/* Badge agotado / oferta */}
                {isOutOfStock && (
                    <div style={{
                        position: 'absolute', top: '20px', left: '68px', zIndex: 10,
                        background: '#f39c12', color: 'white',
                        padding: '6px 14px', borderRadius: '12px',
                        fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.5px'
                    }}>RESERVAR</div>
                )}
                {!isOutOfStock && discount > 0 && (
                    <div style={{
                        position: 'absolute', top: '20px', left: '68px', zIndex: 10,
                        background: '#e74c3c', color: 'white',
                        padding: '6px 14px', borderRadius: '12px',
                        fontSize: '0.7rem', fontWeight: 900
                    }}>-{discount}%</div>
                )}

                {/* Dots galería */}
                {images.length > 1 && (
                    <div style={{ position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '6px' }}>
                        {images.map((_, i) => (
                            <div
                                key={i}
                                onClick={() => setCurrentImg(i)}
                                style={{
                                    width: currentImg === i ? '22px' : '7px',
                                    height: '7px', borderRadius: '4px', cursor: 'pointer',
                                    background: currentImg === i ? themeColor : 'rgba(255,255,255,0.4)',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* (Título movido al panel claro) */}
            </div>

            {/* ══ PANEL INFO CLARO ══ */}
            <div className="product-info-section">

                {/* Título y Categoría */}
                <div style={{ marginBottom: '20px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: themeColor, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        {product.category}
                    </span>
                    <h1 style={{
                        margin: '8px 0 0', color: '#1a1a1a',
                        fontSize: '1.6rem',
                        fontWeight: 950, lineHeight: 1.2,
                        fontStyle: 'italic',
                        letterSpacing: '-0.5px'
                    }}>
                        {product.title.toUpperCase()}
                    </h1>
                </div>

                {/* Descripción */}
                {product.description && (
                    <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 24px', fontWeight: 500 }}>
                        {product.description}
                    </p>
                )}

                {/* Precio */}
                <div style={{ marginBottom: '24px' }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 900, color: '#999', letterSpacing: '2px', marginBottom: '4px' }}>PRECIO</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                        <span style={{ fontSize: '2.2rem', fontWeight: 950, color: themeColor, letterSpacing: '-1px' }}>
                            S/ {Number(product.price || 0).toFixed(2)}
                        </span>
                        {product.hasOffer && product.originalPrice && (
                            <span style={{ fontSize: '1rem', color: '#bbb', textDecoration: 'line-through', fontWeight: 600 }}>
                                S/ {Number(product.originalPrice).toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Colores */}
                {product.colors && product.colors.length > 0 && (
                    <div style={{ marginBottom: '24px', padding: '16px', background: 'white', borderRadius: '18px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#999', letterSpacing: '1.5px' }}>
                            {product.colors.length > 1 ? 'COMBINACIÓN DE COLOR' : 'COLOR DEL PRODUCTO'}
                        </span>
                        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <ColorSwatch colors={product.colors} size="44px" border="3px solid #eee" shadow="0 4px 12px rgba(0,0,0,0.1)" />
                            <div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1a1a1a' }}>
                                    {product.colors.length > 1 ? 'Edición Bicolor' : 'Color Sólido'}
                                </span>
                                <br />
                                <span style={{ fontSize: '0.7rem', color: '#999', fontWeight: 600 }}>Identidad del Modelo</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Especificaciones */}
                {details.length > 0 && (
                    <div style={{ marginBottom: '24px', padding: '16px', background: 'white', borderRadius: '18px', border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#999', letterSpacing: '1.5px' }}>ESPECIFICACIONES</span>
                        <div style={{ marginTop: '12px' }}>
                            {details.map((d: string, i: number) => (
                                <div key={i} style={{ padding: '8px 0', borderBottom: i < details.length - 1 ? '1px solid #f0f0f0' : 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ color: themeColor, fontSize: '0.9rem' }}>✦</span>
                                    <span style={{ fontSize: '0.9rem', color: '#333', fontWeight: 600 }}>{d}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}



                {/* Acción Master */}
                {isOwner && onRecordSale && (
                    <div style={{ marginTop: '16px', padding: '16px', border: `2px dashed ${themeColor}44`, borderRadius: '18px', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 900, marginBottom: '10px', color: '#666', letterSpacing: '1px' }}>GESTIÓN DE STOCK</p>
                        <button
                            onClick={() => onRecordSale(product)}
                            style={{ width: '100%', background: themeColor, color: 'white', border: 'none', borderRadius: '14px', height: '46px', fontWeight: 900, fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                            REGISTRAR VENTA (+1)
                        </button>
                    </div>
                )}
            </div>

            {/* ══ BARRA DE ACCIÓN FIJA ══ */}
            <div className="product-action-bar">
                <a
                    href={getWhatsAppLink(product, selectedColor)}
                    target="_blank"
                    style={{
                        flex: 1, height: '58px', borderRadius: '18px',
                        background: 'white', border: `1.5px solid ${themeColor}55`,
                        color: themeColor, fontWeight: 900, fontSize: '0.8rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        textDecoration: 'none', gap: '6px', letterSpacing: '0.5px'
                    }}
                >
                    💬 CONSULTAR
                </a>
                <button
                    onClick={handleAddToCart}
                    disabled={!!(product.colors?.length && !selectedColor)}
                    style={{
                        flex: 2, height: '58px', borderRadius: '18px',
                        background: isOutOfStock
                            ? 'linear-gradient(135deg, #f39c12, #e67e22)'
                            : `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)`,
                        color: 'white', border: 'none', cursor: 'pointer',
                        fontWeight: 900, fontSize: '0.9rem', letterSpacing: '1px',
                        boxShadow: `0 8px 30px ${themeColor}55`,
                        transform: addedBounce ? 'scale(0.96)' : 'scale(1)',
                        transition: 'transform 0.15s ease'
                    }}
                >
                    {isOutOfStock ? '🗓️ RESERVAR AHORA' : '🛒 AGREGAR A LA ORDEN'}
                </button>
            </div>

            <style>{`
                .product-detail-layout {
                    background: #fafaf8;
                    min-height: 100vh;
                    max-width: 480px;
                    margin: 0 auto;
                    position: relative;
                    font-family: inherit;
                }
                .product-image-section {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 1/1;
                    overflow: hidden;
                    background: #f5f5f5;
                }
                .product-info-section {
                    background: #fafaf8;
                    padding: 24px 20px 140px;
                    position: relative;
                    z-index: 4;
                }
                .product-action-bar {
                    position: fixed;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100%;
                    max-width: 480px;
                    padding: 16px 20px 28px;
                    background: linear-gradient(to top, #fafaf8 75%, transparent);
                    display: flex;
                    gap: 12px;
                    z-index: 100;
                }

                @media (min-width: 1024px) {
                    .product-detail-layout {
                        max-width: 1200px;
                        padding: 80px 40px;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 80px;
                        align-items: start;
                        background: white;
                    }
                    .product-image-section {
                        border-radius: 30px;
                        position: sticky;
                        top: 100px;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.08);
                    }
                    .product-info-section {
                        padding: 0;
                        background: transparent;
                    }
                    .product-action-bar {
                        position: relative;
                        bottom: auto;
                        left: auto;
                        transform: none;
                        max-width: 100%;
                        padding: 20px 0 0 0;
                        background: transparent;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProductDetailView;
