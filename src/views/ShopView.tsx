import { useLocation } from 'react-router-dom';
import React, { useState } from 'react';
import type { Product } from '../data/products';
import { type User, STORE_THEMES } from '../App';
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
    compressImage
}) => {
    const loc = useLocation();
    const [isEditingStore, setIsEditingStore] = useState(false);
    const query = new URLSearchParams(loc.search);
    const shopId = query.get('u') || currentUser?.id || 'master';
    const isGuestView = query.get('viewAsGuest') === 'true';

    // Find store owner
    const storeOwner = users.find(u => u.id === shopId) || users.find(u => u.id === 'master');
    const storeName = storeOwner?.storeName || storeOwner?.name || "DELVA OFFICIAL";
    const storeLogo = storeOwner?.storeLogo || storeOwner?.photoURL || null;
    const storeBanner = storeOwner?.storeBanner || null;
    const storeBio = storeOwner?.storeBio || "La esencia pura de la selva amazónica hecha moda y sabor. Bienvenida a nuestra tienda oficial.";

    // Filter products for THIS store only
    const storeProducts = products.filter(p => (p as any).userId === shopId || (shopId === 'master' && !(p as any).userId));

    // Final display products (applying category/search filters)
    const displayProducts = storeProducts.filter(p => {
        const matchesCat = activeCategory === 'all' || p.categoryId === activeCategory;
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCat && matchesSearch;
    });

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
                            {Object.keys(SOCIAL_ICONS).map(net => (
                                globalSocialLinks[net] && (
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

                        <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '5px', display: 'block', color: 'var(--primary)' }}>🎨 Plantilla de Diseño</label>
                            <p style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '15px' }}>Elige el look de tu tienda. El cambio se aplica al instante.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                                {STORE_THEMES.map(theme => {
                                    const isSelected = storeOwner?.themeId === theme.id || (!storeOwner?.themeId && theme.id === 'organic-handmade');
                                    return (
                                        <div
                                            key={theme.id}
                                            onClick={async () => {
                                                await setDoc(doc(db, 'users', currentUser!.id), { ...currentUser, themeId: theme.id }, { merge: true });
                                            }}
                                            style={{
                                                cursor: 'pointer',
                                                borderRadius: '16px',
                                                overflow: 'hidden',
                                                border: isSelected ? `3px solid ${theme.primary}` : '3px solid transparent',
                                                boxShadow: isSelected ? `0 4px 20px ${theme.primary}44` : '0 2px 8px rgba(0,0,0,0.08)',
                                                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                                            }}
                                        >
                                            {/* Mini store preview */}
                                            <div style={{ background: theme.bg, padding: '0 0 10px 0' }}>
                                                {/* Mini banner */}
                                                <div style={{ height: '40px', background: theme.primary, marginBottom: '6px', position: 'relative', display: 'flex', alignItems: 'flex-end', paddingLeft: '8px', paddingBottom: '4px' }}>
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: theme.surface, border: `2px solid ${theme.surface}`, marginBottom: '-10px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
                                                </div>
                                                {/* Mini content */}
                                                <div style={{ padding: '12px 8px 0' }}>
                                                    <div style={{ height: '7px', borderRadius: '4px', background: theme.primary, marginBottom: '4px', width: '70%', opacity: 0.9 }}></div>
                                                    <div style={{ height: '4px', borderRadius: '4px', background: theme.primary, marginBottom: '10px', width: '50%', opacity: 0.3 }}></div>
                                                    {/* Mini product cards */}
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                                        {[0, 1].map(i => (
                                                            <div key={i} style={{ background: theme.surface, borderRadius: theme.radius, padding: '4px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                                                <div style={{ height: '28px', background: `${theme.primary}22`, borderRadius: `calc(${theme.radius} - 2px)`, marginBottom: '3px' }}></div>
                                                                <div style={{ height: '4px', borderRadius: '2px', background: theme.primary, marginBottom: '2px', width: '80%' }}></div>
                                                                <div style={{ height: '3px', borderRadius: '2px', background: `${theme.primary}55`, width: '50%' }}></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Label */}
                                            <div style={{ padding: '8px', background: isSelected ? theme.primary : 'var(--surface)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ display: 'flex', gap: '3px' }}>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: theme.primary, border: '1px solid rgba(0,0,0,0.1)' }}></div>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: theme.bg, border: '1px solid rgba(0,0,0,0.1)' }}></div>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: theme.surface, border: '1px solid rgba(0,0,0,0.1)' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: isSelected ? 'white' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {theme.name}
                                                </span>
                                                {isSelected && <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'white' }}>✓</span>}
                                            </div>
                                        </div>
                                    );
                                })}
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
                                            alert('¡Link de tu tienda copiado! 🌿');
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
                    {globalCategories.slice(1).map(cat => (
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

            {(currentUser?.role === 'admin' || currentUser?.role === 'colaborador') && !isGuestView && (
                <button className="fab" onClick={() => setEditingProduct({ title: '', price: '', categoryId: globalCategories[1]?.id || 'varios', image: '', gallery: [], colors: [], tags: [] })}>+</button>
            )}
        </div>
    );
};

export default ShopView;
