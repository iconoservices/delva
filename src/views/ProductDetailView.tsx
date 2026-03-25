import React, { useState, useEffect } from 'react'; // 👈 Asegúrate de tener useEffect
import { useParams, useNavigate } from 'react-router-dom';
import type { Product } from '../data/products';
import type { User } from '../App';
import useUserPreferences from '../utils/useUserPreferences';

/**
 * 🌿 VISTA DE DETALLE DE PRODUCTO - REFACTORIZACIÓN NATIVA v1.0
 * -----------------------------------------------------------
 * Esta vista ha sido rediseñada para sentirse como una App Nativa Premium.
 * Incluye: 
 * 1. Proporciones móviles optimizadas.
 * 2. Cabecera dinámica de tienda (Seller Branding).
 * 3. Inyección de tema dinámico basado en el color del vendedor.
 * 
 * 📝 NOTA PARA PROGRAMADORES:
 * - Los estilos se controlan mediante variables CSS inyectadas en el contenedor principal.
 * - El "Seller" se identifica mediante el product.userId. Si no existe, usamos "master".
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
    // 🚩 LOCAL STATE: Color selection shifted from App.tsx
    const [selectedColor, setSelectedColor] = useState<string>('');
    // 🚩 TRACKING: useUserPreferences hook (Algoritmo 70/30)
    const { trackView } = useUserPreferences(currentUser);
    // 🚩 RUTAS: Capturamos el ID del producto de la URL
    const { id } = useParams();
    const navigate = useNavigate();

    // 🚩 ESTADO LOCAL: Manejo de imagen actual y estado del Hype (Favorito)
    const [currentImg, setCurrentImg] = useState(0);
    const [isHype, setIsHype] = useState(false);


    // 🚀 PARCHE: Fix "Problema del Ascensor" (Scroll to Top)
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    // --- 🔍 LÓGICA DE BÚSQUEDA ---
    const product = products.find(p => p.id === id);

    // 🚀 TRACKING: Registrar vista (+1 punto a la categoría) 70/30 🚀
    useEffect(() => {
        if (product && product.categoryId) {
            trackView(product.categoryId);
        }
    }, [id, product, trackView]);

    // 🚩 GUARDRAIL: Si el producto no existe, evitamos el crash y mostramos UI de error
    if (!product) return (
        <div style={{ padding: '100px 20px', textAlign: 'center', background: 'white', minHeight: '100vh' }}>
            <h2 style={{ marginBottom: '20px', fontWeight: 900 }}>Producto no encontrado 🌿</h2>
            <button onClick={() => navigate('/')} className="btn-vibrant" style={{ padding: '15px 40px', borderRadius: '20px' }}>Volver a la tienda</button>
        </div>
    );

    // Identificamos al dueño del producto para cargar su branding.
    const seller = users.find(u => u.id === product.userId) || users.find(u => u.id === 'master') || users[0];
    const isOwner = currentUser && (currentUser.id === seller.id || (currentUser.role === 'master' && !product.userId));
    const themeColor = seller?.customPrimary || '#1A3C34';

    // Unimos la imagen principal con la galería para el carrusel unificado
    const images = [product.image, ...(product.gallery || [])];

    // Usar los detalles reales del producto si existen
    const details = product.details && product.details.length > 0 ? product.details : [];

    return (
        /* 💡 TIP DEV: 'as any' en style es necesario para pasar variables personalizadas de CSS en React TSX */
        <div className="product-mobile-container fade-in" style={{ '--theme-accent': themeColor } as any}>

            {/* 🏪 CABECERA DINÁMICA: Branding de Tienda
                Nota: seller.id se pasa como parámetro u=? a la tienda para filtrar.
            */}
            <header className="product-sticky-header">
                <button onClick={() => navigate(-1)} className="back-btn-native">←</button>

                <div className="seller-profile-anchor" onClick={() => navigate('/')}>
                    <div className="seller-mini-avatar">
                        <span className="avatar-initials">D</span>
                    </div>
                    <div className="seller-header-info">
                        <span className="seller-store-name">DELVA</span>
                        <div className="seller-status-row">
                            <span className="status-dot"></span>
                            <span className="status-text">Marca Oficial</span>
                        </div>
                    </div>
                </div>

                <div className="header-actions-native">
                    <span className="header-icon-action">🔍</span>
                    {/* Evento personalizado 'openCart' capturado globalmente para abrir el drawer */}
                    <div className="cart-trigger-native" onClick={() => (window as any).dispatchEvent(new CustomEvent('openCart'))}>
                        <span>🛒</span>
                        {cartCount > 0 && <span className="cart-badge-native">{cartCount}</span>}
                    </div>
                </div>
            </header>

            <div className="product-detail-grid">

                {/* 📸 VISUAL HERO: Aspect Ratio 4:5 (Proporción perfecta para móvil) */}
                <div className="image-carousel-wrapper">
                    <img src={images[currentImg]} alt={product.title} className="main-detail-img" />

                    {images.length > 1 && (
                        <div className="carousel-dots">
                            {images.map((_, i) => (
                                <div
                                    key={i}
                                    className={`dot ${currentImg === i ? 'active' : ''}`}
                                    onClick={() => setCurrentImg(i)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Botón flotante de Hype con Backdrop Filter (Efecto cristal) */}
                    <div
                        className={`hype-heart ${isHype ? 'active' : ''}`}
                        onClick={() => setIsHype(!isHype)}
                    >
                        {isHype ? '🧡' : '🤍'}
                    </div>
                </div>

                {/* 📝 INFO SHEET: El "corazón" de la página */}
                <div className="product-info-sheet">
                    <span className="category-label-compact" style={{ color: themeColor }}>{product.category}</span>
                    <h1 className="product-title-native">{product.title}</h1>
                    <div className="product-price-native" style={{ color: themeColor }}>S/ {Number(product.price || 0).toFixed(2)}</div>

                    {/* 🎨 SELECTOR DE COLOR: Lógica de validación
                        - Si el producto tiene colores, es obligatorio seleccionar uno para comprar.
                    */}
                    {product.colors && product.colors.length > 0 && (
                        <div className="selector-section">
                            <span className="selector-label">COLORES DISPONIBLES</span>
                            <div className="color-row-native">
                                {product.colors.map((c, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedColor(c)}
                                        className={`color-bubble ${selectedColor === c ? 'active' : ''}`}
                                        /* '--active-border' inyectado para que el borde del color seleccionado sea el de la marca */
                                        style={{ backgroundColor: c, '--active-border': themeColor } as any}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ⚡ BOTONES DE ACCIÓN: Facilitando la conversión
                        - WhatsApp: Abre chat directo con texto pre-formateado.
                        - Carrito: Se deshabilita si falta seleccionar el color.
                    */}
                    <div className="action-row-native">
                        <a
                            href={getWhatsAppLink(product, selectedColor)}
                            target="_blank"
                            className="btn-native-wsp"
                            style={{ textDecoration: 'none', flex: isOwner ? 1 : 1.2 }}
                        >
                            <span>💬</span> WHATSAPP
                        </a>
                        <button
                            className="btn-native-cart"
                            onClick={() => addToCart(product, selectedColor)}
                            disabled={!!(product.colors?.length && !selectedColor)}
                            style={{ backgroundColor: 'var(--primary)', border: 'none', flex: isOwner ? 1 : 2 }}
                        >
                            <span>🛒</span> AGREGAR
                        </button>
                        {isOwner && onRecordSale && (
                            <button
                                onClick={() => onRecordSale(product)}
                                style={{ 
                                    backgroundColor: '#00a651', 
                                    border: 'none', 
                                    width: '54px',
                                    height: '54px',
                                    borderRadius: '50%',
                                    color: 'white',
                                    fontWeight: 900,
                                    fontSize: '1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: '10px',
                                    flexShrink: 0
                                }}
                            >
                                +
                            </button>
                        )}
                    </div>

                    {/* 📋 ESPECIFICACIONES: Lista limpia con iconos Check SVG/Unicode */}
                    <div className="details-card-native">
                        <h4 style={{ color: themeColor }}>DETALLES DEL PRODUCTO</h4>
                        <div className="details-list-native">
                            {details.map((d, i) => (
                                <div key={i} className="detail-item-native">
                                    <span className="check-native" style={{ color: themeColor }}>✓&nbsp;</span>
                                    <span>{d}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailView;
