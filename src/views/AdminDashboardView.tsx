import React, { useState } from 'react';
import { doc, deleteDoc, setDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import type { Product } from '../data/products';
import { type User } from '../App';
import { useNavigate } from 'react-router-dom';

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
    confirmAction: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
    alertAction: (title: string, message: string) => void;
}

const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
    currentUser, products, users, banners, exportDB,
    globalBrandName, setGlobalBrandName, globalPrimaryColor, setGlobalPrimaryColor,
    globalFont, setGlobalFont, globalWaNumber, setGlobalWaNumber, globalGridCols, setGlobalGridCols,
    globalLogo, setGlobalLogo, globalFavicon, globalMetaDesc, setGlobalMetaDesc,
    globalKeywords, setGlobalKeywords, globalSocialLinks, setGlobalSocialLinks,
    globalTags, setGlobalTags, globalCategories, setGlobalCategories,
    handleLogoUpload, handleFaviconUpload, saveSettings, compressImage, setEditingProduct,
    SOCIAL_ICONS, logout, confirmAction, alertAction
}) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'inventory' | 'sales' | 'branding'>(currentUser?.id === 'master' ? 'branding' : 'inventory');
    const [onboardingStep, setOnboardingStep] = useState(currentUser?.storeName ? 0 : 1);

    // Onboarding Temps
    const [tempStoreName, setTempStoreName] = useState('');
    const [tempStoreLogo, setTempStoreLogo] = useState('');

    if (!currentUser) return <div className="container" style={{ padding: '100px 0', textAlign: 'center', minHeight: '80vh' }}><h2>Debes iniciar sesión</h2></div>;

    const isSeller = currentUser.role === 'admin' || currentUser.role === 'colaborador';

    // --- ONBOARDING FLOW ---
    if (isSeller && onboardingStep > 0 && currentUser.id !== 'master') {
        return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(26, 60, 52, 0.98)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '20px' }}>
                <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                    {onboardingStep === 1 && (
                        <div className="fade-in">
                            <span style={{ fontSize: '3rem' }}>🌿</span>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '10px' }}>¡Bienvenido a DELVA!</h2>
                            <p style={{ opacity: 0.8, marginBottom: '30px' }}>Empecemos por lo básico. ¿Cómo se llama tu negocio?</p>
                            <input
                                type="text"
                                placeholder="Nombre de tu marca..."
                                value={tempStoreName}
                                onChange={e => setTempStoreName(e.target.value)}
                                style={{ width: '100%', padding: '18px', borderRadius: '20px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '1.1rem', fontWeight: 700, textAlign: 'center', marginBottom: '20px' }}
                            />
                            <button
                                onClick={() => tempStoreName && setOnboardingStep(2)}
                                className="btn-vibrant btn-pulse-gold"
                                style={{ width: '100%', padding: '18px', borderRadius: '20px' }}
                            >
                                CONTINUAR ➔
                            </button>
                        </div>
                    )}
                    {onboardingStep === 2 && (
                        <div className="fade-in">
                            <span style={{ fontSize: '3rem' }}>🎨</span>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '10px' }}>Tu Identidad</h2>
                            <p style={{ opacity: 0.8, marginBottom: '30px' }}>Sube el logo de {tempStoreName}. Si no tienes uno, lo haremos después.</p>
                            <div
                                onClick={() => document.getElementById('onboardingLogo')?.click()}
                                style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', margin: '0 auto 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', border: '2px dashed rgba(255,255,255,0.3)' }}
                            >
                                {tempStoreLogo ? <img src={tempStoreLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2rem' }}>📷</span>}
                            </div>
                            <input id="onboardingLogo" type="file" hidden onChange={async e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const base64 = await compressImage(file);
                                    setTempStoreLogo(base64);
                                }
                            }} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setOnboardingStep(3)} style={{ flex: 1, padding: '15px', borderRadius: '15px', background: 'transparent', color: 'white', border: '1px solid white' }}>OMITIR</button>
                                <button onClick={() => setOnboardingStep(3)} className="btn-vibrant" style={{ flex: 2, padding: '15px', borderRadius: '15px' }}>LISTO ✨</button>
                            </div>
                        </div>
                    )}
                    {onboardingStep === 3 && (
                        <div className="fade-in">
                            <span style={{ fontSize: '3rem' }}>🚀</span>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '10px' }}>¡Todo listo!</h2>
                            <p style={{ opacity: 0.8, marginBottom: '30px' }}>Tu tienda en la Selva está lista para recibir clientes.</p>
                            <button
                                onClick={async () => {
                                    await setDoc(doc(db, 'users', currentUser.id), {
                                        ...currentUser,
                                        storeName: tempStoreName,
                                        storeLogo: tempStoreLogo,
                                        isPremium: false,
                                        themeId: 'fashion-minimal'
                                    }, { merge: true });
                                    setOnboardingStep(0);
                                }}
                                className="btn-vibrant btn-pulse-gold"
                                style={{ width: '100%', padding: '18px', borderRadius: '20px' }}
                            >
                                ENTRAR A MI PANEL 🌿
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const [generatedInviteLink, setGeneratedInviteLink] = useState<string>('');
    const [inviteCopied, setInviteCopied] = useState(false);

    const isMaster = currentUser?.id === 'master';

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

    const storeOwnerId = currentUser.parentStoreId || currentUser.id;
    const storeProducts = products.filter(p => p.userId === storeOwnerId);

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <section style={{ background: 'var(--primary)', borderRadius: 'var(--radius-lg)', padding: '30px', margin: '20px 0', color: 'white', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '5px' }}>{isSeller ? '🌿 Panel de Gestión' : '👤 Mi Cuenta'}</h2>
                        <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                            Hola, {currentUser.name}.
                            Tu nivel: <span style={{ fontWeight: 800, color: 'var(--accent)' }}>
                                {currentUser.id === 'master' ? '👑 DELVA MASTER' : (currentUser.role === 'admin' ? '🏪 SOCIO (Dueño)' : (currentUser.role === 'colaborador' ? '👥 COLABORADOR' : '👤 CLIENTE'))}
                            </span>
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        {isSeller && (
                            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '15px' }}>
                                <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.6 }}>Productos</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: 800 }}>{storeProducts.length}</p>
                            </div>
                        )}
                        {currentUser.id === 'master' && <button onClick={exportDB} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Backup DB</button>}
                        <button onClick={logout} style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Cerrar Sesión 🚪</button>
                    </div>
                </div>

                {/* TABS SELECTOR */}
                {isSeller && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '30px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '18px' }}>
                        <button onClick={() => setActiveTab('inventory')} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: activeTab === 'inventory' ? 'white' : 'transparent', color: activeTab === 'inventory' ? 'var(--primary)' : 'white', fontWeight: 900, transition: '0.3s' }}>
                            📦 INVENTARIO
                        </button>
                        <button onClick={() => setActiveTab('sales')} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: activeTab === 'sales' ? 'white' : 'transparent', color: activeTab === 'sales' ? 'var(--primary)' : 'white', fontWeight: 900, transition: '0.3s' }}>
                            📈 VENTAS & HYPE
                        </button>
                        {currentUser.id === 'master' && (
                            <button onClick={() => setActiveTab('branding')} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: activeTab === 'branding' ? 'white' : 'transparent', color: activeTab === 'branding' ? 'var(--primary)' : 'white', fontWeight: 900, transition: '0.3s' }}>
                                🛠️ GLOBAL
                            </button>
                        )}
                    </div>
                )}
            </section>

            {/* SALES & HYPE DASHBOARD */}
            {activeTab === 'sales' && (
                <div style={{ marginBottom: '40px' }} className="fade-in">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        <div style={{ background: 'white', padding: '25px', borderRadius: '24px', boxShadow: '0 5px 15px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5, margin: 0 }}>CURIOSOS (HYPE)</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 900, margin: '10px 0', color: '#ff5722' }}>+120</h3>
                            <p style={{ fontSize: '0.65rem', color: '#2E7D32', fontWeight: 800 }}>⚡ ¡Tu tienda está que quema!</p>
                        </div>
                        <div style={{ background: 'white', padding: '25px', borderRadius: '24px', boxShadow: '0 5px 15px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5, margin: 0 }}>PEDIDOS WHATSAPP</p>
                            <h3 style={{ fontSize: '2rem', fontWeight: 900, margin: '10px 0' }}>{Math.floor(Math.random() * 10)}</h3>
                            <p style={{ fontSize: '0.65rem', color: '#666' }}>Últimos 7 días</p>
                        </div>
                    </div>

                    <div style={{ background: '#FFF8E1', padding: '20px', borderRadius: '20px', border: '1px solid #FFECB3', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontSize: '1.5rem' }}>📢</span>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 900, color: '#FF8F00' }}>Tip de Crecimiento</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#8D6E63' }}>Tus "Lentes Pro" tienen el Hype más alto. ¡Publícalos en tus Historias!</p>
                        </div>
                    </div>
                </div>
            )}

            {/* INVENTORY TAB */}
            {activeTab === 'inventory' && (
                <div className="fade-in">
                    {/* STORE OWNER SECTION (Only if not Master Admin) */}
                    {currentUser?.id !== 'master' && (
                        <div style={{ background: 'linear-gradient(135deg, #1A3C34, #2E7D32)', borderRadius: '24px', padding: '25px', marginBottom: '30px', color: 'white', boxShadow: '0 10px 30px rgba(26, 60, 52, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>Mi Tienda Digital 🌿</h2>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: '5px 0 0' }}>Gestiona tu catálogo y comparte tu link</p>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 900 }}>
                                    PLAN: {currentUser?.isPremium ? 'PREMIUM ✨' : 'BÁSICO (0/10)'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => {
                                        const link = `${window.location.origin}/tienda?u=${currentUser?.id}`;
                                        navigator.clipboard.writeText(link);
                                        alertAction('Link Copiado', '¡Link de tu tienda copiado! 🚀 Compártelo con tus clientes.');
                                    }}
                                    className="btn-share"
                                    style={{ flex: 1, minWidth: '160px', justifyContent: 'center' }}
                                >
                                    🔗 Copiar Link de Tienda
                                </button>
                                <button
                                    onClick={() => navigate(`/tienda?u=${currentUser?.id}&viewAsGuest=true`)}
                                    style={{ flex: 1, minWidth: '160px', padding: '12px', borderRadius: '15px', border: '1px solid white', background: 'transparent', color: 'white', fontWeight: 900, cursor: 'pointer' }}
                                >
                                    👁️ Ver Vista Cliente
                                </button>
                                <button
                                    onClick={() => {
                                        confirmAction('Reiniciar Marca', '¿Seguro que quieres cambiar tu marca? Volverás al inicio de configuración.', () => {
                                            setOnboardingStep(1);
                                        });
                                    }}
                                    style={{ flex: 1, minWidth: '160px', padding: '12px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                                >
                                    🔄 Rebranding / Reiniciar
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                        {/* PRODUCT MANAGEMENT */}
                        <LockedSection title="📝 Mis Productos">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>Gestiona lo que vendes</p>
                                <button onClick={() => setEditingProduct({ title: '', price: '', categoryId: globalCategories[1]?.id || 'varios', image: '', gallery: [], colors: [], tags: [] })} style={{ background: 'var(--accent)', color: 'var(--primary)', border: 'none', padding: '8px 15px', borderRadius: '20px', fontWeight: 800, fontSize: '0.75rem' }}>+ Nuevo</button>
                            </div>
                            <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }} className="gallery-scroll">
                                {storeProducts.length === 0 ? (
                                    <p style={{ fontSize: '0.8rem', textAlign: 'center', padding: '20px', opacity: 0.5 }}>Aún no has subido productos.</p>
                                ) : (
                                    storeProducts.map(p => (
                                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg)', padding: '10px', borderRadius: '15px' }}>
                                            <img src={p.image} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>{p.title}</p>
                                                <p style={{ fontSize: '0.7rem', opacity: 0.6, margin: 0 }}>S/ {Number(p.price).toFixed(2)}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => setEditingProduct(p)} style={{ background: 'transparent', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 700 }}>✏️</button>
                                                <button
                                                    onClick={() => {
                                                        confirmAction('Borrar Producto', `¿Seguro que quieres eliminar ${p.title}?`, () => {
                                                            deleteDoc(doc(db, 'products', p.id));
                                                        });
                                                    }}
                                                    style={{ background: 'transparent', color: 'var(--danger)', fontSize: '0.7rem', fontWeight: 700 }}
                                                >🗑️</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </LockedSection>

                        {/* TAGS & CATEGORIES (MASTER ONLY) */}
                        {currentUser.id === 'master' && (
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
                        )}

                        {/* BANNERS MANAGEMENT (MASTER ONLY) */}
                        {currentUser.id === 'master' && (
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
                                                    console.log("Iniciando subida de banner...");
                                                    try {
                                                        const compressed = await compressImage(file);
                                                        const id = Date.now().toString();

                                                        // Subir a Storage
                                                        console.log("Subiendo banner a Storage...");
                                                        const storageRef = ref(storage, `banners/${id}.jpg`);
                                                        await uploadString(storageRef, compressed, 'data_url');
                                                        const downloadURL = await getDownloadURL(storageRef);

                                                        const title = prompt('Título del banner (opcional):') || '';
                                                        console.log("Guardando referencia del banner en Firestore...");
                                                        await setDoc(doc(db, 'banners', id), { id, image: downloadURL, title });
                                                        console.log("Banner subido con éxito ✨");
                                                        alertAction('¡Éxito!', 'Banner subido correctamente.');
                                                    } catch (e: any) {
                                                        console.error('--- ERROR EN BANNER ---');
                                                        console.error(e);
                                                        let msg = e.message;
                                                        if (msg.includes('CORS')) msg += "\n\nTip: Revisa la configuración CORS en Google Cloud Console.";
                                                        alertAction('Error de Banner', `No se pudo subir el banner. ${msg}`);
                                                    }
                                                }
                                            };
                                            input.click();
                                        }}
                                        style={{ width: '80px', height: '80px', borderRadius: '12px', border: '1.5px dashed rgba(0,0,0,0.1)', background: 'var(--bg)', fontSize: '1.5rem', cursor: 'pointer' }}>+</button>
                                </div>
                            </LockedSection>
                        )}

                        {/* MY PROFILE */}
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
                                                    alertAction('Foto Actualizada', 'Tu foto de perfil ha sido actualizada ✨');
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
                                <p style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '15px' }}>Colaboradores que gestionan {currentUser.storeName || 'esta tienda'}.</p>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                                    <button
                                        onClick={async () => {
                                            const email = prompt('Correo del colaborador:');
                                            const name = prompt('Nombre:');
                                            const password = prompt('Contraseña temporal:') || '';
                                            if (email && name) {
                                                const id = 'user_' + Math.random().toString(36).substring(2, 9);
                                                try {
                                                    await setDoc(doc(db, 'users', id), {
                                                        id, name, email, role: 'colaborador', password,
                                                        parentStoreId: currentUser.id,
                                                        storeName: currentUser.storeName || '',
                                                        storeLogo: currentUser.storeLogo || '',
                                                        initials: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2),
                                                        createdAt: new Date().toISOString()
                                                    });
                                                    alertAction('¡Éxito!', '¡Colaborador añadido con éxito! 👥');
                                                } catch (e: any) {
                                                    console.error('Add collab error:', e);
                                                    alertAction('Error', `No se pudo añadir al colaborador. ${e.message}`);
                                                }
                                            }
                                        }}
                                        style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                                    >+ Añadir Colaborador</button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {users.filter(u => u.parentStoreId === currentUser.id).length === 0 ? (
                                        <p style={{ fontSize: '0.7rem', opacity: 0.4, textAlign: 'center', padding: '15px' }}>Ouch, aún no tienes colaboradores en tu equipo.</p>
                                    ) : (
                                        users.filter(u => u.parentStoreId === currentUser.id).map(u => (
                                            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '12px 18px', borderRadius: '15px', border: '1px solid rgba(0,0,0,0.03)' }}>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>{u.initials}</div>
                                                    <div>
                                                        <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>{u.name}</p>
                                                        <p style={{ fontSize: '0.65rem', opacity: 0.6, margin: 0 }}>COLABORADOR • {u.email || 'Acceso Directo'}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        confirmAction('Quitar Miembro', `¿Quitar a ${u.name} del equipo?`, () => {
                                                            setDoc(doc(db, 'users', u.id), { role: 'customer', parentStoreId: '' }, { merge: true });
                                                        });
                                                    }}
                                                    style={{ color: 'var(--danger)', fontSize: '0.7rem', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}
                                                >QUITAR</button>
                                            </div>
                                        ))
                                    )}
                                    <div style={{ marginTop: '15px', background: 'var(--bg)', padding: '15px', borderRadius: '15px', border: '1px dashed rgba(0,0,0,0.1)' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '10px', color: 'var(--primary)' }}>🔗 Invitar por Link</p>
                                        <button
                                            onClick={async () => {
                                                const code = Math.random().toString(36).substring(2, 10).toUpperCase();
                                                try {
                                                    await setDoc(doc(db, 'invites', code), {
                                                        code,
                                                        createdBy: currentUser.id,
                                                        parentStoreId: currentUser.id, // The store they will join
                                                        parentStoreName: currentUser.storeName,
                                                        parentStoreLogo: currentUser.storeLogo,
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
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </LockedSection>
                        )}
                    </div>
                </div>
            )}

            {/* BRANDING TAB (MASTER ONLY) */}
            {activeTab === 'branding' && currentUser.id === 'master' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }} className="fade-in">
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

                    {/* USER MANAGEMENT (MASTER ONLY) */}
                    <LockedSection title="👥 Gestión de Usuarios">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>Control total de la plataforma</p>
                            <button
                                onClick={async () => {
                                    const email = prompt('Correo del nuevo usuario:');
                                    const name = prompt('Nombre del nuevo usuario:');
                                    const roleInput = prompt('Rol (admin/colaborador/customer):', 'customer');
                                    if (email && name && roleInput) {
                                        const id = 'user_' + Math.random().toString(36).substring(2, 9);
                                        const role = roleInput as 'admin' | 'colaborador' | 'customer';
                                        const password = prompt('Contraseña (opcional):') || '';
                                        try {
                                            await setDoc(doc(db, 'users', id), {
                                                id, name, email, role, password,
                                                initials: name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
                                                createdAt: new Date().toISOString()
                                            });
                                            alertAction('Usuario Creado', 'Usuario creado con éxito ✨');
                                        } catch (e: any) {
                                            console.error('Create user error:', e);
                                            alertAction('Error', `No se pudo crear el usuario. ${e.message}`);
                                        }
                                    }
                                }}
                                style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '20px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
                            >+ Crear Usuario</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }} className="gallery-scroll">
                            {users.map(u => (
                                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '12px 18px', borderRadius: '15px', border: '1px solid rgba(0,0,0,0.03)' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 900, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', color: 'var(--primary)' }}>{u.initials}</div>
                                        <div>
                                            <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>{u.name}</p>
                                            <p style={{ fontSize: '0.65rem', opacity: 0.6, margin: 0 }}>{u.role.toUpperCase()} • {u.email || 'Acceso Directo'}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <select
                                            value={u.role}
                                            onChange={(e) => setDoc(doc(db, 'users', u.id), { role: e.target.value }, { merge: true })}
                                            style={{ fontSize: '0.65rem', padding: '6px 10px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontWeight: 700 }}
                                        >
                                            <option value="admin">Socio (Dueño)</option>
                                            <option value="colaborador">Colaborador</option>
                                            <option value="customer">Cliente</option>
                                        </select>
                                        {u.id !== 'master' && (
                                            <>
                                                <button
                                                    onClick={() => setDoc(doc(db, 'users', u.id), { status: u.status === 'blocked' ? 'active' : 'blocked' }, { merge: true })}
                                                    style={{ color: u.status === 'blocked' ? '#4CAF50' : '#FF9800', fontSize: '0.65rem', fontWeight: 800, background: 'none', cursor: 'pointer' }}
                                                >
                                                    {u.status === 'blocked' ? '✅ ACTIVAR' : '🚫 BLOQUEAR'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        confirmAction('Eliminar Usuario', `¿ELIMINAR COMPLETAMENTE a ${u.name}? Esta acción es irreversible.`, () => {
                                                            deleteDoc(doc(db, 'users', u.id));
                                                        }, 'ELIMINAR', 'Cancelar');
                                                    }}
                                                    style={{ color: 'var(--danger)', fontSize: '0.7rem', fontWeight: 800, background: 'none', cursor: 'pointer' }}
                                                >ELIMINAR</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </LockedSection>

                    {/* SEO & WEB IDENTITY (MASTER ONLY) */}
                    {isMaster && (
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
                    )}

                    {/* SOCIAL LINKS (MASTER ONLY) */}
                    {isMaster && (
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
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboardView;
