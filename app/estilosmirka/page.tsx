'use client';

import React, { useState } from 'react';

export default function EstilosMirkaPage() {
  const [cartCount, setCartCount] = useState(0);
  const [activeNav, setActiveNav] = useState('shop');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Listado de productos premium estilo "AURA" con fotos reales de alta costura
  const products = [
    {
      id: 'aura-1',
      title: 'Premium Blazer Suit',
      price: 'S/ 249.00',
      originalPrice: 'S/ 329.00',
      colorCode: '#4A1225',
      colorName: 'Burgundy Imperial',
      image: 'https://images.unsplash.com/photo-1548624149-f9b1859aa7d0?q=80&w=600&auto=format&fit=crop',
      description: 'Traje sastre de dos piezas confeccionado en mezcla de lana premium. Fit estructurado que denota elegancia y empoderamiento.',
      details: ['Botones metálicos grabados', 'Forro de satén italiano', 'Bolsillos laterales con solapa', 'Corte ajustado moderno']
    },
    {
      id: 'aura-2',
      title: 'Silk Rose Blouse',
      price: 'S/ 139.00',
      colorCode: '#FDE4E1',
      colorName: 'Rose Pastel',
      image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600&auto=format&fit=crop',
      description: 'Blusa de seda 100% natural con caída fluida. Una pieza versátil y sofisticada para transicionar del día a la noche.',
      details: ['Cuello de solapa elegante', 'Puños abotonados anchos', 'Cierre frontal oculto', 'Textura ultra suave al tacto']
    },
    {
      id: 'aura-3',
      title: 'Beige Trench Coat',
      price: 'S/ 299.00',
      colorCode: '#D2B48C',
      colorName: 'Camel Trench',
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop',
      description: 'Gabardina clásica cruzada con cinturón ajustable. Cortaviento y resistente al agua con costuras reforzadas.',
      details: ['Cinturón con hebilla de carey', 'Solapas cruzadas clásicas', 'Forro interior jacquard', 'Hebillas ajustables en puños']
    },
    {
      id: 'aura-4',
      title: 'Sleek Tailored Dress',
      price: 'S/ 189.00',
      originalPrice: 'S/ 229.00',
      colorCode: '#1A1A1A',
      colorName: 'Noir Classique',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop',
      description: 'Vestido midi negro con silueta minimalista y sensual. Ideal para eventos formales o cócteles exclusivos.',
      details: ['Cremallera invisible trasera', 'Abertura sutil en pierna', 'Escote cuadrado premium', 'Tejido elástico de alta densidad']
    }
  ];

  return (
    <div className="aura-container">
      {/* Carga de Tipografías Elegantes */}
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;600&display=swap" rel="stylesheet" />

      {/* HEADER DE LUJO */}
      <header className="aura-header">
        <button className="icon-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </button>
        
        <h1 className="aura-logo">AURA</h1>
        
        <div className="header-actions">
          <button className="icon-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
          <button className="icon-btn cart-btn" onClick={() => setCartCount(prev => prev + 1)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span className="cart-badge">{cartCount}</span>
          </button>
        </div>
      </header>

      {/* BANNER PRINCIPAL / HERO SLIDER */}
      <section className="aura-hero">
        <div className="hero-content">
          <span className="hero-tag">Colección de Lujo</span>
          <h2 className="hero-title">Sopfistidante</h2>
          <p className="hero-subtitle">Moda femenina diseñada para cautivar y empoderar.</p>
          <button className="hero-cta" onClick={() => setCartCount(prev => prev + 1)}>Hace más</button>
        </div>
        <div className="hero-image-wrapper">
          <img 
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop" 
            alt="Modelo Colección Aura" 
            className="hero-img"
          />
        </div>
        {/* Puntos del Carrusel */}
        <div className="slider-dots">
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </section>

      {/* SECCIÓN DE PRODUCTOS */}
      <main className="aura-main">
        <div className="section-header">
          <h3 className="section-title">Nuestra Selección</h3>
          <span className="section-subtitle">Exquisitez en cada detalle</span>
        </div>

        <div className="products-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card" onClick={() => setSelectedProduct(product)}>
              <div className="card-image-container">
                <img src={product.image} alt={product.title} className="card-img" />
                {product.originalPrice && <span className="card-offer-tag">Oferta</span>}
              </div>
              <div className="card-details">
                <h4 className="card-title">{product.title}</h4>
                <div className="card-meta">
                  <span className="card-color-dot" style={{ backgroundColor: product.colorCode }}></span>
                  <span className="card-color-name">{product.colorName}</span>
                </div>
                <div className="card-price-row">
                  <span className="card-price">{product.price}</span>
                  {product.originalPrice && <span className="card-old-price">{product.originalPrice}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL DETALLE DE PRODUCTO (QUICK VIEW) */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedProduct(null)}>×</button>
            <div className="modal-body">
              <div className="modal-img-wrapper">
                <img src={selectedProduct.image} alt={selectedProduct.title} className="modal-img" />
              </div>
              <div className="modal-info">
                <h2 className="modal-title">{selectedProduct.title}</h2>
                <div className="modal-price-row">
                  <span className="modal-price">{selectedProduct.price}</span>
                  {selectedProduct.originalPrice && <span className="modal-old-price">{selectedProduct.originalPrice}</span>}
                </div>
                <p className="modal-desc">{selectedProduct.description}</p>
                
                <div className="modal-colors">
                  <span className="option-label">Color:</span>
                  <div className="color-swatch-container">
                    <span className="color-swatch-ring">
                      <span className="color-swatch" style={{ backgroundColor: selectedProduct.colorCode }}></span>
                    </span>
                    <span className="color-swatch-text">{selectedProduct.colorName}</span>
                  </div>
                </div>

                <div className="modal-details">
                  <span className="option-label">Detalles:</span>
                  <ul>
                    {selectedProduct.details.map((d: string, i: number) => (
                      <li key={i}>✦ {d}</li>
                    ))}
                  </ul>
                </div>

                <button className="add-to-cart-btn" onClick={() => {
                  setCartCount(prev => prev + 1);
                  setSelectedProduct(null);
                }}>
                  Añadir al Carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BARRA DE NAVEGACIÓN MÓVIL ESTILO APP */}
      <nav className="aura-bottom-nav">
        <button className={`nav-item ${activeNav === 'home' ? 'active' : ''}`} onClick={() => setActiveNav('home')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Home</span>
        </button>
        <button className={`nav-item ${activeNav === 'shop' ? 'active' : ''}`} onClick={() => setActiveNav('shop')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <span>Shop</span>
        </button>
        <button className={`nav-item ${activeNav === 'search' ? 'active' : ''}`} onClick={() => setActiveNav('search')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span>Search</span>
        </button>
        <button className={`nav-item ${activeNav === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveNav('wishlist')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span>Wishlist</span>
        </button>
        <button className={`nav-item ${activeNav === 'profile' ? 'active' : ''}`} onClick={() => setActiveNav('profile')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>Profil</span>
        </button>
      </nav>

      {/* ESTILOS INLINE PARA MÁXIMA CONTROL DE DISEÑO */}
      <style jsx global>{`
        :root {
          --aura-bg: #FAF0EC;
          --aura-primary: #4A1225;
          --aura-primary-rgb: 74, 18, 37;
          --aura-text: #2D2522;
          --aura-card-bg: #FFFFFF;
          --aura-white: #FFFFFF;
        }

        body {
          margin: 0;
          background-color: var(--aura-bg);
          color: var(--aura-text);
          font-family: 'Outfit', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .aura-container {
          max-width: 480px;
          margin: 0 auto;
          min-height: 100vh;
          background-color: var(--aura-bg);
          position: relative;
          padding-bottom: 90px; /* Espacio para barra de navegación inferior */
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.05);
          overflow-x: hidden;
        }

        /* HEADER */
        .aura-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background-color: var(--aura-bg);
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid rgba(74, 18, 37, 0.06);
        }

        .aura-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.2rem;
          font-weight: 600;
          letter-spacing: 4px;
          margin: 0;
          color: var(--aura-primary);
          text-align: center;
        }

        .icon-btn {
          background: none;
          border: none;
          color: var(--aura-primary);
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .icon-btn:hover {
          background-color: rgba(74, 18, 37, 0.04);
        }

        .header-actions {
          display: flex;
          gap: 4px;
        }

        .cart-btn {
          position: relative;
        }

        .cart-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background-color: var(--aura-primary);
          color: white;
          font-size: 0.65rem;
          font-weight: bold;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* HERO BANNER */
        .aura-hero {
          margin: 16px 20px;
          border-radius: 24px;
          background: linear-gradient(135deg, #4A1225 0%, #2D0512 100%);
          color: var(--aura-white);
          padding: 30px 24px;
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          overflow: hidden;
          min-height: 190px;
          box-shadow: 0 10px 25px rgba(74, 18, 37, 0.15);
        }

        .hero-content {
          max-width: 60%;
          z-index: 10;
        }

        .hero-tag {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          opacity: 0.8;
          display: block;
          margin-bottom: 4px;
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.2rem;
          font-weight: 400;
          margin: 0 0 8px 0;
          letter-spacing: 1px;
        }

        .hero-subtitle {
          font-size: 0.78rem;
          font-weight: 300;
          margin: 0 0 16px 0;
          opacity: 0.85;
          line-height: 1.4;
        }

        .hero-cta {
          background-color: var(--aura-white);
          color: var(--aura-primary);
          border: none;
          padding: 10px 20px;
          border-radius: 30px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .hero-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
        }

        .hero-image-wrapper {
          position: absolute;
          right: 0;
          bottom: 0;
          top: 0;
          width: 42%;
          overflow: hidden;
        }

        .hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
        }

        .slider-dots {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
          z-index: 15;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.3);
          transition: width 0.3s, background-color 0.3s;
        }

        .dot.active {
          background-color: var(--aura-white);
          width: 14px;
          border-radius: 30px;
        }

        /* SECTION HEADER */
        .aura-main {
          padding: 16px 20px;
        }

        .section-header {
          margin-bottom: 20px;
          text-align: center;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.8rem;
          font-weight: 600;
          margin: 0;
          color: var(--aura-primary);
          letter-spacing: 1px;
        }

        .section-subtitle {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 2px;
          opacity: 0.6;
          display: block;
          margin-top: 4px;
        }

        /* PRODUCTS GRID */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .product-card {
          background-color: var(--aura-card-bg);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(74, 18, 37, 0.03);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(74, 18, 37, 0.08);
        }

        .card-image-container {
          position: relative;
          aspect-ratio: 4 / 5;
          width: 100%;
          overflow: hidden;
          background-color: #f7f7f7;
        }

        .card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .product-card:hover .card-img {
          transform: scale(1.05);
        }

        .card-offer-tag {
          position: absolute;
          top: 10px;
          left: 10px;
          background-color: var(--aura-primary);
          color: white;
          font-size: 0.65rem;
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 30px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .card-details {
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .card-title {
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0;
          color: var(--aura-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .card-color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .card-color-name {
          font-size: 0.72rem;
          color: #777;
          font-weight: 300;
        }

        .card-price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .card-price {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--aura-primary);
        }

        .card-old-price {
          font-size: 0.8rem;
          text-decoration: line-through;
          color: #aaa;
        }

        /* BOTTOM NAVIGATION BAR */
        .aura-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          background-color: var(--aura-white);
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 12px 0 20px 0; /* padding inferior adicional para iPhones y pantallas sin marco */
          border-top-left-radius: 24px;
          border-top-right-radius: 24px;
          box-shadow: 0 -10px 30px rgba(74, 18, 37, 0.05);
          z-index: 100;
        }

        .nav-item {
          background: none;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: #9c8e8a;
          cursor: pointer;
          transition: color 0.2s;
          padding: 6px 12px;
        }

        .nav-item svg {
          transition: transform 0.2s;
        }

        .nav-item:hover svg {
          transform: scale(1.1);
        }

        .nav-item.active {
          color: var(--aura-primary);
        }

        .nav-item span {
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.5px;
        }

        /* MODAL QUICK VIEW */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 200;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.3s ease;
        }

        .modal-content {
          background-color: var(--aura-bg);
          width: 100%;
          max-width: 480px;
          border-top-left-radius: 32px;
          border-top-right-radius: 32px;
          position: relative;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 -15px 40px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background-color: rgba(74, 18, 37, 0.08);
          border: none;
          color: var(--aura-primary);
          font-size: 1.5rem;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: background-color 0.2s;
        }

        .close-btn:hover {
          background-color: rgba(74, 18, 37, 0.15);
        }

        .modal-body {
          display: flex;
          flex-direction: column;
        }

        .modal-img-wrapper {
          width: 100%;
          aspect-ratio: 4 / 5;
          overflow: hidden;
        }

        .modal-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .modal-info {
          padding: 24px;
          background-color: var(--aura-bg);
        }

        .modal-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.2rem;
          font-weight: 600;
          margin: 0 0 10px 0;
          color: var(--aura-primary);
        }

        .modal-price-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 16px;
        }

        .modal-price {
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--aura-primary);
        }

        .modal-old-price {
          font-size: 1.1rem;
          text-decoration: line-through;
          color: #aaa;
        }

        .modal-desc {
          font-size: 0.88rem;
          line-height: 1.5;
          color: #555;
          margin: 0 0 20px 0;
          font-weight: 300;
        }

        .option-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #888;
          font-weight: 600;
          display: block;
          margin-bottom: 8px;
        }

        .modal-colors {
          margin-bottom: 20px;
        }

        .color-swatch-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .color-swatch-ring {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1.5px solid var(--aura-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .color-swatch {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: block;
        }

        .color-swatch-text {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--aura-primary);
        }

        .modal-details {
          margin-bottom: 24px;
        }

        .modal-details ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .modal-details li {
          font-size: 0.82rem;
          color: #666;
          margin-bottom: 6px;
          font-weight: 300;
        }

        .add-to-cart-btn {
          width: 100%;
          background-color: var(--aura-primary);
          color: white;
          border: none;
          padding: 16px;
          border-radius: 30px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(74, 18, 37, 0.2);
          transition: transform 0.2s, filter 0.2s;
        }

        .add-to-cart-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        /* ANIMACIONES */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
