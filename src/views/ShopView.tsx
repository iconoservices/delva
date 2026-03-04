import { useLocation } from 'react-router-dom';
import React, { useState } from 'react';
import type { Product } from '../data/products';
import { type User, STORE_THEMES, THEME_DEFAULTS } from '../App';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface ShopViewProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    activeCategory: string;
    setActiveCategory: (val: string) => void;
    globalCategories: { id: string, name: string }[];
    products: Product[]; // Total products list
    users: User[]; // Users list to find store owners
    ProductCard: React.ComponentType<{ product: Product }>;
    currentUser: User | null;
    setEditingProduct: (p: any) => void;
    globalSocialLinks: any;
    SOCIAL_ICONS: any;
    compressImage: (file: File) => Promise<string>;
    confirmAction: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
    alertAction: (title: string, message: string) => void;
}

const ShopView: React.FC<ShopViewProps> = ({
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    globalCategories,
    products,
    users,
    ProductCard,
    currentUser,
    setEditingProduct,
    globalSocialLinks,
    SOCIAL_ICONS,
    compressImage,
    alertAction
}) => {
    const loc = useLocation();
    const [isEditingStore, setIsEditingStore] = useState(false);
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newTag, setNewTag] = useState('');
    const query = new URLSearchParams(loc.search);
    const shopId = query.get('u') || currentUser?.id || 'master';
    const isMainAdminId = shopId === 'master' || shopId === 'admin';
    const isGuestView = query.get('viewAsGuest') === 'true';

    // Show loading skeleton if users aren't loaded yet
    if (users.length === 0) {
        return (
            <div className="container" style={{ padding: '100px 20px', textAlign: 'center', background: 'var(--bg)', minHeight: '100vh' }}>
                <div className="skeleton" style={{ width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 20px' }}></div>
                <div className="skeleton" style={{ width: '200px', height: '30px', margin: '0 auto 10px' }}></div>
                <div className="skeleton" style={{ width: '300px', height: '15px', margin: '0 auto 40px' }}></div>
                <div className="grid">
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '240px' }}></div>)}
                </div>
            </div>
        );
    }

    // Find store owner
    const storeOwner = users.find(u => u.id === shopId) ||
        users.find(u => u.id === 'master') ||
        users.find(u => u.id === 'admin');
    const storeName = storeOwner?.storeName || storeOwner?.name || "DELVA OFFICIAL";
    const storeLogo = storeOwner?.storeLogo || storeOwner?.photoURL || null;
    const storeBanner = storeOwner?.storeBanner || null;
    const storeBio = storeOwner?.storeBio || "La esencia pura de la selva amazónica hecha moda y sabor. Bienvenida a nuestra tienda oficial.";

    // Per-store categories and tags (priority: custom > theme defaults > global)
    const activeTheme = STORE_THEMES.find(t => t.id === (storeOwner?.themeId || 'organic-handmade')) || STORE_THEMES[0];
    const isSupermarketTheme = activeTheme.id === 'supermarket';
    const isHomeDecorTheme = activeTheme.id === 'home-decor';
    const isLuxGoldTheme = activeTheme.id === 'lux-gold';
    const isTechNeonTheme = activeTheme.id === 'tech-neon';
    const isFastFoodTheme = activeTheme.id === 'fast-food';

    const themeDefaults = THEME_DEFAULTS[activeTheme.id || ''];
    const disabledCats = storeOwner?.disabledDefaultCategories || [];

    let storeCategories: { id: string; name: string }[];
    if (storeOwner?.storeCategories?.length) {
        storeCategories = [{ id: 'all', name: 'Todo' }, ...storeOwner.storeCategories];
    } else if (themeDefaults) {
        const active = themeDefaults.categories.filter(c => !disabledCats.includes(c.id));
        storeCategories = [{ id: 'all', name: 'Todo' }, ...active];
    } else {
        storeCategories = globalCategories;
    }

    // Tags: custom OR theme defaults
    const storeTags: string[] = storeOwner?.storeTags?.length
        ? storeOwner.storeTags
        : themeDefaults?.tags || [];

    // Helpers
    const saveCats = async (cats: { id: string; name: string }[]) => {
        if (!currentUser) return;
        await setDoc(doc(db, 'users', currentUser.id), { storeCategories: cats }, { merge: true });
    };
    const saveTags = async (tags: string[]) => {
        if (!currentUser) return;
        await setDoc(doc(db, 'users', currentUser.id), { storeTags: tags }, { merge: true });
    };
    const toggleDefaultCat = async (catId: string) => {
        if (!currentUser) return;
        const current = storeOwner?.disabledDefaultCategories || [];
        const updated = current.includes(catId) ? current.filter(c => c !== catId) : [...current, catId];
        await setDoc(doc(db, 'users', currentUser.id), { disabledDefaultCategories: updated }, { merge: true });
    };

    // Filter products for THIS store only
    const storeProducts = products.filter((p: Product) => (p as any).userId === shopId || (isMainAdminId && !(p as any).userId));

    // Final display products (applying category/search filters)
    const displayProducts = storeProducts.filter((p: Product) => {
        const matchesCat = activeCategory === 'all' || p.categoryId === activeCategory;
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCat && matchesSearch;
    });

    const renderThemeSelector = () => {
        if (currentUser?.id !== storeOwner?.id || isGuestView) return null;
        return (
            <div style={{ position: 'fixed', right: '0', top: '0', height: '100vh', zIndex: 9999, display: 'flex', alignItems: 'center', pointerEvents: isThemeMenuOpen ? 'auto' : 'none' }}>
                <button
                    onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                    style={{
                        background: 'rgba(0,0,0,0.85)', color: 'white', border: 'none', padding: '15px 8px', borderRadius: '15px 0 0 15px', cursor: 'pointer', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center', boxShadow: '-2px 0 20px rgba(0,0,0,0.2)', transition: '0.3s', marginRight: isThemeMenuOpen ? '-1px' : '0'
                    }}
                >
                    <span style={{ fontSize: '1rem', rotate: isThemeMenuOpen ? '180deg' : '0deg', transition: '0.4s' }}>◀</span>
                    <span style={{ writingMode: 'vertical-rl', fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>{isThemeMenuOpen ? 'Cerrar' : 'Estilos'}</span>
                </button>
                {isThemeMenuOpen && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.75)',
                        backdropFilter: 'blur(15px)',
                        WebkitBackdropFilter: 'blur(15px)',
                        width: window.innerWidth < 600 ? '160px' : '190px',
                        height: '100vh',
                        boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
                        padding: '40px 12px 20px',
                        overflowY: 'auto',
                        borderLeft: '1px solid rgba(255,255,255,0.3)',
                        pointerEvents: 'auto'
                    }}>
                        <h3 style={{ fontSize: '0.7rem', fontWeight: 900, marginBottom: '20px', color: '#000', letterSpacing: '1.5px', textAlign: 'center', opacity: 0.6 }}>PERSONALIZAR LOOK</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                            {STORE_THEMES.map(theme => {
                                const isSel = activeTheme?.id === theme.id;
                                return (
                                    <div
                                        key={theme.id}
                                        onClick={async () => {
                                            await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, themeId: theme.id }, { merge: true });
                                        }}
                                        style={{
                                            cursor: 'pointer', borderRadius: '10px', overflow: 'hidden',
                                            border: isSel ? `2px solid ${theme.primary}` : '2px solid rgba(0,0,0,0.05)',
                                            boxShadow: isSel ? `0 4px 12px ${theme.primary}33` : 'none',
                                            transition: '0.2s',
                                            background: isSel ? 'white' : 'rgba(255,255,255,0.4)',
                                            transform: isSel ? 'scale(1.02)' : 'scale(1)'
                                        }}
                                    >
                                        <div style={{ padding: '8px 5px', color: isSel ? theme.primary : '#555', fontSize: '0.6rem', fontWeight: 900, textAlign: 'center', lineHeight: 1.2 }}>
                                            {theme.name.split(' ').slice(1).join(' ')}
                                        </div>
                                        <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8 }}>
                                            <div style={{ display: 'flex', gap: '3px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.primary }}></div>
                                                <div style={{ width: '16px', height: '4px', borderRadius: '2px', background: theme.primary, marginTop: '2px' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ─── LUX GOLD LAYOUT ────────────────────────────────────────────────────────
    if (isLuxGoldTheme) {
        const GOLD = '#8a6d3b';
        return (
            <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', paddingBottom: '100px', fontFamily: "'Prata', serif" }}>
                <div style={{ textAlign: 'center', padding: '60px 20px 40px', borderBottom: `1px solid ${GOLD}44` }}>
                    {storeLogo ? (
                        <img src={storeLogo} style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '20px', border: `1px solid ${GOLD}` }} alt="Logo" />
                    ) : (
                        <div style={{ fontSize: '3rem', color: GOLD, fontWeight: '100', marginBottom: '10px' }}>✧</div>
                    )}
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '400', letterSpacing: '4px', textTransform: 'uppercase', color: GOLD, margin: '0 0 10px' }}>{storeName}</h1>
                    <p style={{ opacity: 0.7, fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto', fontStyle: 'italic' }}>{storeBio}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', padding: '20px', position: 'sticky', top: 60, background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(5px)', zIndex: 10 }}>
                    {storeCategories.map(cat => {
                        const isSel = activeCategory === cat.id;
                        const name = cat.id === 'all' ? 'Colección' : cat.name;
                        return (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ background: 'none', border: 'none', borderBottom: isSel ? `1px solid ${GOLD}` : '1px solid transparent', color: isSel ? GOLD : 'white', cursor: 'pointer', padding: '5px 10px', fontSize: '0.8rem', letterSpacing: '2px', textTransform: 'uppercase', transition: '0.3s' }}>
                                {name}
                            </button>
                        );
                    })}
                </div>

                <div className="grid" style={{ padding: '40px 20px' }}>
                    {displayProducts.map(p => (
                        <div key={p.id} style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <div style={{ position: 'relative', overflow: 'hidden', paddingBottom: '125%', marginBottom: '15px', border: `1px solid ${GOLD}22` }}>
                                <img src={p.image} alt={p.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
                            </div>
                            <h3 style={{ fontSize: '1rem', fontWeight: '400', color: GOLD, marginBottom: '5px' }}>{p.title}</h3>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>S/ {typeof p.price === 'number' ? p.price.toFixed(2) : p.price}</p>
                        </div>
                    ))}
                </div>

                {currentUser?.id === storeOwner?.id && !isGuestView && (
                    <button onClick={() => setIsEditingStore(!isEditingStore)} style={{ position: 'fixed', bottom: '110px', right: '20px', background: GOLD, color: 'black', border: 'none', padding: '10px 20px', borderRadius: '0', fontWeight: 'bold', fontSize: '0.7rem', letterSpacing: '2px', cursor: 'pointer', zIndex: 100 }}>
                        {isEditingStore ? 'CERRAR PANEL' : 'EDITAR TIENDA'}
                    </button>
                )}
                {isEditingStore && currentUser?.id === storeOwner?.id && (
                    <div style={{ position: 'fixed', bottom: '150px', right: '20px', width: '320px', background: '#111', border: `1px solid ${GOLD}`, padding: '25px', zIndex: 100, boxShadow: `0 0 30px ${GOLD}33` }}>
                        <h3 style={{ fontSize: '0.9rem', color: GOLD, letterSpacing: '2px', marginBottom: '20px', textAlign: 'center' }}>BOUTIQUE AJUSTES</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                                <div onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async (e: any) => { if (e.target.files[0]) { const c = await compressImage(e.target.files[0]); await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeLogo: c }, { merge: true }); } }; i.click(); }} style={{ width: '60px', height: '60px', borderRadius: '50%', border: `1px solid ${GOLD}`, background: '#000', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {storeLogo ? <img src={storeLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: GOLD, fontSize: '0.6rem' }}>LOGO</span>}
                                </div>
                            </div>
                            <input type="text" defaultValue={storeName} onBlur={async (e) => { const v = e.target.value.trim(); if (v) await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeName: v }, { merge: true }); }} placeholder="Nombre Boutique" style={{ background: 'none', border: 'none', borderBottom: `1px solid ${GOLD}44`, color: GOLD, padding: '8px', fontSize: '0.9rem', outline: 'none', textAlign: 'center' }} />
                            <textarea defaultValue={storeBio} onBlur={async (e) => { await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeBio: e.target.value.trim() }, { merge: true }); }} placeholder="Bio Colección..." style={{ background: 'none', border: `1px solid ${GOLD}22`, color: 'white', padding: '10px', fontSize: '0.8rem', outline: 'none', resize: 'none', height: '60px' }} />


                            {/* CATEGORIES MANAGER (LUX GOLD) */}
                            <div style={{ padding: '15px', border: `1px solid ${GOLD}44`, background: '#0a0a0a' }}>
                                <p style={{ fontSize: '0.6rem', color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Colecciones Propias</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                                    {(storeOwner?.storeCategories || []).map((cat, i) => (
                                        <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${GOLD}`, color: GOLD, padding: '4px 10px', fontSize: '0.65rem' }}>
                                            <span>{cat.name}</span>
                                            <button onClick={async () => { const updated = (storeOwner?.storeCategories || []).filter((_, j) => j !== i); await saveCats(updated); }} style={{ background: 'none', border: 'none', color: GOLD, cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Nombre Colección..." style={{ background: 'none', border: `1px solid ${GOLD}22`, color: 'white', padding: '6px', fontSize: '0.7rem', flex: 1, outline: 'none' }} />
                                    <button onClick={async () => { if (newCatName.trim()) { const id = newCatName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); const updated = [...(storeOwner?.storeCategories || []), { id, name: newCatName.trim() }]; await saveCats(updated); setNewCatName(''); } }} style={{ background: GOLD, color: 'black', border: 'none', padding: '6px 14px', fontSize: '0.65rem', fontWeight: 'bold' }}>+</button>
                                </div>
                            </div>

                            {/* THEME DEFAULTS (LUX GOLD) */}
                            {themeDefaults && (
                                <div style={{ padding: '15px', border: `1px solid ${GOLD}44`, background: '#0a0a0a' }}>
                                    <p style={{ fontSize: '0.6rem', color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>👁️ Visibilidad de Sugerencias</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {themeDefaults.categories.map(cat => {
                                            const isHidden = disabledCats.includes(cat.id);
                                            return (
                                                <button key={cat.id} onClick={() => toggleDefaultCat(cat.id)} style={{ padding: '6px 12px', border: `1px solid ${GOLD}`, background: isHidden ? 'none' : GOLD, color: isHidden ? GOLD : 'black', fontSize: '0.6rem', cursor: 'pointer' }}>
                                                    {isHidden ? '✧ ' : '✨ '}{cat.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* TAGS (LUX GOLD) */}
                            <div style={{ padding: '15px', border: `1px solid ${GOLD}44`, background: '#0a0a0a' }}>
                                <p style={{ fontSize: '0.6rem', color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Palabras Clave</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                                    {storeTags.map((t, i) => (
                                        <div key={i} style={{ border: `1px solid ${GOLD}44`, color: 'white', padding: '4px 10px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span>#{t}</span>
                                            <button onClick={async () => { const updated = storeTags.filter((_, j) => j !== i); await saveTags(updated); }} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Añadir etiqueta..." style={{ background: 'none', border: `1px solid ${GOLD}22`, color: 'white', padding: '6px', fontSize: '0.7rem', flex: 1, outline: 'none' }} />
                                    <button onClick={async () => { if (newTag.trim()) { const updated = [...storeTags, newTag.trim().toLowerCase()]; await saveTags(updated); setNewTag(''); } }} style={{ background: GOLD, color: 'black', border: 'none', padding: '6px 14px', fontSize: '0.65rem', fontWeight: 'bold' }}>+</button>
                                </div>
                            </div>

                            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/tienda?u=${currentUser!.id}`); alertAction('Link Copiado', '¡Link de tu tienda copiado! ✨'); }} style={{ background: GOLD, color: 'black', border: 'none', padding: '12px', fontWeight: 'bold', fontSize: '0.7rem', letterSpacing: '1px', cursor: 'pointer' }}>COPIAR LINK DE TIENDA</button>
                        </div>
                    </div>
                )}
                {renderThemeSelector()}
            </div>
        );
    }

    // ─── TECH NEON LAYOUT ───────────────────────────────────────────────────────
    if (isTechNeonTheme) {
        const NEON = '#00ffcc';
        const DARK = '#050a10';
        const SURF = '#0d1621';

        return (
            <div style={{ minHeight: '100vh', background: DARK, color: 'white', paddingBottom: '100px', fontFamily: "'Orbitron', sans-serif" }}>
                <div style={{ padding: '40px 20px', textAlign: 'center', borderBottom: `2px solid ${NEON}`, boxShadow: `0 0 20px ${NEON}22`, background: SURF }}>
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                        <div style={{ width: '90px', height: '90px', borderRadius: '12px', border: `2px solid ${NEON}`, boxShadow: `0 0 15px ${NEON}`, overflow: 'hidden' }}>
                            {storeLogo ? <img src={storeLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2rem' }}>🎮</span>}
                        </div>
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '900', color: NEON, textShadow: `0 0 10px ${NEON}`, margin: '0 0 10px', textTransform: 'uppercase' }}>{storeName}</h1>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', maxWidth: '500px', margin: '0 auto' }}>{storeBio}</p>
                </div>

                <div style={{ display: 'flex', gap: '10px', padding: '20px', overflowX: 'auto', background: DARK, position: 'sticky', top: 60, zIndex: 10 }}>
                    {storeCategories.map(cat => {
                        const isSel = activeCategory === cat.id;
                        const name = cat.id === 'all' ? 'HOME' : cat.name.toUpperCase();
                        return (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ background: isSel ? NEON : SURF, border: `1px solid ${NEON}`, color: isSel ? 'black' : NEON, padding: '8px 20px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '900', cursor: 'pointer', transition: '0.3s', boxShadow: isSel ? `0 0 10px ${NEON}` : 'none' }}>
                                {name}
                            </button>
                        );
                    })}
                </div>

                <div className="grid" style={{ padding: '30px 20px' }}>
                    {displayProducts.map(p => (
                        <div key={p.id} style={{ background: SURF, border: `1px solid ${NEON}44`, borderRadius: '12px', overflow: 'hidden', transition: '0.3s', position: 'relative' }}>
                            <div style={{ height: '180px', background: '#000', borderBottom: `1px solid ${NEON}22` }}>
                                <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                            </div>
                            <div style={{ padding: '15px' }}>
                                <h3 style={{ fontSize: '0.9rem', color: NEON, marginBottom: '8px' }}>{p.title}</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '900', color: 'white' }}>S/ {p.price}</span>
                                    <button style={{ background: NEON, color: 'black', border: 'none', padding: '6px 15px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '900' }}>BUY NOW</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {currentUser?.id === storeOwner?.id && !isGuestView && (
                    <button onClick={() => setIsEditingStore(!isEditingStore)} style={{ position: 'fixed', bottom: '110px', left: '20px', background: NEON, color: 'black', border: 'none', padding: '12px 25px', borderRadius: '8px', fontWeight: '900', fontSize: '0.7rem', boxShadow: `0 0 15px ${NEON}`, cursor: 'pointer', zIndex: 100 }}>
                        {isEditingStore ? 'EXIT_SYS' : 'EDIT_MODE'}
                    </button>
                )}
                {isEditingStore && currentUser?.id === storeOwner?.id && (
                    <div style={{ position: 'fixed', bottom: '160px', left: '20px', width: '320px', background: SURF, border: `2px solid ${NEON}`, borderRadius: '12px', padding: '25px', zIndex: 100, boxShadow: `0 0 30px ${NEON}33` }}>
                        <h2 style={{ color: NEON, fontSize: '1rem', marginBottom: '20px' }}>SYSTEM SETTINGS</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input type="text" defaultValue={storeName} onBlur={async (e) => { const v = e.target.value.trim(); if (v) await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeName: v }, { merge: true }); }} style={{ background: DARK, border: `1px solid ${NEON}`, color: NEON, padding: '10px', outline: 'none' }} />
                            <textarea defaultValue={storeBio} onBlur={async (e) => { await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeBio: e.target.value.trim() }, { merge: true }); }} style={{ background: DARK, border: `1px solid ${NEON}`, color: 'white', padding: '10px', outline: 'none', resize: 'none', height: '60px' }} />

                        </div>
                    </div>
                )}
                {renderThemeSelector()}
            </div>
        );
    }

    // ─── HOME DECOR LAYOUT ───────────────────────────────────────────────────────
    if (isHomeDecorTheme) {
        const N = '#1b3a5c';     // navy primary
        const NLight = '#e8eef5';
        const NAcc = '#c9a84c';  // golden accent

        return (
            <div style={{ minHeight: '100vh', background: '#f9f9f7', paddingBottom: '100px', fontFamily: 'Inter, sans-serif' }}>
                {/* TOP NAVY NAV BAR */}
                <div style={{ background: N, color: 'white', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '20px', position: 'sticky', top: 60, zIndex: 50, boxShadow: '0 2px 10px rgba(27,58,92,0.4)', height: '52px' }}>
                    {/* Hamburger + Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <span style={{ fontSize: '1.2rem', cursor: 'pointer', opacity: 0.8 }}>☰</span>
                        {storeLogo
                            ? <img src={storeLogo} style={{ height: '28px', objectFit: 'contain' }} alt={storeName} />
                            : <span style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{storeName}</span>
                        }
                    </div>
                    {/* Nav categories */}
                    <div className="gallery-scroll" style={{ display: 'flex', gap: '0', flex: 2, justifyContent: 'center', overflowX: 'auto' }}>
                        {storeCategories.map(cat => (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ padding: '0 16px', height: '52px', background: 'none', border: 'none', borderBottom: activeCategory === cat.id ? `3px solid ${NAcc}` : '3px solid transparent', color: activeCategory === cat.id ? NAcc : 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap', cursor: 'pointer', letterSpacing: '0.5px' }}>
                                {cat.id === 'all' ? 'Todo' : cat.name}
                            </button>
                        ))}
                    </div>
                    {/* Search + cart icons */}
                    <div style={{ display: 'flex', gap: '16px', fontSize: '1.1rem', opacity: 0.85 }}>
                        <span style={{ cursor: 'pointer' }}>🔍</span>
                        <span style={{ cursor: 'pointer' }}>🛒</span>
                    </div>
                </div>

                {/* HERO BANNER */}
                <div style={{ position: 'relative', height: '260px', overflow: 'hidden' }}>
                    <img
                        src={storeBanner || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt="Hero"
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(27,58,92,0.85) 0%, transparent 65%)', display: 'flex', alignItems: 'center', padding: '0 30px' }}>
                        <div>
                            <p style={{ color: NAcc, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 8px' }}>DISEÑO & CONFORT</p>
                            <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, margin: '0 0 6px', lineHeight: 1.1, textTransform: 'uppercase', maxWidth: '250px' }}>
                                ESPACIOS<br />QUE INSPIRAN
                            </h1>
                            <div style={{ background: 'white', color: N, padding: '10px 22px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-block', cursor: 'pointer', marginTop: '10px', letterSpacing: '1px' }}>
                                COMPRAR EL LOOK
                            </div>
                        </div>
                    </div>
                    {/* Slide dots */}
                    <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
                        {[0, 1, 2, 3].map(i => <div key={i} style={{ width: i === 0 ? '18px' : '6px', height: '6px', borderRadius: '3px', background: i === 0 ? NAcc : 'rgba(255,255,255,0.5)' }}></div>)}
                    </div>
                </div>

                {/* OWNER PANEL BAR */}
                {currentUser?.id === storeOwner?.id && !isGuestView && (
                    <div style={{ padding: '8px 20px', background: '#fff8e1', borderBottom: '2px solid #f9a825', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e65100' }}>⚙️ Panel Propietario</span>
                        <button onClick={() => setIsEditingStore(!isEditingStore)} style={{ background: '#f9a825', color: 'white', border: 'none', padding: '5px 14px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
                            {isEditingStore ? 'Cerrar' : 'Personalizar'}
                        </button>
                    </div>
                )}

                {/* OWNER EDIT PANEL */}
                {isEditingStore && currentUser?.id === storeOwner?.id && !isGuestView && (
                    <div style={{ margin: '16px 20px', padding: '20px', background: 'white', border: `2px solid ${N}`, borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: N, marginBottom: '16px' }}>🎨 Personalización de Tienda</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {/* Logo/Banner */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {[{ key: 'storeLogo', label: 'Logo', preview: storeLogo, shape: 'circle' }, { key: 'storeBanner', label: 'Banner Hero', preview: storeBanner, shape: 'rect' }].map(({ key, label, preview, shape }) => (
                                    <div key={key} style={{ background: NLight, padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: shape === 'circle' ? '48px' : '80px', height: '48px', borderRadius: shape === 'circle' ? '50%' : '6px', background: N, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>
                                            {preview ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (shape === 'circle' ? '🏠' : '🖼️')}
                                        </div>
                                        <p style={{ fontSize: '0.62rem', fontWeight: 700, margin: 0 }}>{label}</p>
                                        <button onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async (e: any) => { if (e.target.files[0]) { const c = await compressImage(e.target.files[0]); await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, [key]: c }, { merge: true }); } }; i.click(); }} style={{ background: N, color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer' }}>Subir</button>
                                    </div>
                                ))}
                            </div>
                            <input type="text" defaultValue={storeName} onBlur={async (e) => { const v = e.target.value.trim(); if (v) await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeName: v }, { merge: true }); }} placeholder="Nombre de la marca" style={{ padding: '10px 14px', borderRadius: '4px', border: `1.5px solid ${N}`, outline: 'none', fontSize: '0.88rem', fontWeight: 700 }} />
                            <textarea defaultValue={storeBio} onBlur={async (e) => { await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeBio: e.target.value.trim() }, { merge: true }); }} placeholder="Descripción..." style={{ padding: '10px 14px', borderRadius: '4px', border: `1.5px solid ${N}`, outline: 'none', fontSize: '0.85rem', resize: 'none', height: '70px' }} />

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => window.open(`${window.location.origin}/tienda?u=${currentUser!.id}&viewAsGuest=true`, '_blank')} style={{ flex: 1, padding: '10px', background: NLight, color: N, border: `1.5px solid ${N}`, borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>👀 Ver como cliente</button>
                                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/tienda?u=${currentUser!.id}`); alert('¡Link copiado! 🏠'); }} style={{ flex: 1, padding: '10px', background: N, color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>🔗 Copiar Link</button>
                            </div>

                            {/* CATEGORIES MANAGER (HOME DECOR) */}
                            <div style={{ background: NLight, borderRadius: '8px', padding: '15px' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: N, marginBottom: '10px' }}>🏷️ Mis Categorías</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                    {(storeOwner?.storeCategories || []).map((cat, i) => (
                                        <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: N, color: 'white', borderRadius: '4px', padding: '4px 10px', fontSize: '0.65rem', fontWeight: 700 }}>
                                            <span>{cat.name}</span>
                                            <button onClick={async () => { const updated = (storeOwner?.storeCategories || []).filter((_, j) => j !== i); await saveCats(updated); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>✕</button>
                                        </div>
                                    ))}
                                    {!(storeOwner?.storeCategories?.length) && <p style={{ fontSize: '0.62rem', opacity: 0.6, margin: 0 }}>Sin categorías propias</p>}
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Añadir categoría..." onKeyDown={async (e) => { if (e.key === 'Enter' && newCatName.trim()) { const id = newCatName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); const updated = [...(storeOwner?.storeCategories || []), { id, name: newCatName.trim() }]; await saveCats(updated); setNewCatName(''); } }} style={{ flex: 1, padding: '8px 10px', borderRadius: '4px', border: `1.5px solid ${N}`, outline: 'none', fontSize: '0.75rem' }} />
                                    <button onClick={async () => { if (newCatName.trim()) { const id = newCatName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); const updated = [...(storeOwner?.storeCategories || []), { id, name: newCatName.trim() }]; await saveCats(updated); setNewCatName(''); } }} style={{ background: N, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>+</button>
                                </div>
                            </div>

                            {/* THEME DEFAULTS (HOME DECOR) */}
                            {themeDefaults && (
                                <div style={{ background: NLight, borderRadius: '8px', padding: '15px' }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: N, marginBottom: '10px' }}>👁️ Categorías del Diseño</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {themeDefaults.categories.map(cat => {
                                            const isHidden = disabledCats.includes(cat.id);
                                            return (
                                                <button key={cat.id} onClick={() => toggleDefaultCat(cat.id)} style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700, background: isHidden ? 'white' : N, color: isHidden ? N : 'white', border: `1px solid ${N}`, cursor: 'pointer', transition: '0.2s' }}>
                                                    {isHidden ? 'Oculto: ' : 'Visible: '}{cat.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* TAGS (HOME DECOR) */}
                            <div style={{ background: NLight, borderRadius: '8px', padding: '15px' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: N, marginBottom: '10px' }}>🔖 Mis Etiquetas</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                    {storeTags.map((tag, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'white', border: `1px solid ${N}44`, color: N, borderRadius: '4px', padding: '4px 10px', fontSize: '0.65rem', fontWeight: 700 }}>
                                            <span>#{tag}</span>
                                            <button onClick={async () => { const updated = storeTags.filter((_, j) => j !== i); await saveTags(updated); }} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Nueva etiqueta..." onKeyDown={async (e) => { if (e.key === 'Enter' && newTag.trim()) { const updated = [...storeTags, newTag.trim().toLowerCase()]; await saveTags(updated); setNewTag(''); } }} style={{ flex: 1, padding: '8px 10px', borderRadius: '4px', border: `1.5px solid ${N}`, outline: 'none', fontSize: '0.75rem' }} />
                                    <button onClick={async () => { if (newTag.trim()) { const updated = [...storeTags, newTag.trim().toLowerCase()]; await saveTags(updated); setNewTag(''); } }} style={{ background: N, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SEARCH BAR */}
                <div style={{ padding: '16px 20px 8px', background: 'white', position: 'sticky', top: 112, zIndex: 40, borderBottom: '1px solid #e8e8e8' }}>
                    <div style={{ position: 'relative' }}>
                        <input type="text" placeholder="Buscar muebles, decoración..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '11px 44px 11px 16px', borderRadius: '4px', border: '1.5px solid #ddd', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }} />
                        <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: N, fontSize: '0.9rem' }}>🔍</span>
                    </div>
                </div>

                {/* PRODUCT GRID */}
                <div style={{ padding: '20px 20px 0' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                        {activeCategory === 'all' ? 'Todos los productos' : globalCategories.find(c => c.id === activeCategory)?.name} · {displayProducts.length} artículos
                    </p>
                    {displayProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#bbb' }}>
                            <p style={{ fontSize: '3rem' }}>🛋️</p>
                            <p style={{ fontWeight: 700 }}>Sin productos en esta categoría.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '16px' }}>
                            {displayProducts.map(p => (
                                <div key={p.id} style={{ background: 'white', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', border: '1px solid #eee', display: 'flex', flexDirection: 'column', transition: '0.2s' }}>
                                    <div style={{ height: '150px', overflow: 'hidden', background: '#f7f7f5' }}>
                                        <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: '0.3s' }} onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=60'; }} />
                                    </div>
                                    <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <p style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0, color: '#222', lineHeight: 1.3, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</p>
                                        <p style={{ fontSize: '0.78rem', color: '#888', margin: 0, fontWeight: 500 }}>S/ {typeof p.price === 'number' ? p.price.toFixed(2) : p.price}</p>
                                        <button style={{ marginTop: '8px', background: N, color: 'white', border: 'none', padding: '9px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', letterSpacing: '0.5px' }}>
                                            VER DETALLES
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* AMBIENTES SECTION */}
                {displayProducts.length > 0 && (
                    <div style={{ padding: '30px 20px 0' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#222', marginBottom: '16px', letterSpacing: '-0.3px' }}>Nuestros Ambientes</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {[
                                { label: 'Sala', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=60' },
                                { label: 'Comedor', url: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=400&q=60' },
                                { label: 'Dormitorio', url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400&q=60' },
                                { label: 'Terraza', url: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400&q=60' },
                            ].map(({ label, url }) => (
                                <div key={label} style={{ position: 'relative', height: '100px', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer' }}>
                                    <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={label} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(27,58,92,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem', textShadow: '0 1px 4px rgba(0,0,0,0.5)', letterSpacing: '0.5px' }}>{label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {renderThemeSelector()}
            </div>
        );
    }
    // ─── END HOME DECOR LAYOUT ───────────────────────────────────────────────────

    // ─── SUPERMARKET LAYOUT ─────────────────────────────────────────────────────
    if (isSupermarketTheme) {
        const G = '#00a651'; // supermarket green
        const GLight = '#e8f5e9';
        const GDark = '#007a3d';

        return (
            <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '100px', fontFamily: 'Inter, sans-serif' }}>
                {/* TOP GREEN HEADER */}
                <div style={{ background: G, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 60, zIndex: 50, boxShadow: '0 2px 8px rgba(0,166,81,0.3)' }}>
                    {/* Logo circle */}
                    <div style={{ width: '36px', height: '36px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {storeLogo ? <img src={storeLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 900, fontSize: '1rem', color: G }}>G</span>}
                    </div>
                    {/* Search bar */}
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input
                            type="text"
                            placeholder={`Buscar en ${storeName}...`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '10px 40px 10px 16px', borderRadius: '8px', border: 'none', fontSize: '0.9rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: G, fontWeight: 700 }}>🔍</span>
                    </div>
                </div>

                {/* STORE TITLE BANNER */}
                <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                    <img
                        src={storeBanner || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt="Banner tienda"
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
                        <div>
                            <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 900, margin: '0 0 4px', textTransform: 'uppercase', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{storeName}</h1>
                            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', margin: 0, maxWidth: '280px' }}>{storeBio}</p>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <span style={{ background: G, color: 'white', padding: '3px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700 }}>⭐ 5.0</span>
                                <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '3px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700 }}>{storeProducts.length} productos</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* EDIT PANEL TOGGLE */}
                {currentUser?.id === storeOwner?.id && !isGuestView && (
                    <div style={{ padding: '8px 16px', background: '#fff3e0', borderBottom: '2px solid #ff9800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e65100' }}>⚙️ Panel del dueño</span>
                        <button onClick={() => setIsEditingStore(!isEditingStore)} style={{ background: '#ff9800', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
                            {isEditingStore ? 'Cerrar' : 'Personalizar Tienda'}
                        </button>
                    </div>
                )}

                {/* EDIT PANEL */}
                {isEditingStore && currentUser?.id === storeOwner?.id && !isGuestView && (
                    <div style={{ margin: '0 16px 16px', padding: '20px', background: 'white', borderRadius: '12px', border: `2px solid ${G}`, marginTop: '12px' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: G, marginBottom: '16px' }}>🎨 Ajustes de tu Tienda</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Logo & Banner Uploads */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div style={{ background: GLight, padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: G, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>{storeLogo ? <img src={storeLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏬'}</div>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 700, margin: 0, textAlign: 'center' }}>Logo de la Tienda</p>
                                    <button onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async (e: any) => { if (e.target.files[0]) { const c = await compressImage(e.target.files[0]); await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeLogo: c }, { merge: true }); } }; i.click(); }} style={{ background: G, color: 'white', border: 'none', padding: '4px 10px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer' }}>Subir</button>
                                </div>
                                <div style={{ background: GLight, padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                    <div style={{ width: '80px', height: '50px', borderRadius: '8px', background: G, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>{storeBanner ? <img src={storeBanner} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🖼️'}</div>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 700, margin: 0, textAlign: 'center' }}>Banner Portada</p>
                                    <button onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async (e: any) => { if (e.target.files[0]) { const c = await compressImage(e.target.files[0]); await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeBanner: c }, { merge: true }); } }; i.click(); }} style={{ background: G, color: 'white', border: 'none', padding: '4px 10px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer' }}>Subir</button>
                                </div>
                            </div>
                            {/* Store Name */}
                            <input type="text" defaultValue={storeName} onBlur={async (e) => { const v = e.target.value.trim(); if (v) await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeName: v }, { merge: true }); }} placeholder="Nombre de tu tienda" style={{ padding: '10px 14px', borderRadius: '8px', border: `1.5px solid ${G}`, outline: 'none', fontSize: '0.9rem', fontWeight: 700 }} />
                            {/* Bio */}
                            <textarea defaultValue={storeBio} onBlur={async (e) => { await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeBio: e.target.value.trim() }, { merge: true }); }} placeholder="Descripción de tu tienda..." style={{ padding: '10px 14px', borderRadius: '8px', border: `1.5px solid ${G}`, outline: 'none', fontSize: '0.85rem', resize: 'none', height: '70px' }} />

                            {/* CATEGORIES MANAGER */}
                            <div style={{ background: GLight, borderRadius: '10px', padding: '12px' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: GDark, marginBottom: '10px' }}>🏷️ Categorías de mi Tienda</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                    {(storeOwner?.storeCategories || []).map((cat, i) => (
                                        <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: G, color: 'white', borderRadius: '20px', padding: '4px 10px', fontSize: '0.7rem', fontWeight: 700 }}>
                                            <span>{cat.name}</span>
                                            <button onClick={async () => { const updated = (storeOwner?.storeCategories || []).filter((_, j) => j !== i); await saveCats(updated); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '0.8rem', padding: '0 2px', lineHeight: 1 }}>✕</button>
                                        </div>
                                    ))}
                                    {!(storeOwner?.storeCategories?.length) && <p style={{ fontSize: '0.65rem', opacity: 0.6, margin: 0 }}>Sin categorías personalizadas aún</p>}
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Ej: Frutas, Bebidas..." onKeyDown={async (e) => { if (e.key === 'Enter' && newCatName.trim()) { const id = newCatName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); const updated = [...(storeOwner?.storeCategories || []), { id, name: newCatName.trim() }]; await saveCats(updated); setNewCatName(''); } }} style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: `1.5px solid ${G}`, outline: 'none', fontSize: '0.78rem' }} />
                                    <button onClick={async () => { if (newCatName.trim()) { const id = newCatName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); const updated = [...(storeOwner?.storeCategories || []), { id, name: newCatName.trim() }]; await saveCats(updated); setNewCatName(''); } }} style={{ background: G, color: 'white', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>+ Añadir</button>
                                </div>
                            </div>

                            {/* DEFAULT CATEGORIES TOGGLE (SUPERMARKET) */}
                            {themeDefaults && (
                                <div style={{ background: GLight, borderRadius: '10px', padding: '12px' }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: GDark, marginBottom: '8px' }}>👁️ Mostrar Categorías Sugeridas</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {themeDefaults.categories.map(cat => {
                                            const isHidden = disabledCats.includes(cat.id);
                                            return (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => toggleDefaultCat(cat.id)}
                                                    style={{
                                                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700,
                                                        background: isHidden ? 'white' : G,
                                                        color: isHidden ? '#888' : 'white',
                                                        border: `1px solid ${isHidden ? '#ddd' : G}`,
                                                        cursor: 'pointer', transition: '0.2s'
                                                    }}
                                                >
                                                    {isHidden ? '🕶️ ' : '✅ '}{cat.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p style={{ fontSize: '0.55rem', opacity: 0.6, marginTop: '5px' }}>Toca para ocultar o mostrar las categorías que vienen con el diseño.</p>
                                </div>
                            )}

                            {/* TAGS MANAGER */}
                            <div style={{ background: GLight, borderRadius: '10px', padding: '12px' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: GDark, marginBottom: '10px' }}>🔖 Etiquetas de mis Productos</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                    {storeTags.map((tag, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: GDark, color: 'white', borderRadius: '20px', padding: '4px 10px', fontSize: '0.7rem', fontWeight: 700 }}>
                                            <span>#{tag}</span>
                                            <button onClick={async () => { const updated = storeTags.filter((_, j) => j !== i); await saveTags(updated); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '0.8rem', padding: '0 2px', lineHeight: 1 }}>✕</button>
                                        </div>
                                    ))}
                                    {!storeTags.length && <p style={{ fontSize: '0.65rem', opacity: 0.6, margin: 0 }}>Añade etiquetas para filtrar productos</p>}
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Ej: oferta, nuevo, vegano..." onKeyDown={async (e) => { if (e.key === 'Enter' && newTag.trim()) { const updated = [...storeTags, newTag.trim().toLowerCase()]; await saveTags(updated); setNewTag(''); } }} style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: `1.5px solid ${G}`, outline: 'none', fontSize: '0.78rem' }} />
                                    <button onClick={async () => { if (newTag.trim()) { const updated = [...storeTags, newTag.trim().toLowerCase()]; await saveTags(updated); setNewTag(''); } }} style={{ background: GDark, color: 'white', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>+ Añadir</button>
                                </div>
                            </div>


                            {/* Share */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => window.open(`${window.location.origin}/tienda?u=${currentUser!.id}&viewAsGuest=true`, '_blank')} style={{ flex: 1, padding: '10px', background: GLight, color: GDark, border: `1.5px solid ${G}`, borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>👀 Ver como cliente</button>
                                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/tienda?u=${currentUser!.id}`); alert('¡Link copiado!'); }} style={{ flex: 1, padding: '10px', background: G, color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>🔗 Copiar Link</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CATEGORY HORIZONTAL SCROLL */}
                <div style={{ background: 'white', borderBottom: '1px solid #e0e0e0', padding: '0 16px' }}>
                    <div className="gallery-scroll" style={{ display: 'flex', gap: '0', overflowX: 'auto' }}>
                        <button onClick={() => setActiveCategory('all')} style={{ padding: '14px 18px', background: 'none', border: 'none', borderBottom: activeCategory === 'all' ? `3px solid ${G}` : '3px solid transparent', color: activeCategory === 'all' ? G : '#555', fontWeight: activeCategory === 'all' ? 800 : 500, fontSize: '0.82rem', whiteSpace: 'nowrap', cursor: 'pointer', transition: '0.2s' }}>
                            Todo
                        </button>
                        {storeCategories.slice(1).map(cat => (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ padding: '14px 18px', background: 'none', border: 'none', borderBottom: activeCategory === cat.id ? `3px solid ${G}` : '3px solid transparent', color: activeCategory === cat.id ? G : '#555', fontWeight: activeCategory === cat.id ? 800 : 500, fontSize: '0.82rem', whiteSpace: 'nowrap', cursor: 'pointer', transition: '0.2s' }}>
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* TOP PROMO BANNER */}
                <div style={{ margin: '0 16px 16px', marginTop: '16px', background: `linear-gradient(135deg, ${G} 0%, ${GDark} 100%)`, borderRadius: '12px', padding: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.85, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Compras de hoy</p>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 10px', lineHeight: 1.2 }}>¡Compra Fresco<br />y Ahorra! 🥦</h2>
                        <div style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.4)', padding: '8px 20px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-block' }}>VER OFERTAS</div>
                    </div>
                    <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '130px', height: '130px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
                    <div style={{ position: 'absolute', right: '30px', bottom: '-30px', width: '90px', height: '90px', background: 'rgba(255,255,255,0.07)', borderRadius: '50%' }}></div>
                </div>

                {/* PRODUCTS GRID - SUPERMARKET STYLE */}
                <div style={{ padding: '0 16px' }}>
                    {displayProducts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px 0', color: '#aaa' }}>
                            <p style={{ fontSize: '3rem' }}>🥬</p>
                            <p style={{ fontWeight: 700 }}>No encontramos productos.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
                            {displayProducts.map(p => (
                                <div key={p.id} style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
                                    {/* Product image */}
                                    <div style={{ height: '130px', overflow: 'hidden', background: '#fafafa', position: 'relative' }}>
                                        <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px', boxSizing: 'border-box' }} onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=60'; }} />
                                        {p.gallery && p.gallery.length > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', background: G, color: 'white', fontSize: '0.55rem', fontWeight: 800, padding: '2px 6px', borderRadius: '10px' }}>NUEVO</span>}
                                    </div>
                                    {/* Product info */}
                                    <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 600, margin: '0 0 4px', lineHeight: 1.3, color: '#222', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                            <div>
                                                <p style={{ fontSize: '1rem', fontWeight: 900, color: '#222', margin: 0 }}>S/ {typeof p.price === 'number' ? p.price.toFixed(2) : p.price}</p>
                                            </div>
                                            <button
                                                onClick={() => { }} /* onQuickAdd handled by ProductCard wrapper */
                                                style={{ background: G, color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                            >
                                                AÑADIR
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {renderThemeSelector()}
            </div>
        );
    }
    // ─── END SUPERMARKET LAYOUT ──────────────────────────────────────────────────

    // ─── FAST FOOD LAYOUT (BROASTER & GRILL) ───────────────────────────────────
    if (isFastFoodTheme) {
        const O = '#ff5722'; // orange
        const Y = '#ffc107'; // yellow
        const B = '#212121'; // black/dark grey
        const L = '#fff8f1'; // light crema

        return (
            <div style={{ minHeight: '100vh', background: L, paddingBottom: '100px', fontFamily: "'Outfit', sans-serif" }}>
                {/* HERO BANNER - FOOD STYLE */}
                <div style={{ position: 'relative', height: '240px', background: B, overflow: 'hidden' }}>
                    <img
                        src={storeBanner || 'https://images.unsplash.com/photo-1562967914-6cbb241c2b3f?w=1200&q=80'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                        alt="Fast food banner"
                    />
                    <div style={{ position: 'absolute', inset: 0, padding: '25px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(90deg, rgba(0,0,0,0.8), transparent)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                            <div style={{ width: '70px', height: '70px', borderRadius: '14px', border: `3px solid ${O}`, background: 'white', overflow: 'hidden' }}>
                                {storeLogo ? <img src={storeLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2rem', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>🍗</span>}
                            </div>
                            <div>
                                <h1 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>{storeName}</h1>
                                <p style={{ color: 'white', fontSize: '0.8rem', opacity: 0.9, margin: 0 }}>Buen provecho 🍴</p>
                            </div>
                        </div>
                        <p style={{ color: 'white', fontSize: '0.75rem', maxWidth: '300px', margin: 0, fontStyle: 'italic' }}>{storeBio}</p>
                    </div>
                </div>

                {/* EDIT PANEL TOGGLE (FOOD) */}
                {currentUser?.id === storeOwner?.id && !isGuestView && (
                    <div style={{ padding: '10px 20px', background: '#fff', borderBottom: `2px solid ${O}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => setIsEditingStore(!isEditingStore)} style={{ background: O, color: 'white', border: 'none', padding: '6px 16px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>
                            {isEditingStore ? 'Cerrar Ajustes' : '⚙️ Personalizar Carta'}
                        </button>
                        <button onClick={() => setEditingProduct({ title: '', price: '', categoryId: globalCategories[1]?.id || 'varios', image: '', gallery: [], colors: [], tags: [] })} style={{ background: B, color: 'white', border: 'none', padding: '6px 16px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>
                            + Añadir Plato
                        </button>
                    </div>
                )}

                {/* EDIT PANEL (FOOD) */}
                {isEditingStore && currentUser?.id === storeOwner?.id && !isGuestView && (
                    <div style={{ margin: '15px 20px', padding: '20px', background: 'white', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 900, color: O, marginBottom: '20px' }}>🍔 Personaliza tu Negocio</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ background: '#fafafa', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ width: '50px', height: '50px', background: O, borderRadius: '12px', margin: '0 auto 8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{storeLogo ? <img src={storeLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🍗'}</div>
                                    <button onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async (e: any) => { if (e.target.files[0]) { const c = await compressImage(e.target.files[0]); await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeLogo: c }, { merge: true }); } }; i.click(); }} style={{ background: 'none', border: `1px solid ${O}`, color: O, padding: '4px 10px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer' }}>Logo</button>
                                </div>
                                <div style={{ background: '#fafafa', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                                    <div style={{ width: '80px', height: '50px', background: B, borderRadius: '8px', margin: '0 auto 8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{storeBanner ? <img src={storeBanner} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🖼️'}</div>
                                    <button onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = async (e: any) => { if (e.target.files[0]) { const c = await compressImage(e.target.files[0]); await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeBanner: c }, { merge: true }); } }; i.click(); }} style={{ background: 'none', border: `1px solid ${O}`, color: O, padding: '4px 10px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 900, cursor: 'pointer' }}>Banner</button>
                                </div>
                            </div>
                            <input type="text" defaultValue={storeName} onBlur={async (e) => { const v = e.target.value.trim(); if (v) await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeName: v }, { merge: true }); }} placeholder="Nombre del Restaurante" style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid #eee', outline: 'none', fontSize: '0.9rem', fontWeight: 800 }} />
                            <textarea defaultValue={storeBio} onBlur={async (e) => { await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeBio: e.target.value.trim() }, { merge: true }); }} placeholder="Escribe algo tentador..." style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid #eee', outline: 'none', fontSize: '0.85rem', resize: 'none', height: '60px' }} />

                            <div style={{ background: L, padding: '15px', borderRadius: '12px' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 900, color: O, marginBottom: '10px', textTransform: 'uppercase' }}>Secciones de tu Carta</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                    {(storeOwner?.storeCategories || []).map((cat, i) => (
                                        <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: O, color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 800 }}>
                                            <span>{cat.name}</span>
                                            <button onClick={async () => { const updated = (storeOwner?.storeCategories || []).filter((_, j) => j !== i); await saveCats(updated); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Ej: Combos..." onKeyDown={async (e) => { if (e.key === 'Enter' && newCatName.trim()) { const id = newCatName.trim().toLowerCase().replace(/\s+/g, '-'); const updated = [...(storeOwner?.storeCategories || []), { id, name: newCatName.trim() }]; await saveCats(updated); setNewCatName(''); } }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.8rem' }} />
                                    <button onClick={async () => { if (newCatName.trim()) { const id = newCatName.trim().toLowerCase().replace(/\s+/g, '-'); const updated = [...(storeOwner?.storeCategories || []), { id, name: newCatName.trim() }]; await saveCats(updated); setNewCatName(''); } }} style={{ background: O, color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900 }}>+</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CATEGORY NAV (FOOD) */}
                <div style={{ background: 'white', position: 'sticky', top: 60, zIndex: 50, borderBottom: '1.5px solid #eee', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', gap: '15px', padding: '15px 20px' }}>
                        {storeCategories.map(cat => (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ padding: '8px 20px', background: activeCategory === cat.id ? O : 'none', color: activeCategory === cat.id ? 'white' : '#555', border: activeCategory === cat.id ? `1.5px solid ${O}` : '1.5px solid #ddd', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer', transition: '0.2s' }}>
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* SEARCH BAR (FOOD) */}
                <div style={{ padding: '20px' }}>
                    <div style={{ position: 'relative' }}>
                        <input type="text" placeholder="¿Qué se te antoja hoy?" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '14px 20px', borderRadius: '15px', border: '1.5px solid #eee', background: 'white', fontSize: '0.9rem', outline: 'none' }} />
                        <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }}>🍗</span>
                    </div>
                </div>

                {/* PRODUCT LIST (FOOD STYLE) */}
                <div style={{ padding: '0 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: '15px' }}>
                        {displayProducts.map(p => (
                            <div key={p.id} style={{ background: 'white', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: '140px', background: '#fafafa', position: 'relative' }}>
                                    <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=60'; }} />
                                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: Y, color: B, padding: '4px 8px', borderRadius: '10px', fontWeight: 900, fontSize: '0.85rem' }}>S/ {p.price}</div>
                                </div>
                                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px', color: B }}>{p.title}</p>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {(p.tags || []).slice(0, 2).map((t, i) => <span key={i} style={{ fontSize: '0.55rem', color: O, fontWeight: 800 }}>#{t}</span>)}
                                        </div>
                                    </div>
                                    <button style={{ background: O, color: 'white', border: 'none', padding: '10px', borderRadius: '14px', fontSize: '0.75rem', fontWeight: 900, width: '100%', cursor: 'pointer' }}>PEDIR YA</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {displayProducts.length === 0 && <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>🍔 No hay platos en esta categoría aún.</div>}
                </div>

                {renderThemeSelector()}
            </div>
        );
    }
    // ─── END FAST FOOD LAYOUT ──────────────────────────────────────────────────

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            {/* STOREFRONT HEADER - FB STYLE */}
            <div style={{ position: 'relative', marginBottom: '40px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(0,0,0,0.05)' }}>
                {/* BANNER PORTADA */}
                <div className={users.length === 0 ? 'skeleton' : ''} style={{ width: '100%', height: '220px', background: 'var(--primary)', position: 'relative' }}>
                    <img src={storeBanner || 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Portada de la tienda" />
                </div>

                <div style={{ padding: '0 30px 30px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    {/* AVATAR OVERLAP */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '-40px' }}>
                        <div className={users.length === 0 ? 'skeleton' : ''} style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '2.5rem', overflow: 'hidden', border: '5px solid var(--surface)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', position: 'relative', zIndex: 10 }}>
                            {storeLogo ? <img src={storeLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (storeOwner?.initials || 'D')}
                        </div>

                        {/* SOCIAL LINKS */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '55px' }}>
                            {SOCIAL_ICONS && Object.keys(SOCIAL_ICONS).map(net => (
                                globalSocialLinks && globalSocialLinks[net] && (
                                    <a key={net} href={globalSocialLinks[net]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', opacity: 0.6, fontSize: '1.2rem', padding: '5px' }}>
                                        {SOCIAL_ICONS[net]}
                                    </a>
                                )
                            ))}
                        </div>
                    </div>

                    {/* STORE INFO & STATS */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginTop: '15px' }}>
                        <div style={{ flex: '1 1 300px' }}>
                            <h1 className={users.length === 0 ? 'skeleton' : ''} style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', margin: '0 0 5px 0' }}>{storeName}</h1>
                            <p className={users.length === 0 ? 'skeleton' : ''} style={{ opacity: 0.7, fontSize: '0.9rem', maxWidth: '600px', margin: 0, lineHeight: 1.5 }}>{storeBio}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '25px', background: 'var(--bg)', padding: '15px 25px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.03)' }}>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem', margin: 0 }}>{storeProducts.length}</p>
                                <p style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', margin: 0 }}>Productos</p>
                            </div>
                            <div style={{ width: '1px', background: 'rgba(0,0,0,0.05)' }}></div>
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem', margin: 0 }}>5.0 ⭐</p>
                                <p style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', margin: 0 }}>Valoración</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* EDIT STORE TOGGLE & PANEL */}
            {currentUser?.id === storeOwner?.id && !isGuestView && (
                <button
                    onClick={() => setIsEditingStore(!isEditingStore)}
                    style={{ marginBottom: '30px', background: isEditingStore ? 'var(--surface)' : 'var(--primary)', color: isEditingStore ? 'var(--primary)' : 'white', border: `2px solid var(--primary)`, padding: '10px 20px', borderRadius: '30px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', transition: '0.3s' }}
                >
                    {isEditingStore ? 'Cerrar Ajustes' : '⚙️ Personalizar Tienda'}
                </button>
            )}

            {isEditingStore && currentUser?.id === storeOwner?.id && !isGuestView && (
                <div style={{ marginBottom: '40px', padding: '25px', background: 'var(--surface)', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)', textAlign: 'left', boxShadow: 'var(--shadow-md)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '20px' }}>🎨 Ajustes de tu Tienda</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            {/* LOGO SUBIDA */}
                            <div style={{ background: 'var(--bg)', padding: '15px', borderRadius: '15px', display: 'flex', gap: '15px', alignItems: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: 'white', fontWeight: 800 }}>
                                    {storeLogo ? <img src={storeLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'D'}
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, margin: '0 0 5px 0' }}>Foto de Perfil</p>
                                    <button
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file'; input.accept = 'image/*';
                                            input.onchange = async (e: any) => {
                                                if (e.target.files[0]) {
                                                    const compressed = await compressImage(e.target.files[0]);
                                                    await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeLogo: compressed }, { merge: true });
                                                }
                                            };
                                            input.click();
                                        }}
                                        style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', borderRadius: '15px', fontSize: '0.65rem', fontWeight: 700, border: 'none' }}
                                    >Subir circular</button>
                                </div>
                            </div>

                            {/* BANNER SUBIDA */}
                            <div style={{ background: 'var(--bg)', padding: '15px', borderRadius: '15px', display: 'flex', gap: '15px', alignItems: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
                                <div style={{ width: '80px', height: '50px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: 'white', fontWeight: 800 }}>
                                    {storeBanner ? <img src={storeBanner} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🖼️'}
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, margin: '0 0 5px 0' }}>Foto Portada (Banner)</p>
                                    <button
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file'; input.accept = 'image/*';
                                            input.onchange = async (e: any) => {
                                                if (e.target.files[0]) {
                                                    const compressed = await compressImage(e.target.files[0]);
                                                    await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeBanner: compressed }, { merge: true });
                                                }
                                            };
                                            input.click();
                                        }}
                                        style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', borderRadius: '15px', fontSize: '0.65rem', fontWeight: 700, border: 'none' }}
                                    >Subir rectangular</button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px', display: 'block', color: 'var(--primary)' }}>Nombre Público de la Tienda</label>
                            <input
                                type="text"
                                defaultValue={storeName}
                                onBlur={async (e) => {
                                    const val = e.target.value.trim();
                                    if (val) await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeName: val }, { merge: true });
                                }}
                                style={{ width: '100%', borderRadius: '12px', padding: '15px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--bg)', outline: 'none', fontSize: '0.9rem' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px', display: 'block', color: 'var(--primary)' }}>Bio / Descripción corta</label>
                            <textarea
                                defaultValue={storeBio}
                                onBlur={async (e) => {
                                    const val = e.target.value.trim();
                                    await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, storeBio: val }, { merge: true });
                                }}
                                style={{ width: '100%', height: '100px', borderRadius: '12px', padding: '15px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--bg)', fontSize: '0.9rem', resize: 'none', outline: 'none' }}
                                placeholder="Cuéntanos sobre tu marca..."
                            />
                        </div>

                        {/* CATEGORIES MANAGER - FB LAYOUT */}
                        <div style={{ background: 'var(--bg)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '5px', display: 'block', color: 'var(--primary)' }}>🏷️ Categorías de mi Tienda</label>
                            <p style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '12px' }}>Organiza tus productos con categorías propias de tu rubro.</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                {(storeOwner?.storeCategories || []).map((cat, i) => (
                                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--primary)', color: 'white', borderRadius: '30px', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700 }}>
                                        <span>{cat.name}</span>
                                        <button onClick={async () => { const updated = (storeOwner?.storeCategories || []).filter((_, j) => j !== i); await saveCats(updated); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✕</button>
                                    </div>
                                ))}
                                {!(storeOwner?.storeCategories?.length) && <p style={{ fontSize: '0.72rem', opacity: 0.5, margin: 0, fontStyle: 'italic' }}>Aún sin categorías. ¡Agrega la primera!</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                    placeholder="Ej: Ropa, Comida, Tecnología..."
                                    onKeyDown={async (e) => { if (e.key === 'Enter' && newCatName.trim()) { const id = newCatName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); const updated = [...(storeOwner?.storeCategories || []), { id, name: newCatName.trim() }]; await saveCats(updated); setNewCatName(''); } }}
                                    style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--surface)', outline: 'none', fontSize: '0.85rem' }}
                                />
                                <button onClick={async () => { if (newCatName.trim()) { const id = newCatName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); const updated = [...(storeOwner?.storeCategories || []), { id, name: newCatName.trim() }]; await saveCats(updated); setNewCatName(''); } }} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>+ Añadir</button>
                            </div>
                        </div>

                        {/* DEFAULT CATEGORIES TOGGLE (FB LAYOUT) */}
                        {themeDefaults && (
                            <div style={{ background: 'var(--surface)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '5px', display: 'block', color: 'var(--primary)' }}>👁️ Categorías del Diseño</label>
                                <p style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '12px' }}>Oculta o muestra las categorías que vienen sugeridas por tu plantilla.</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {themeDefaults.categories.map(cat => {
                                        const isHidden = disabledCats.includes(cat.id);
                                        return (
                                            <button
                                                key={cat.id}
                                                onClick={() => toggleDefaultCat(cat.id)}
                                                style={{
                                                    padding: '8px 16px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 700,
                                                    background: isHidden ? 'white' : 'var(--primary)',
                                                    color: isHidden ? '#777' : 'white',
                                                    border: `1.5px solid ${isHidden ? '#ddd' : 'var(--primary)'}`,
                                                    cursor: 'pointer', transition: 'var(--transition)'
                                                }}
                                            >
                                                {isHidden ? '🕶️ ' : '✅ '}{cat.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* TAGS MANAGER - FB LAYOUT */}
                        <div style={{ background: 'var(--bg)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(0,0,0,0.06)' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '5px', display: 'block', color: 'var(--primary)' }}>🔖 Etiquetas de Productos</label>
                            <p style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '12px' }}>Etiquetas que podrás asignar a tus productos para filtrarlos.</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                {storeTags.map((tag, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.07)', borderRadius: '30px', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>
                                        <span>#{tag}</span>
                                        <button onClick={async () => { const updated = storeTags.filter((_, j) => j !== i); await saveTags(updated); }} style={{ background: 'rgba(0,0,0,0.1)', border: 'none', cursor: 'pointer', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✕</button>
                                    </div>
                                ))}
                                {!storeTags.length && <p style={{ fontSize: '0.72rem', opacity: 0.5, margin: 0, fontStyle: 'italic' }}>Aún sin etiquetas. ¡Añade la primera!</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    value={newTag}
                                    onChange={e => setNewTag(e.target.value)}
                                    placeholder="Ej: oferta, nuevo, exclusivo..."
                                    onKeyDown={async (e) => { if (e.key === 'Enter' && newTag.trim()) { const updated = [...storeTags, newTag.trim().toLowerCase()]; await saveTags(updated); setNewTag(''); } }}
                                    style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--surface)', outline: 'none', fontSize: '0.85rem' }}
                                />
                                <button onClick={async () => { if (newTag.trim()) { const updated = [...storeTags, newTag.trim().toLowerCase()]; await saveTags(updated); setNewTag(''); } }} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>+ Añadir</button>
                            </div>
                        </div>



                        {/* CUSTOM COLOR OVERRIDE */}
                        <div style={{ background: 'var(--bg)', borderRadius: '15px', padding: '15px', border: '1px solid rgba(0,0,0,0.06)' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '12px', color: 'var(--primary)' }}>🖌️ Colores Personalizados</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                                {[
                                    { key: 'customPrimary', label: 'Color Principal', defaultVal: storeOwner?.customPrimary || STORE_THEMES.find(t => t.id === (storeOwner?.themeId || 'organic-handmade'))?.primary || '#6d4c41' },
                                    { key: 'customBg', label: 'Fondo General', defaultVal: storeOwner?.customBg || STORE_THEMES.find(t => t.id === (storeOwner?.themeId || 'organic-handmade'))?.bg || '#ffffff' },
                                    { key: 'customSurface', label: 'Fondo de Tarjetas', defaultVal: storeOwner?.customSurface || STORE_THEMES.find(t => t.id === (storeOwner?.themeId || 'organic-handmade'))?.surface || '#fffaf0' },
                                ].map(({ key, label, defaultVal }) => (
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                                        <input
                                            type="color"
                                            defaultValue={defaultVal}
                                            onChange={async (e) => {
                                                await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, [key]: e.target.value }, { merge: true });
                                            }}
                                            style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', cursor: 'pointer', padding: 0 }}
                                        />
                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, lineHeight: 1.2 }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '10px', lineHeight: 1.4 }}>💡 Los colores personalizados se aplican sobre la plantilla elegida.</p>
                        </div>

                        {/* LIVE STORE SECTION */}
                        <div style={{ marginTop: '10px', padding: '20px', background: 'var(--primary)', color: 'white', borderRadius: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🌐 Tu Tienda está en vivo</span>
                                </p>
                                <p style={{ fontSize: '0.65rem', opacity: 0.8, marginBottom: '20px', lineHeight: 1.4 }}>Comparte tu link personal para que tus clientes vean tu web. Así mismo es como lo verán tus invitados.</p>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => window.open(`${window.location.origin}/tienda?u=${currentUser!.id}&viewAsGuest=true`, '_blank')}
                                        style={{ flex: 1, background: 'white', color: 'var(--primary)', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                    >👀 Ver como cliente</button>
                                    <button
                                        onClick={() => {
                                            const link = `${window.location.origin}/tienda?u=${currentUser!.id}`;
                                            navigator.clipboard.writeText(link);
                                            alertAction('Copiado', '¡Link de tu tienda copiado! 🌿');
                                        }}
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                                    >🔗 Copiar Link</button>
                                </div>
                            </div>
                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* SEARCH & FILTERS */}
            <section style={{ margin: '0 0 40px' }}>
                <div style={{ position: 'relative', marginBottom: '25px' }}>
                    <input
                        type="text"
                        placeholder="Buscar en esta tienda..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '18px 25px', borderRadius: '30px', border: '1px solid rgba(0,0,0,0.08)', fontSize: '1rem', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', outline: 'none' }}
                    />
                    <span style={{ position: 'absolute', right: '25px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}>🔍</span>
                </div>

                <div className="gallery-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
                    <button
                        onClick={() => setActiveCategory('all')}
                        style={{
                            padding: '10px 22px', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap',
                            background: activeCategory === 'all' ? 'var(--primary)' : 'var(--surface)',
                            color: activeCategory === 'all' ? 'white' : 'var(--text)',
                            border: '1px solid ' + (activeCategory === 'all' ? 'var(--primary)' : 'rgba(0,0,0,0.05)'),
                            boxShadow: activeCategory === 'all' ? 'var(--shadow-md)' : 'none'
                        }}
                    >
                        Todo
                    </button>
                    {storeCategories.slice(1).map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            style={{
                                padding: '10px 22px', borderRadius: '30px', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap',
                                background: activeCategory === cat.id ? 'var(--primary)' : 'var(--surface)',
                                color: activeCategory === cat.id ? 'white' : 'var(--text)',
                                border: '1px solid ' + (activeCategory === cat.id ? 'var(--primary)' : 'rgba(0,0,0,0.05)'),
                                boxShadow: activeCategory === cat.id ? 'var(--shadow-md)' : 'none'
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </section>

            {/* PRODUCT GRID */}
            <section style={{ marginBottom: '40px' }}>
                <div className="grid">
                    {displayProducts.map(p => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
                {displayProducts.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
                        <p style={{ fontSize: '3rem', marginBottom: '10px' }}>🍃</p>
                        <p>No encontramos productos en esta tienda para lo que buscas.</p>
                    </div>
                )}
            </section>

            {(currentUser?.role === 'socio' || currentUser?.role === 'colaborador') && !isGuestView && (
                <button className="fab" onClick={() => setEditingProduct({ title: '', price: '', categoryId: globalCategories[1]?.id || 'varios', image: '', gallery: [], colors: [], tags: [] })}>+</button>
            )}
            {renderThemeSelector()}
        </div>
    );
};

export default ShopView;
