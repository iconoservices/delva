import { useState, useEffect, useMemo, useRef } from 'react';
import { products as initialProducts, CATEGORIES, type Product } from './data/products';

// --- TYPES ---
interface CartItem extends Product { quantity: number; }
interface User { id: string; name: string; role: 'admin' | 'colaborador'; password?: string; initials: string; }

// --- HELPERS ---
const safeLoad = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed) return parsed;
    }
  } catch (e) { console.error('Error loading', key, e); }
  return fallback;
};

export default function App() {
  // --- STATE ---
  // Utilizamos v6 para asegurar una instalación limpia y no mezclar datos viejos corruptos
  const [products, setProducts] = useState<Product[]>(() => safeLoad('delva_productos_v6', initialProducts));
  const [users, setUsers] = useState<User[]>(() => safeLoad('delva_users_v6', [
    { id: 'master', name: 'DELVA PRO', role: 'admin', initials: 'DP', password: 'delva2026' }
  ]));
  const [currentUser, setCurrentUser] = useState<User | null>(() => safeLoad('delva_sesion_v6', null));

  // UX / UI States
  const [activeCategory, setActiveCategory] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modals
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedProfileForLogin, setSelectedProfileForLogin] = useState<User | null>(null);
  const [loginPassword, setLoginPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('delva_productos_v6', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('delva_users_v6', JSON.stringify(users)); }, [users]);
  useEffect(() => {
    if (currentUser) localStorage.setItem('delva_sesion_v6', JSON.stringify(currentUser));
    else localStorage.removeItem('delva_sesion_v6');
  }, [currentUser]);

  // --- LOGIC: CART ---
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeCartItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const totalCart = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // --- LOGIC: WHATSAPP ---
  const getWhatsAppLink = (p: Product) => {
    const msg = `¡Hola DELVA! Me interesa este producto: *${p.title}* (S/ ${p.price.toFixed(2)}). ¿Me dan más info?`;
    return `https://wa.me/51900000000?text=${encodeURIComponent(msg)}`;
  };

  const getCartWA = () => {
    const list = cart.map(i => `- ${i.quantity}x ${i.title} (S/ ${i.price.toFixed(2)})`).join('\n');
    return `https://wa.me/51900000000?text=${encodeURIComponent(`¡Hola DELVA! Quiero hacer el siguiente pedido:\n\n${list}\n\n*Total: S/ ${totalCart.toFixed(2)}*`)}`;
  };

  // --- LOGIC: AUTH ---
  const attemptLogin = () => {
    if (!selectedProfileForLogin) return;
    if (loginPassword.toLowerCase().trim() === selectedProfileForLogin.password) {
      setCurrentUser(selectedProfileForLogin);
      setShowLogin(false);
      setSelectedProfileForLogin(null);
      setLoginPassword('');
    } else {
      alert('Contraseña Incorrecta. Recordatorio: todo junto y minúsculas.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLogin(false);
  };

  // --- LOGIC: PRODUCT MANAGE ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      const reader = new FileReader();
      reader.onloadend = () => { setEditingProduct({ ...editingProduct, image: reader.result as string }); };
      reader.readAsDataURL(file);
    }
  };

  const saveProduct = (data: any) => {
    if (!data.title || !data.price) return alert('Debes ponerle nombre y precio para publicarlo.');
    const cat = CATEGORIES.find(c => c.id === data.categoryId);
    const productData = {
      ...data,
      id: data.id || Date.now().toString(),
      price: Number(data.price),
      category: cat?.name || 'Varios'
    };

    if (data.id) setProducts(products.map(p => p.id === data.id ? productData : p));
    else setProducts([productData, ...products]);

    setEditingProduct(null);
  };

  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return []; // Safety check
    if (activeCategory === 'all') return products;
    return products.filter(p => p.categoryId === activeCategory);
  }, [activeCategory, products]);

  // --- RENDER ---
  return (
    <>
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div className="logo">🌿 DELVA</div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button className="nav-btn" onClick={() => currentUser ? handleLogout() : setShowLogin(true)} title={currentUser ? "Cerrar Sesión" : "Acceso Staff"}>
              {currentUser ? currentUser.initials : '🔑'}
            </button>
            <button className="nav-btn" onClick={() => setIsCartOpen(true)}>
              🛒 {cartItemCount > 0 && <span className="badge">{cartItemCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      <main style={{ marginTop: '70px' }}>
        {/* DASHBOARD STAFF */}
        {currentUser && (
          <section className="admin-section">
            <div className="container">
              <h2 style={{ fontFamily: 'Playfair Display' }}>⚡ Panel: {currentUser.name}</h2>
              <p style={{ opacity: 0.7, textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 800 }}>{currentUser.role}</p>

              <div className="stats-row">
                <div className="stat-box">
                  <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>Productos</p>
                  <div className="stat-val">{products.length || 0}</div>
                </div>
                {currentUser.role === 'admin' && (
                  <div className="stat-box">
                    <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>Equipo</p>
                    <div className="stat-val">{users.length || 0} perfiles</div>
                  </div>
                )}
              </div>

              {/* ADMIN ONLY: USER MANAGEMENT INFO */}
              {currentUser.role === 'admin' && (
                <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Usuarios con Acceso</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {users.map(u => (
                      <div key={u.id} style={{ padding: '5px 15px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.8rem' }}>
                        {u.name} ({u.role})
                        {u.id !== 'master' && <button onClick={() => setUsers(users.filter(usr => usr.id !== u.id))} style={{ color: '#ff6b6b', marginLeft: '10px', background: 'transparent' }}>✕</button>}
                      </div>
                    ))}
                    <button style={{ color: 'var(--accent)', background: 'transparent', fontWeight: 800 }} onClick={() => {
                      const n = prompt('Nombre del nuevo colaborador:');
                      const p = prompt('Contraseña (pegado y mins):');
                      if (n && p) {
                        setUsers([...users, { id: Date.now().toString(), name: n, role: 'colaborador', initials: n.substring(0, 2).toUpperCase(), password: p }]);
                      }
                    }}>+ Agregar Perfil</button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* HERO SECTION */}
        {!currentUser && (
          <header className="hero">
            <h1 className="hero-title">La esencia de la selva</h1>
          </header>
        )}

        {/* TIENDA / CATALOGO */}
        <div className="container">
          <div className="categories-slider">
            {CATEGORIES.map(cat => (
              <button key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', opacity: 0.5 }}>No hay productos en esta categoría.</div>
          ) : (
            <div className="grid">
              {filteredProducts.map((p) => (
                <div key={p.id} className="card fade-in">

                  {/* ADMIN CONTROLS PER CARD */}
                  {currentUser && (
                    <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 5, zIndex: 10 }}>
                      <button className="admin-btn edit" onClick={() => setEditingProduct(p)}>✏️</button>
                      {(currentUser.role === 'admin') &&
                        <button className="admin-btn delete" onClick={() => setProducts(products.filter(item => item.id !== p.id))}>🗑️</button>
                      }
                    </div>
                  )}

                  <div className="card-image-wrapper">
                    <img src={p.image || 'https://via.placeholder.com/400x400?text=No+Photo'} className="card-image" alt={p.title} />
                  </div>
                  <div className="card-content">
                    <p style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>{p.category}</p>
                    <h3 className="card-title">{p.title}</h3>
                    <div className="card-price">S/ {p.price.toFixed(2)}</div>
                    <div className="card-buttons">
                      <button className="btn-cart" onClick={() => addToCart(p)}>Añadir a Carrito</button>
                      <a href={getWhatsAppLink(p)} target="_blank" rel="noopener noreferrer" className="btn-wa-direct">Consultar en WhatsApp</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FAB - NUEVO PRODUCTO (Cualquier staff) */}
      {currentUser && (
        <div className="fab" onClick={() => setEditingProduct({ title: '', price: '', categoryId: 'cafe', image: '' })}>
          +
        </div>
      )}

      {/* LOGIN: SELECT PROFILE + PASSWORD MODAL */}
      <div className={`modal-overlay ${showLogin ? 'open' : ''}`} onClick={() => { setShowLogin(false); setSelectedProfileForLogin(null); }}>
        <div className="modal-card" onClick={e => e.stopPropagation()}>
          {!selectedProfileForLogin ? (
            <>
              <h2 style={{ textAlign: 'center', marginBottom: '15px' }}>¿Quién ingresa?</h2>
              <div className="profile-grid">
                {users.map((u) => (
                  <div key={u.id} className="profile-card" onClick={() => setSelectedProfileForLogin(u)}>
                    <div className="profile-avatar">{u.initials}</div>
                    <div style={{ marginTop: '10px', fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{u.role}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ marginBottom: '20px' }}>Hola, {selectedProfileForLogin.name}</h2>
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && attemptLogin()}
                autoFocus
                className="input-field"
              />
              <button className="btn-cart" style={{ width: '100%', padding: '15px', marginTop: '10px' }} onClick={attemptLogin}>Entrar al Sistema</button>
              <button style={{ marginTop: '20px', opacity: 0.6, background: 'transparent', color: 'var(--text)', border: 'none' }} onClick={() => setSelectedProfileForLogin(null)}>← Atrás</button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDIT/ADD PRODUCT (Upload Photo) */}
      <div className={`modal-overlay ${editingProduct ? 'open' : ''}`} onClick={() => setEditingProduct(null)}>
        {editingProduct && (
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '20px' }}>{editingProduct.id ? 'Editar Anuncio' : 'Nuevo en Market'}</h2>

            <div className="file-input-wrapper" onClick={() => fileInputRef.current?.click()}>
              {editingProduct.image ? (
                <img src={editingProduct.image} style={{ width: '100%', maxHeight: '150px', objectFit: 'contain' }} alt="Preview" />
              ) : (
                <>
                  <p style={{ fontSize: '2rem', marginBottom: '10px' }}>📸</p>
                  <p style={{ fontWeight: 600 }}>Toca para capturar</p>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>o subir foto de galería</p>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
            </div>

            <label className="input-label">Nombre del Producto</label>
            <input className="input-field" value={editingProduct.title || ''} onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })} placeholder="Ej: Camisa Lino Selvático" />

            <label className="input-label">Precio Total (S/)</label>
            <input className="input-field" type="number" value={editingProduct.price || ''} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} placeholder="0.00" />

            <label className="input-label">¿En qué sección va?</label>
            <select className="input-field" value={editingProduct.categoryId || 'cafe'} onChange={e => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}>
              {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <button className="btn-cart" style={{ width: '100%', padding: 15, marginTop: 10 }} onClick={() => saveProduct(editingProduct)}>
              ¡Publicar al instante!
            </button>
          </div>
        )}
      </div>

      {/* CARRITO PANELS */}
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}>
        <div className="cart-drawer" onClick={e => e.stopPropagation()}>
          <div className="cart-header">
            <h2 style={{ fontFamily: 'Playfair Display' }}>Tu Pedido 🛒</h2>
            <button onClick={() => setIsCartOpen(false)} className="close-btn">✕</button>
          </div>

          <div className="cart-body">
            {cart.length === 0 ? <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '50px' }}>Tu carrito está vacío.</p> : null}
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image || 'https://via.placeholder.com/100'} alt={item.title} />
                <div className="cart-item-info">
                  <div className="cart-item-title">{item.title}</div>
                  <div className="cart-item-price">S/ {item.price.toFixed(2)}</div>
                </div>
                <div className="cart-qty-controls">
                  <button className="cart-qty-btn" onClick={() => { if (item.quantity === 1) removeCartItem(item.id); else updateCartQty(item.id, -1); }}>-</button>
                  <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                  <button className="cart-qty-btn" onClick={() => updateCartQty(item.id, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <div className="cart-total-row">
              <span>Total:</span>
              <span style={{ color: 'var(--primary)' }}>S/ {totalCart.toFixed(2)}</span>
            </div>
            <a href={getCartWA()} target="_blank" rel="noopener noreferrer" className="btn-wa-direct" style={{ textAlign: 'center', padding: '15px 0', fontSize: '1rem' }}>
              🌿 Finalizar Pedido Completo
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
