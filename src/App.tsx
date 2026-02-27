import { useState, useEffect, useMemo, useRef } from 'react';
import { products as initialProducts, CATEGORIES, type Product } from './data/products';

// --- TYPES ---
interface CartItem extends Product { quantity: number; selectedColor?: string; }
interface User { id: string; name: string; role: 'admin' | 'colaborador'; password?: string; initials: string; }

export default function App() {
  // --- STATE ---
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('delva_productos_v6_5');
    return saved ? JSON.parse(saved) : initialProducts;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('delva_users_v6_5');
    return saved ? JSON.parse(saved) : [
      { id: 'master', name: 'DELVA PRO', role: 'admin', initials: 'DP', password: 'delva2026' }
    ];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('delva_sesion_v6_5');
    return saved ? JSON.parse(saved) : null;
  });

  const [globalWaNumber, setGlobalWaNumber] = useState<string>(() => {
    const saved = localStorage.getItem('delva_wa_number_v6_5');
    return saved ? saved : '51900000000';
  });

  // UI States
  const [activeCategory, setActiveCategory] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modals
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(''); // For customer choosing a color in detail modal

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedProfileForLogin, setSelectedProfileForLogin] = useState<User | null>(null);
  const [loginPassword, setLoginPassword] = useState('');

  const [newColorInput, setNewColorInput] = useState('#000000'); // Admin adding color

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('delva_productos_v6_5', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('delva_users_v6_5', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('delva_wa_number_v6_5', globalWaNumber); }, [globalWaNumber]);
  useEffect(() => {
    if (currentUser) localStorage.setItem('delva_sesion_v6_5', JSON.stringify(currentUser));
    else localStorage.removeItem('delva_sesion_v6_5');
  }, [currentUser]);

  // --- LOGIC: CART ---
  const addToCart = (product: Product, color?: string) => {
    setCart(prev => {
      // Find exact same product + color combination
      const existing = prev.find(item => item.id === product.id && item.selectedColor === color);
      if (existing) return prev.map(item => (item.id === product.id && item.selectedColor === color) ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1, selectedColor: color }];
    });
    setViewingProduct(null);
    setIsCartOpen(true);
  };

  const updateCartQty = (id: string, color: string | undefined, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.selectedColor === color) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeCartItem = (id: string, color: string | undefined) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.selectedColor === color)));
  };

  const totalCart = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- LOGIC: WHATSAPP ---
  const getWhatsAppLink = (p: Product, color?: string) => {
    const targetNumber = p.waNumber && p.waNumber.trim() !== '' ? p.waNumber : globalWaNumber;
    let msg = `¡Hola DELVA! Me interesa este producto: *${p.title}*`;
    if (color) msg += ` (Color: ${color})`;
    msg += ` - Precio: S/ ${p.price.toFixed(2)}. ¿Me dan más info?`;
    return `https://wa.me/${targetNumber}?text=${encodeURIComponent(msg)}`;
  };

  const getCartWA = () => {
    const list = cart.map(i => {
      let txt = `- ${i.quantity}x ${i.title}`;
      if (i.selectedColor) txt += ` [Color hex: ${i.selectedColor}]`;
      txt += ` (S/ ${i.price})`;
      return txt;
    }).join('\n');
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

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && editingProduct) {
      const newGallery = [...(editingProduct.gallery || [])];
      let loaded = 0;
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newGallery.push(reader.result as string);
          loaded++;
          if (loaded === files.length) {
            setEditingProduct({ ...editingProduct, gallery: newGallery });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAddColor = () => {
    const newColors = [...(editingProduct.colors || []), newColorInput];
    setEditingProduct({ ...editingProduct, colors: newColors });
  };

  const removeColor = (index: number) => {
    const newColors = [...(editingProduct.colors || [])];
    newColors.splice(index, 1);
    setEditingProduct({ ...editingProduct, colors: newColors });
  };

  const removeGalleryImage = (index: number) => {
    const newG = [...editingProduct.gallery];
    newG.splice(index, 1);
    setEditingProduct({ ...editingProduct, gallery: newG });
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
                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>📞 WhatsApp Principal</p>
                    <input
                      type="text"
                      value={globalWaNumber}
                      onChange={e => setGlobalWaNumber(e.target.value)}
                      placeholder="Ej: 51900000000"
                      style={{ marginTop: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                    />
                  </div>

                  <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Cuentas de Acceso</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', overflowX: 'auto' }}>
                      {users.map(u => (
                        <div key={u.id} style={{ padding: '5px 15px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.8rem' }}>
                          {u.name} ({u.role})
                          {u.id !== 'master' && <button onClick={() => setUsers(users.filter(usr => usr.id !== u.id))} style={{ color: 'var(--danger)', marginLeft: '10px', background: 'transparent' }}>✕</button>}
                        </div>
                      ))}
                      <button style={{ color: 'var(--accent)', background: 'transparent', fontWeight: 800 }} onClick={() => {
                        const n = prompt('Nombre colaborador:');
                        const p = prompt('Contraseña:');
                        if (n && p) {
                          setUsers([...users, { id: Date.now().toString(), name: n, role: 'colaborador', initials: n.substring(0, 2).toUpperCase(), password: p }]);
                        }
                      }}>+ Agregar</button>
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
              <div key={p.id} className="card" onClick={() => { setViewingProduct(p); setSelectedColor(''); }}>

                {/* ADMIN CONTROLS PER CARD */}
                {currentUser && (
                  <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 5, zIndex: 10 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setEditingProduct(p)} style={{ background: 'white', width: 30, height: 30, borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>✏️</button>
                    {(currentUser.role === 'admin') &&
                      <button onClick={() => setProducts(products.filter(item => item.id !== p.id))} style={{ background: 'white', width: 30, height: 30, borderRadius: '50%', color: 'red' }}>🗑️</button>
                    }
                  </div>
                )}

                <div className="card-image-wrapper">
                  <img src={p.image} className="card-image" alt={p.title} />
                  {/* Gallery Indicator */}
                  {p.gallery && p.gallery.length > 0 && (
                    <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.7rem', padding: '3px 8px', borderRadius: '15px' }}>
                      +{p.gallery.length} fotos
                    </div>
                  )}
                </div>

                <div className="card-content">
                  <p style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>{p.category}</p>
                  <h3 className="card-title">{p.title}</h3>

                  {/* COLOR DOTS IN GRID */}
                  {p.colors && p.colors.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', margin: '5px 0' }}>
                      {p.colors.map((c, i) => (
                        <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: c, border: '1px solid #ddd' }}></div>
                      ))}
                    </div>
                  )}

                  <div className="card-price" style={{ marginTop: 'auto' }}>S/ {p.price.toFixed(2)}</div>

                  <div style={{ marginTop: '10px' }} onClick={e => e.stopPropagation()}>
                    <button className="btn-wa-direct" onClick={(e) => {
                      e.stopPropagation();
                      window.open(getWhatsAppLink(p), '_blank');
                    }} style={{ width: '100%', marginBottom: 8 }}>Consultar en WhatsApp</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FAB - NUEVO PRODUCTO */}
      {currentUser && (
        <div className="fab" onClick={() => setEditingProduct({ title: '', price: '', categoryId: 'cafe', image: '', waNumber: '', gallery: [], colors: [] })}>
          +
        </div>
      )}

      {/* LOGIN MODAL */}
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

      {/* VIEW PRODUCT DETAIL (CUSTOMER) */}
      <div className={`modal-overlay ${viewingProduct ? 'open' : ''}`} onClick={() => setViewingProduct(null)}>
        {viewingProduct && (
          <div className="modal-card" style={{ padding: '20px', maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingProduct(null)} style={{ position: 'absolute', top: 15, right: 15, fontSize: '1.5rem', zIndex: 10, background: 'rgba(255,255,255,0.8)', width: 35, height: 35, borderRadius: '50%' }}>✕</button>

            {/* Gallery Horizontal Scroll */}
            <div style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: '10px', scrollBehavior: 'smooth' }} className="gallery-scroll">
              <img src={viewingProduct.image} style={{ width: '100%', borderRadius: '15px', scrollSnapAlign: 'start', flexShrink: 0, objectFit: 'cover', aspectRatio: '1/1' }} />
              {viewingProduct.gallery?.map((img, i) => (
                <img key={i} src={img} style={{ width: '100%', borderRadius: '15px', scrollSnapAlign: 'start', flexShrink: 0, objectFit: 'cover', aspectRatio: '1/1' }} />
              ))}
              {(!viewingProduct.gallery || viewingProduct.gallery.length === 0) && <div style={{ display: 'none' }}></div>}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>{viewingProduct.category}</p>
              <h2 style={{ marginBottom: '5px', fontSize: '1.5rem' }}>{viewingProduct.title}</h2>
              <div className="card-price" style={{ fontSize: '1.8rem' }}>S/ {viewingProduct.price.toFixed(2)}</div>

              {/* Select Color */}
              {viewingProduct.colors && viewingProduct.colors.length > 0 && (
                <div style={{ margin: '15px 0', background: '#fafafa', padding: '15px', borderRadius: '12px' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Selecciona un Color</p>
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    {viewingProduct.colors.map((c, i) => (
                      <div key={i}
                        onClick={() => setSelectedColor(c)}
                        style={{
                          width: '35px', height: '35px', borderRadius: '50%', backgroundColor: c,
                          border: selectedColor === c ? '3px solid var(--primary)' : '1px solid #ddd',
                          cursor: 'pointer',
                          boxShadow: selectedColor === c ? '0 0 10px rgba(0,0,0,0.2)' : 'none',
                          transform: selectedColor === c ? 'scale(1.1)' : 'scale(1)',
                          transition: '0.2s'
                        }}>
                      </div>
                    ))}
                  </div>
                  {viewingProduct.colors.length > 0 && !selectedColor && <p style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: '8px' }}>* Debes elegir un color para añadir</p>}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <button
                  className="btn-cart"
                  style={{ padding: '16px', fontSize: '1rem', opacity: (viewingProduct.colors?.length && !selectedColor) ? 0.5 : 1 }}
                  disabled={!!(viewingProduct.colors?.length && !selectedColor)}
                  onClick={() => addToCart(viewingProduct, selectedColor)}
                >
                  Añadir al Carrito
                </button>
                <a href={getWhatsAppLink(viewingProduct, selectedColor)} target="_blank" className="btn-wa-direct" style={{ padding: '16px', fontSize: '1rem' }}>
                  Consultar WhatsApp Directo
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL EDIT/ADD PRODUCT (Upload Photo, Gallery & Config) */}
      <div className={`modal-overlay ${editingProduct ? 'open' : ''}`} onClick={() => setEditingProduct(null)}>
        {editingProduct && (
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '20px' }}>{editingProduct.id ? 'Editar Anuncio' : 'Nuevo en Market'}</h2>

            <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>1. Foto de Portada</p>
            <div className="file-input-wrapper" onClick={() => fileInputRef.current?.click()} style={{ padding: '10px' }}>
              {editingProduct.image ? (
                <img src={editingProduct.image} style={{ width: '100%', maxHeight: '120px', objectFit: 'contain' }} />
              ) : (
                <p style={{ fontWeight: 600 }}><span style={{ fontSize: '1.5rem' }}>📸</span><br />Tomar o Subir</p>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
            </div>

            <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>2. Galería Extra (Opcional)</p>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '5px' }}>
              {editingProduct.gallery?.map((img: string, i: number) => (
                <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={img} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />
                  <button onClick={() => removeGalleryImage(i)} style={{ position: 'absolute', top: -5, right: -5, background: 'var(--danger)', color: 'white', borderRadius: '50%', width: 22, height: 22, fontSize: '0.7rem' }}>X</button>
                </div>
              ))}
              <div onClick={() => galleryInputRef.current?.click()} style={{ width: '60px', height: '60px', flexShrink: 0, borderRadius: '8px', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', cursor: 'pointer', background: '#fafafa' }}>
                +
              </div>
              <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" multiple style={{ display: 'none' }} />
            </div>

            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>3. Colores Disponibles</label>
            <p style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '5px' }}>Selecciona un color y agrégalo a la lista.</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input type="color" value={newColorInput} onChange={e => setNewColorInput(e.target.value)} style={{ width: '50px', padding: '0', height: '40px' }} />
              <button
                onClick={handleAddColor}
                style={{ background: 'var(--primary)', color: 'white', borderRadius: '8px', padding: '0 15px', fontWeight: 600 }}>
                Añadir Color
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {editingProduct.colors?.map((c: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#eee', padding: '5px 10px', borderRadius: '20px' }}>
                  <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: c, border: '1px solid #ccc' }}></div>
                  <span style={{ fontSize: '0.8rem' }}>{c.toUpperCase()}</span>
                  <button onClick={() => removeColor(i)} style={{ background: 'transparent', color: 'var(--danger)', fontSize: '0.8rem' }}>✕</button>
                </div>
              ))}
            </div>

            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Nombre del Producto</label>
            <input value={editingProduct.title} onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })} placeholder="Ej: Camisa Lino" />

            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Precio Total (S/)</label>
            <input type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} placeholder="0.00" />

            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Categoría</label>
            <select value={editingProduct.categoryId} onChange={e => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}>
              {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <label style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '10px', display: 'block', color: 'var(--wa-green)' }}> WhatsApp Reemplazo (Opcional)</label>
            <input value={editingProduct.waNumber || ''} onChange={e => setEditingProduct({ ...editingProduct, waNumber: e.target.value })} placeholder="51987654321" />

            <button className="btn-cart" style={{ width: '100%', padding: 15, marginTop: 10 }} onClick={() => saveProduct(editingProduct)}>
              ¡Publicar Anuncio!
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
              <div key={item.id + '-' + item.selectedColor} className="cart-item">
                <img src={item.image} alt={item.title} />
                <div className="cart-item-info">
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, lineHeight: '1.2', marginBottom: '5px' }}>{item.title}</div>
                  {item.selectedColor && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', fontSize: '0.75rem' }}>
                      Color: <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.selectedColor, border: '1px solid #ccc' }}></div>
                    </div>
                  )}
                  <div style={{ color: 'var(--accent)', fontWeight: 800 }}>S/ {item.price.toFixed(2)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button className="cart-qty-btn" onClick={() => { if (item.quantity === 1) removeCartItem(item.id, item.selectedColor); else updateCartQty(item.id, item.selectedColor, -1); }}>-</button>
                  <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                  <button className="cart-qty-btn" onClick={() => updateCartQty(item.id, item.selectedColor, 1)}>+</button>
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
              🌿 Finalizar Pedido
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
