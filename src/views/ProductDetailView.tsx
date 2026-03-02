import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Product } from '../data/products';

interface ProductDetailViewProps {
    products: Product[];
    addToCart: (product: Product, color?: string) => void;
    getWhatsAppLink: (product: Product, color?: string) => string;
    selectedColor: string;
    setSelectedColor: (val: string) => void;
}

const ProductDetailView: React.FC<ProductDetailViewProps> = ({
    products,
    addToCart,
    getWhatsAppLink,
    selectedColor,
    setSelectedColor
}) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const product = products.find(p => p.id === id);

    if (!product) return (
        <div className="container" style={{ padding: '100px 20px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '2rem' }}>Producto no encontrado 🌿</h2>
            <button onClick={() => navigate('/')} className="btn-cart" style={{ padding: '15px 40px' }}>Volver a la tienda</button>
        </div>
    );

    return (
        <div className="container" style={{ padding: '20px', marginTop: '20px', paddingBottom: '100px' }}>
            <button onClick={() => navigate(-1)} style={{ background: 'transparent', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', opacity: 0.6 }}>
                <span style={{ fontSize: '1.2rem' }}>←</span> Volver
            </button>

            <div className="detail-grid">
                <div className="detail-image-col">
                    {/* Main Image & Gallery */}
                    <div style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: '15px', scrollBehavior: 'smooth', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }} className="gallery-scroll">
                        <img src={product.image} style={{ width: '100%', scrollSnapAlign: 'start', flexShrink: 0, objectFit: 'cover', aspectRatio: '1/1' }} />
                        {product.gallery?.map((img, i) => (
                            <img key={i} src={img} style={{ width: '100%', scrollSnapAlign: 'start', flexShrink: 0, objectFit: 'cover', aspectRatio: '1/1' }} />
                        ))}
                    </div>
                </div>

                <div style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>{product.category}</span>
                        {product.tags?.map(t => (
                            <span key={t} style={{ background: 'var(--bg)', border: '1px solid rgba(0,0,0,0.05)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>{t}</span>
                        ))}
                    </div>

                    <h1 style={{ marginBottom: '20px', fontSize: '3rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--primary)' }}>{product.title}</h1>

                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '35px' }}>S/ {Number(product.price || 0).toFixed(2)}</div>

                    <div style={{ background: 'var(--surface)', padding: '25px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '35px' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', opacity: 0.5, marginBottom: '15px', letterSpacing: '1px' }}>Información de Envío</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
                                <div style={{ background: 'var(--wa-green)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>✓</div>
                                Pagos contra entrega.
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
                                <div style={{ background: 'var(--wa-green)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>✓</div>
                                Delivery gratis en Pucallpa.
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
                                <div style={{ background: 'var(--wa-green)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>✓</div>
                                Envíos nacionales via Shalom.
                            </div>
                        </div>
                    </div>

                    {/* Colors */}
                    {product.colors && product.colors.length > 0 && (
                        <div style={{ marginBottom: '40px' }}>
                            <p style={{ fontWeight: 800, fontSize: '0.75rem', marginBottom: '15px', textTransform: 'uppercase', color: 'var(--primary)', opacity: 0.5, letterSpacing: '1px' }}>Elige un Color</p>
                            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                {product.colors.map((c, i) => (
                                    <button key={i}
                                        onClick={() => setSelectedColor(c)}
                                        style={{
                                            width: '45px', height: '45px', borderRadius: '50%', backgroundColor: c,
                                            border: selectedColor === c ? '3px solid var(--primary)' : '1px solid rgba(0,0,0,0.1)',
                                            padding: '0', cursor: 'pointer',
                                            transform: selectedColor === c ? 'scale(1.1)' : 'scale(1)',
                                            transition: 'var(--transition)',
                                            boxShadow: selectedColor === c ? 'var(--shadow-md)' : 'none'
                                        }}>
                                    </button>
                                ))}
                            </div>
                            {!selectedColor && <p style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: '15px', fontWeight: 700 }}>* Es obligatorio seleccionar un color</p>}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                        <button
                            className="btn-wa"
                            style={{
                                padding: '22px',
                                fontSize: '1rem',
                                fontWeight: 800,
                                opacity: (product.colors?.length && !selectedColor) ? 0.3 : 1,
                                background: 'var(--primary)',
                                color: 'white',
                                transition: 'var(--transition)'
                            }}
                            disabled={!!(product.colors?.length && !selectedColor)}
                            onClick={() => addToCart(product, selectedColor)}
                        >
                            AÑADIR AL CARRITO 🛒
                        </button>
                        <a
                            href={getWhatsAppLink(product, selectedColor)}
                            target="_blank"
                            className="btn-wa"
                            style={{
                                padding: '22px',
                                fontSize: '1rem',
                                fontWeight: 800,
                                textAlign: 'center',
                                background: 'var(--wa-green)',
                                color: 'white'
                            }}
                        >
                            PEDIR POR WHATSAPP 🌿
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailView;
