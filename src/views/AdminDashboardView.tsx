import React, { useState } from 'react';
import { doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Product } from '../data/products';
import { type User } from '../App';

interface AdminDashboardViewProps {
    currentUser: any;
    products: Product[];
    users: User[];
    banners: { id: string, image: string, title?: string }[];
    exportDB: () => void;
    globalBrandName: string;
    setGlobalBrandName: (val: string) => void;
    globalPrimaryColor: string;
    setGlobalPrimaryColor: (val: string) => void;
    globalFont: string;
    setGlobalFont: (val: string) => void;
    globalWaNumber: string;
    setGlobalWaNumber: (val: string) => void;
    globalGridCols: number;
    setGlobalGridCols: (val: number) => void;
    globalLogo: string;
    setGlobalLogo: (val: string) => void;
    globalFavicon: string;
    setGlobalFavicon: (val: string) => void;
    globalMetaDesc: string;
    setGlobalMetaDesc: (val: string) => void;
    globalKeywords: string;
    setGlobalKeywords: (val: string) => void;
    globalSocialLinks: any;
    setGlobalSocialLinks: (val: any) => void;
    globalTags: string[];
    setGlobalTags: (val: string[]) => void;
    globalCategories: { id: string, name: string }[];
    setGlobalCategories: (val: any) => void;
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleFaviconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    saveSettings: () => void;
    compressImage: (file: File) => Promise<string>;
    setEditingProduct: (p: any) => void;
    SOCIAL_ICONS: any;
    logout: () => void;
}

const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
    currentUser, products, users, banners, exportDB,
    globalBrandName, setGlobalBrandName, globalPrimaryColor, setGlobalPrimaryColor,
    globalFont, setGlobalFont, globalWaNumber, setGlobalWaNumber, globalGridCols, setGlobalGridCols,
    globalLogo, setGlobalLogo, globalFavicon, globalMetaDesc, setGlobalMetaDesc,
    globalKeywords, setGlobalKeywords, globalSocialLinks, setGlobalSocialLinks,
    globalTags, setGlobalTags, globalCategories, setGlobalCategories,
    handleLogoUpload, handleFaviconUpload, saveSettings, compressImage, setEditingProduct,
    SOCIAL_ICONS, logout
}) => {
    if (!currentUser) return <div className="container" style={{ padding: '100px 0', textAlign: 'center', minHeight: '80vh' }}><h2>Debes iniciar sesión</h2></div>;

    const isSeller = currentUser.role === 'admin' || currentUser.role === 'colaborador';
    const [generatedInviteLink, setGeneratedInviteLink] = useState<string>('');
    const [inviteCopied, setInviteCopied] = useState(false);

    const LockedSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div style={{ position: 'relative', background: 'var(--surface)', padding: '30px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', color: 'var(--primary)', opacity: isSeller ? 1 : 0.4 }}>{title}</h3>
            <div style={{ opacity: isSeller ? 1 : 0.2, pointerEvents: isSeller ? 'auto' : 'none', filter: isSeller ? 'none' : 'grayscale(1)' }}>
                {children}
            </div>
            {!isSeller && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(2px)', padding: '20px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.5rem', marginBottom: '10px' }}>🔒</span>
                    <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Función de Socio DELVA</p>
                    <p style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '15px' }}>Suscríbete o solicita acceso para vender y personalizar tu tienda.</p>
                    <button onClick={() => window.open('https://wa.me/51900000000?text=Hola,%20quiero%20ser%20Socio%20DELVA', '_blank')} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>Me interesa ✨</button>
                </div>
            )}
        </div>
    );

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <section style={{ background: 'var(--primary)', borderRadius: 'var(--radius-lg)', padding: '30px', margin: '20px 0', color: 'white', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '5px' }}>{isSeller ? '🌿 Panel de Gestión' : '👤 Mi Cuenta'}</h2>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Hola, {currentUser.name}. Tu cuenta es {isSeller ? 'Socio DELVA' : 'Cliente'}.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        {isSeller && (
                            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '15px' }}>
                                <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.6 }}>Productos</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{products.length}</p>
                            </div>
                        )}
                        {currentUser.role === 'admin' && <button onClick={exportDB} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Backup DB</button>}
                        <button onClick={logout} style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Cerrar Sesión 🚪</button>
                    </div>
                </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                {/* BRANDING SECTION */}
                <LockedSection title="🎨 Personalización de App">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>Nombre de la Marca</label>
                            <input type="text" value={globalBrandName} onChange={e => setGlobalBrandName(e.target.value)} style={{ width: '100%', borderRadius: '12px', padding: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--bg)' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>WhatsApp Global</label>
                            <input type="text" value={globalWaNumber} onChange={e => setGlobalWaNumber(e.target.value)} placeholder="Ej: 519XXXXXXXX" style={{ width: '100%', borderRadius: '12px', padding: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--bg)' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>Tipografía</label>
                                <select value={globalFont} onChange={e => { setGlobalFont(e.target.value); document.documentElement.style.setProperty('--font-main', `"${e.target.value}", sans-serif`); }} style={{ width: '100%', borderRadius: '12px', padding: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--bg)' }}>
                                    <option value="Montserrat">Montserrat</option>
                                    <option value="Helvetica">Helvetica</option>
                                    <option value="Georgia">Georgia</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>Columnas</label>
                                <select value={globalGridCols} onChange={e => { setGlobalGridCols(Number(e.target.value)); document.documentElement.style.setProperty('--grid-cols', String(e.target.value)); }} style={{ width: '100%', borderRadius: '12px', padding: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--bg)' }}>
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>Color Principal</label>
                                <input type="color" value={globalPrimaryColor} onChange={e => { setGlobalPrimaryColor(e.target.value); document.documentElement.style.setProperty('--primary', e.target.value); }} style={{ width: '100%', height: '45px', borderRadius: '12px', padding: '0', border: 'none', cursor: 'pointer' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>Logo</label>
                                {globalLogo ? (
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <img src={globalLogo} style={{ height: '45px', width: '45px', objectFit: 'contain', background: 'var(--bg)', borderRadius: '10px' }} />
                                        <button onClick={() => setGlobalLogo('')} style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '8px', fontSize: '0.6rem' }}>✕</button>
                                    </div>
                                ) : (
                                    <>
                                        <button onClick={() => document.getElementById('logoInput')?.click()} style={{ width: '100%', height: '45px', borderRadius: '12px', border: '1px dashed var(--primary)', background: 'transparent', fontSize: '0.7rem', fontWeight: 700 }}>Subir</button>
                                        <input id="logoInput" type="file" onChange={handleLogoUpload} accept="image/*" style={{ display: 'none' }} />
                                    </>
                                )}
                            </div>
                        </div>
                        <button onClick={saveSettings} className="btn-wa" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '15px', marginTop: '10px' }}>Guardar Cambios ✨</button>
                    </div>
                </LockedSection>

                {/* SEO & WEB IDENTITY */}
                <LockedSection title="🔍 SEO & Pestaña">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>Icono de Pestaña (Favicon)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--bg)', padding: '10px', borderRadius: '12px' }}>
                                <img src={globalFavicon || '/vite.svg'} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                                <button onClick={() => document.getElementById('faviconInput')?.click()} style={{ background: 'var(--primary)', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 600 }}>Subir</button>
                                <input id="faviconInput" type="file" onChange={handleFaviconUpload} accept="image/*" style={{ display: 'none' }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>Descripción Google</label>
                            <textarea value={globalMetaDesc} onChange={e => setGlobalMetaDesc(e.target.value)} style={{ width: '100%', height: '80px', borderRadius: '12px', padding: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--bg)', fontSize: '0.8rem', resize: 'none' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>Keywords</label>
                            <input type="text" value={globalKeywords} onChange={e => setGlobalKeywords(e.target.value)} style={{ width: '100%', borderRadius: '12px', padding: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--bg)' }} />
                        </div>
                    </div>
                </LockedSection>

                {/* SOCIAL LINKS */}
                <LockedSection title="🔗 Redes Sociales Globales">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {Object.keys(SOCIAL_ICONS).map(net => (
                            <div key={net} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg)', padding: '10px 15px', borderRadius: '15px' }}>
                                <div style={{ color: 'var(--primary)', opacity: 0.7 }}>{SOCIAL_ICONS[net]}</div>
                                <input type="text" value={globalSocialLinks[net] || ''} onChange={e => setGlobalSocialLinks({ ...globalSocialLinks, [net]: e.target.value })} placeholder={`Link de ${net}`} style={{ background: 'transparent', border: 'none', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, width: '100%' }} />
                            </div>
                        ))}
                    </div>
                </LockedSection>

                {/* TAGS & CATEGORIES */}
                <LockedSection title="🏷️ Etiquetas y Filtros">
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '10px', display: 'block' }}>Etiquetas Globales</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {globalTags.map(tag => (
                                <span key={tag} style={{ background: 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    {tag} <button onClick={() => setGlobalTags(globalTags.filter(t => t !== tag))} style={{ color: 'white', opacity: 0.6, background: 'transparent', fontSize: '0.8rem' }}>✕</button>
                                </span>
                            ))}
                        </div>
                        <input type="text" placeholder="Nueva etiqueta + Enter" style={{ width: '100%', borderRadius: '12px', padding: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--bg)', fontSize: '0.8rem' }} onKeyDown={e => {
                            if (e.key === 'Enter') {
                                const val = (e.currentTarget as HTMLInputElement).value.trim();
                                if (val && !globalTags.includes(val)) {
                                    setGlobalTags([...globalTags, val]);
                                    (e.currentTarget as HTMLInputElement).value = '';
                                }
                            }
                        }} />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '10px', display: 'block' }}>Categorías</label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            {globalCategories.filter(c => c.id !== 'all').map(cat => (
                                <span key={cat.id} style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                                    {cat.name} <button onClick={() => setGlobalCategories(globalCategories.filter(c => c.id !== cat.id))} style={{ color: 'var(--primary)', opacity: 0.4, background: 'transparent', fontSize: '0.8rem' }}>✕</button>
                                </span>
                            ))}
                        </div>
                        <input type="text" placeholder="Nueva categoría + Enter" style={{ width: '100%', borderRadius: '12px', padding: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--bg)', fontSize: '0.8rem' }} onKeyDown={e => {
                            if (e.key === 'Enter') {
                                const val = (e.currentTarget as HTMLInputElement).value.trim();
                                if (val && !globalCategories.find(c => c.name.toLowerCase() === val.toLowerCase())) {
                                    setGlobalCategories([...globalCategories, { id: val.toLowerCase().replace(/\s+/g, '-'), name: val }]);
                                    (e.currentTarget as HTMLInputElement).value = '';
                                }
                            }
                        }} />
                    </div>
                </LockedSection>


                {/* PRODUCT MANAGEMENT */}
                <LockedSection title="📝 Mis Productos">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>Gestiona lo que vendes</p>
                        <button onClick={() => setEditingProduct({ title: '', price: '', categoryId: globalCategories[1]?.id || 'varios', image: '', gallery: [], colors: [], tags: [] })} style={{ background: 'var(--accent)', color: 'var(--primary)', border: 'none', padding: '8px 15px', borderRadius: '20px', fontWeight: 800, fontSize: '0.75rem' }}>+ Nuevo</button>
                    </div>
                    <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }} className="gallery-scroll">
                        {products.filter(p => p.userId === currentUser.id).length === 0 ? (
                            <p style={{ fontSize: '0.8rem', textAlign: 'center', padding: '20px', opacity: 0.5 }}>Aún no has subido productos.</p>
                        ) : (
                            products.filter(p => p.userId === currentUser.id).map(p => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg)', padding: '10px', borderRadius: '15px' }}>
                                    <img src={p.image} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>{p.title}</p>
                                        <p style={{ fontSize: '0.7rem', opacity: 0.6, margin: 0 }}>S/ {Number(p.price).toFixed(2)}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => setEditingProduct(p)} style={{ background: 'transparent', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 700 }}>✏️</button>
                                        <button onClick={() => deleteDoc(doc(db, 'products', p.id))} style={{ background: 'transparent', color: 'var(--danger)', fontSize: '0.7rem', fontWeight: 700 }}>🗑️</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </LockedSection>

                {/* BANNERS MANAGEMENT */}
                {currentUser.role === 'admin' && (
                    <LockedSection title="🖼️ Banners de Inicio">
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {banners.map(b => (
                                <div key={b.id} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                    <img src={b.image} style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                                    <button onClick={() => deleteDoc(doc(db, 'banners', b.id))} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.6rem' }}>✕</button>
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file'; input.accept = 'image/*';
                                    input.onchange = async (e: any) => {
                                        if (e.target.files[0]) {
                                            const file = e.target.files[0];
                                            const compressed = await compressImage(file);
                                            const id = Date.now().toString();
                                            const title = prompt('Título del banner (opcional):') || '';
                                            await setDoc(doc(db, 'banners', id), { id, image: compressed, title });
                                        }
                                    };
                                    input.click();
                                }}
                                style={{ width: '80px', height: '80px', borderRadius: '12px', border: '1.5px dashed rgba(0,0,0,0.1)', background: 'var(--bg)', fontSize: '1.5rem', cursor: 'pointer' }}>+</button>
                        </div>
                    </LockedSection>
                )}

                {/* MY PROFILE (Personal info for all) */}
                <div style={{ background: 'var(--surface)', padding: '30px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', color: 'var(--primary)' }}>👤 Mi Información</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px solid #eee' }}>
                                {currentUser.photoURL ? (
                                    <img src={currentUser.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '1.5rem', fontWeight: 800, opacity: 0.2 }}>{currentUser.initials}</span>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file'; input.accept = 'image/*';
                                    input.onchange = async (e: any) => {
                                        if (e.target.files[0]) {
                                            const file = e.target.files[0];
                                            const compressed = await compressImage(file);
                                            await setDoc(doc(db, 'users', currentUser.id), { ...currentUser, photoURL: compressed }, { merge: true });
                                            alert('Foto de perfil actualizada ✨');
                                        }
                                    };
                                    input.click();
                                }}
                                style={{ background: 'var(--bg)', color: 'var(--primary)', border: '1px solid rgba(0,0,0,0.1)', padding: '8px 15px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}
                            >Cambiar Foto</button>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '5px', display: 'block' }}>Nombre Completo</label>
                            <input
                                type="text"
                                defaultValue={currentUser.name}
                                onBlur={async (e) => {
                                    const val = e.target.value.trim();
                                    if (val) await setDoc(doc(db, 'users', currentUser.id), { ...currentUser, name: val }, { merge: true });
                                }}
                                style={{ width: '100%', borderRadius: '12px', padding: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--bg)' }}
                            />
                        </div>
                    </div>
                </div>

                {/* TEAM SECTION (Admins only) */}
                {currentUser.role === 'admin' && (
                    <LockedSection title="👥 Mi Equipo">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {users.filter(u => u.role !== 'customer').map(u => (
                                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '12px 18px', borderRadius: '15px' }}>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{u.name}</p>
                                        <p style={{ fontSize: '0.7rem', opacity: 0.6, margin: 0 }}>{u.role}</p>
                                    </div>
                                    {u.id !== 'master' && <button onClick={() => deleteDoc(doc(db, 'users', u.id))} style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '0.7rem' }}>Eliminar</button>}
                                </div>
                            ))}
                            <div style={{ marginTop: '15px', background: 'var(--bg)', padding: '15px', borderRadius: '15px', border: '1px dashed rgba(0,0,0,0.1)' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '10px', color: 'var(--primary)' }}>🔗 Invitar por Link</p>
                                <p style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '12px', lineHeight: 1.5 }}>
                                    Genera un link único de invitación. Quien lo abra e ingrese con Google quedará automáticamente como <strong>Socio DELVA</strong>. El link se usa una sola vez.
                                </p>
                                <button
                                    onClick={async () => {
                                        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
                                        try {
                                            await setDoc(doc(db, 'invites', code), {
                                                code,
                                                createdBy: currentUser.id,
                                                createdAt: new Date().toISOString(),
                                                role: 'colaborador'
                                            });
                                        } catch (e) { console.error('Invite save error:', e); }
                                        const link = `${window.location.origin}?invite=${code}`;
                                        setGeneratedInviteLink(link);
                                        setInviteCopied(false);
                                    }}
                                    style={{ width: '100%', background: 'var(--primary)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                >✨ Generar Link</button>

                                {generatedInviteLink && (
                                    <div style={{ marginTop: '12px' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'white', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', padding: '10px 12px' }}>
                                            <span style={{ flex: 1, fontSize: '0.65rem', wordBreak: 'break-all', color: 'var(--primary)', fontWeight: 600, fontFamily: 'monospace' }}>{generatedInviteLink}</span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(generatedInviteLink);
                                                    setInviteCopied(true);
                                                    setTimeout(() => setInviteCopied(false), 2000);
                                                }}
                                                style={{ background: inviteCopied ? '#4CAF50' : 'var(--primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s' }}
                                            >{inviteCopied ? '✓ Copiado' : 'Copiar'}</button>
                                        </div>
                                        <p style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '6px', textAlign: 'center' }}>⚠️ De un solo uso — expira cuando alguien lo usa</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </LockedSection>
                )}
            </div>
        </div>
    );
};

export default AdminDashboardView;
