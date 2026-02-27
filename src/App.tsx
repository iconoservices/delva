import { useState, useEffect, useMemo, useRef } from 'react';
import { products as initialProducts, CATEGORIES, type Product } from './data/products';

// --- TYPES ---
interface CartItem extends Product { quantity: number; }
interface User { id: string; name: string; role: 'admin' | 'colaborador'; password?: string; initials: string; }

export default function App() {
  // --- STATE ---
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('delva_productos_v5');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('delva_users_v5');
    return saved ? JSON.parse(saved) : [
      { id: 'master', name: 'DELVA PRO', role: 'admin', initials: 'DP', password: 'delva2026' }
    ];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('delva_sesion_v5');
    return saved ? JSON.parse(saved) : null;
  });

  const [globalWaNumber, setGlobalWaNumber] = useState<string>(() => {
    const saved = localStorage.getItem('delva_wa_number_v5');
    return saved ? saved : '51900000000';
  });

  // UI States
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
  useEffect(() => { localStorage.setItem('delva_productos_v5', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('delva_users_v5', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('delva_wa_number_v5', globalWaNumber); }, [globalWaNumber]);
  useEffect(() => {
    if (currentUser) localStorage.setItem('delva_sesion_v5', JSON.stringify(currentUser));
    else localStorage.removeItem('delva_sesion_v5');
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

  // --- LOGIC: WHATSAPP ---
  const getWhatsAppLink = (p: Product) => {
    const targetNumber = p.waNumber && p.waNumber.trim() !== '' ? p.waNumber : globalWaNumber;
    const msg = `¡Hola DELVA! Me interesa este producto: *${p.title}* (S/ ${p.price.toFixed(2)}). ¿Me dan más info?`;
    return `https://wa.me/${targetNumber}?text=${encodeURIComponent(msg)}`;
  };

  const getCartWA = () => {
    const list = cart.map(i => `- ${i.quantity}x ${i.title} (S/ ${i.price})`).join('\n');
    return `https://wa.me/${globalWaNumber}?text=${encodeURIComponent(`¡Hola DELVA! Quiero hacer el siguiente pedido:\n\n${list}\n\n*Total: S/ ${totalCart.toFixed(2)}*`)}`;
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
    if (!data.title || !data.price) return alert('Ponle nombre y precio.');
    const cat = CATEGORIES.find(c => c.id === data.categoryId);
    const productData = {
      ...data, id: data.id || Date.now().toString(), price: Number(data.price), category: cat?.name || 'Varios'
    };

    if (data.id) setProducts(products.map(p => p.id === data.id ? productData : p));
    else setProducts([productData, ...products]);

    setEditingProduct(null);
  };

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter(p => p.categoryId === activeCategory);
  }, [activeCategory, products]);

  // --- RENDER ---
  return (
    <>
      <nav className="navbar">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div className="logo">🌿 DELVA</div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button className="nav-btn" onClick={() => currentUser ? setCurrentUser(null) : setShowLogin(true)} title={currentUser ? "Cerrar Sesión" : "Acceso Staff"}>
              {currentUser ? currentUser.initials : '🔑'}
            </button>
            <button className="nav-btn" onClick={() => setIsCartOpen(true)}>
              🛒 {cart.length > 0 && <span className="badge">{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
            </button>
          </div>
        </div>
      </nav>

      <main style={{ marginTop: '70px' }}>
        {/* DASHBOARD STAFF */}
        {currentUser && (
          <section className="admin-section">
            <div className="container">
              <h2 style={{ fontFamily: 'Playfair Display' }}>⚡ Dashboard: {currentUser.name}</h2>
              <p style={{ opacity: 0.7, textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 800 }}>{currentUser.role}</p>

              <div className="stats-row">
                <div className="stat-box">
                  <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>Productos</p>
                  <div className="stat-val">{products.length}</div>
                </div>
                {currentUser.role === 'admin' && (
                  <div className="stat-box">
                    <p style={{ fontSize: '0.7rem', opacity: 0.7 }}>Equipo</p>
                    <div className="stat-val">{users.length} perfiles</div>
                  </div>
                )}
              </div>

              {/* ADMIN ONLY: SETTINGS & TEAM */}
              {currentUser.role === 'admin' && (
                <>
                  <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>📞 WhatsApp Principal (Tienda / Carrito)</p>
                    <input
                      type="text"
                      value={globalWaNumber}
                      onChange={e => setGlobalWaNumber(e.target.value)}
                      placeholder="Ej: 51900000000"
                      style={{ marginTop: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                    />
                    <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>Cualquier producto sin número asignado usará este, al igual que los pedidos del carrito.</p>
                  </div>

                  <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Usuarios con Acceso</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', overflowX: 'auto' }}>
                      {users.map(u => (
                        <div key={u.id} style={{ padding: '5px 15px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.8rem' }}>
                          {u.name} ({u.role})
                          {u.id !== 'master' && <button onClick={() => setUsers(users.filter(usr => usr.id !== u.id))} style={{ color: 'var(--danger)', marginLeft: '10px', background: 'transparent' }}>✕</button>}
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
                </>
              )}
            </div>
          </section>
        )}

        {/* HERO */}
        {!currentUser && (
          <header className="hero">
            <h1 className="hero-title">La esencia de la selva</h1>
          </header>
        )}

        {/* TIENDA */}
        <div className="container">
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '20px 0', scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '10px 20px', borderRadius: '50px', whiteSpace: 'nowrap', fontWeight: 700,
                  background: activeCategory === cat.id ? 'var(--primary)' : 'white',
                  color: activeCategory === cat.id ? 'white' : 'var(--text-muted)'
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid">
            {filteredProducts.map(p => (
              <div key={p.id} className="card">

                {/* ADMIN CONTROLS PER CARD */}
                {currentUser && (
                  <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 5, zIndex: 10 }}>
                    <button onClick={() => setEditingProduct(p)} style={{ background: 'white', width: 30, height: 30, borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>✏️</button>
                    {(currentUser.role === 'admin') &&
                      <button onClick={() => setProducts(products.filter(item => item.id !== p.id))} style={{ background: 'white', width: 30, height: 30, borderRadius: '50%', color: 'red' }}>🗑️</button>
                    }
                  </div>
                )}

                <div className="card-image-wrapper">
                  <img src={p.image} className="card-image" alt={p.title} />
                </div>
                <div className="card-content">
                  <p style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>{p.category}</p>
                  <h3 className="card-title">{p.title}</h3>
                  <div className="card-price">S/ {p.price.toFixed(2)}</div>
                  <div className="card-buttons">
                    <button className="btn-cart" onClick={() => addToCart(p)}>Añadir a Carrito</button>
                    <a href={getWhatsAppLink(p)} target="_blank" className="btn-wa-direct">Consultar en WhatsApp</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FAB - NUEVO PRODUCTO (Any staff) */}
      {currentUser && (
        <div className="fab" onClick={() => setEditingProduct({ title: '', price: '', categoryId: 'cafe', image: '', waNumber: '' })}>
          +
        </div>
      )}

      {/* LOGIN: SELECT PROFILE + PASSWORD MODAL */}
      <div className={`modal-overlay ${showLogin ? 'open' : ''}`} onClick={() => { setShowLogin(false); setSelectedProfileForLogin(null); }}>
        <div className="modal-card" onClick={e => e.stopPropagation()}>
          {!selectedProfileForLogin ? (
            <>
              <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>¿Quién está ingresando?</h2>
              <div className="profile-grid">
                {users.map(u => (
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
              />
              <button className="btn-cart" style={{ width: '100%', padding: '15px', marginTop: '10px' }} onClick={attemptLogin}>Entrar al Sistema</button>
              <button style={{ marginTop: '20px', opacity: 0.6 }} onClick={() => setSelectedProfileForLogin(null)}>← Atrás</button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDIT/ADD PRODUCT (Upload Photo & Config) */}
      <div className={`modal-overlay ${editingProduct ? 'open' : ''}`} onClick={() => setEditingProduct(null)}>
        {editingProduct && (
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '20px' }}>{editingProduct.id ? 'Editar Anuncio' : 'Nuevo en Market'}</h2>

            <div className="file-input-wrapper" onClick={() => fileInputRef.current?.click()}>
              {editingProduct.image ? (
                <img src={editingProduct.image} style={{ width: '100%', maxHeight: '150px', objectFit: 'contain' }} />
              ) : (
                <>
                  <p style={{ fontSize: '2rem', marginBottom: '10px' }}>📸</p>
                  <p style={{ fontWeight: 600 }}>Toca para tomar foto</p>
                  <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>o subir desde tu celular</p>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
            </div>

            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>¿Qué Producto es?</label>
            <input value={editingProduct.title} onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })} placeholder="Ej: Camisa Lino Selvático" />

            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Precio Total (S/)</label>
            <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} placeholder="0.00" />

            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>¿En qué sección va?</label>
            <select value={editingProduct.categoryId} onChange={e => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}>
              {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <label style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '10px', display: 'block', color: 'var(--wa-green)' }}> WhatsApp (Opcional - Reemplaza Tienda)</label>
            <input value={editingProduct.waNumber || ''} onChange={e => setEditingProduct({ ...editingProduct, waNumber: e.target.value })} placeholder="Ej: 51987654321 (Dejar vacío = Central)" />

            <button className="btn-cart" style={{ width: '100%', padding: 15, marginTop: 10 }} onClick={() => saveProduct(editingProduct)}>
              ¡Publicar al instante!
            </button>
          </div>
        )}
      </div>

      {/* THE PRO CART DRAWER */}
      <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}>
        <div className="cart-drawer" onClick={e => e.stopPropagation()}>
          <div className="cart-header">
            <h2 style={{ fontFamily: 'Playfair Display' }}>Tu Carrito 🛒</h2>
            <button onClick={() => setIsCartOpen(false)} style={{ fontSize: '1.5rem', opacity: 0.5 }}>✕</button>
          </div>

          <div className="cart-body">
            {cart.length === 0 ? <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '50px' }}>No hay productos aún.</p> : null}
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.title} />
                <div className="cart-item-info">
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: '1.2', marginBottom: '5px' }}>{item.title}</div>
                  <div style={{ color: 'var(--accent)', fontWeight: 800 }}>S/ {item.price.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button className="cart-qty-btn" onClick={() => { if (item.quantity === 1) removeCartItem(item.id); else updateCartQty(item.id, -1); }}>-</button>
                  <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                  <button className="cart-qty-btn" onClick={() => updateCartQty(item.id, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-footer">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>
              <span>Total:</span>
              <span style={{ color: 'var(--primary)' }}>S/ {totalCart.toFixed(2)}</span>
            </div>
            <a href={getCartWA()} target="_blank" className="btn-wa-direct" style={{ textAlign: 'center', padding: '15px 0', fontSize: '1rem' }}>
              🌿 Finalizar Pedido Completo
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
