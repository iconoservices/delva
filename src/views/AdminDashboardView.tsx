import React, { useState, useEffect } from 'react';
import { doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Product } from '../data/products';
import { type User } from '../App';
import { useNavigate } from 'react-router-dom';

interface AdminDashboardViewProps {
    currentUser: User;
    products: Product[];
    users: User[];
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

const AdminDashboardView: React.FC<Omit<AdminDashboardViewProps, 'banners'>> = ({
    currentUser, products, users, exportDB,
    globalBrandName, setGlobalBrandName, globalPrimaryColor, setGlobalPrimaryColor,
    globalFont, setGlobalFont, globalWaNumber, setGlobalWaNumber, globalGridCols, setGlobalGridCols,
    globalLogo, globalFavicon, globalMetaDesc, setGlobalMetaDesc,
    globalKeywords, setGlobalKeywords, globalSocialLinks, setGlobalSocialLinks,
    globalTags, setGlobalTags, globalCategories,
    handleLogoUpload, handleFaviconUpload, saveSettings, compressImage, setEditingProduct,
    SOCIAL_ICONS, logout, confirmAction, alertAction
}) => {
    const navigate = useNavigate();

    // 1. DETERMINAR EL NIVEL DE ACCESO
    const role = currentUser.role || 'customer';
    const isMaster = role === 'master';
    const isSocio = role === 'socio';
    const isColaborador = role === 'colaborador';
    const isCustomer = role === 'customer';

    // 2. ESTADO DE TABS
    // Si es master, tiene acceso al "Master Panel" por defecto o a una de sus sub-pestañas
    const [activeTab, setActiveTab] = useState<'inventory' | 'sales' | 'branding' | 'team' | 'master_panel'>(
        isMaster ? 'master_panel' : 'inventory'
    );

    // Sub-pestañas para el Master Panel
    const [masterSubTab, setMasterSubTab] = useState<'analytics' | 'users' | 'invites' | 'shadow'>('analytics');

    // 3. BLOQUEO DINÁMICO DE RUTAS INTERNAS
    useEffect(() => {
        if (!isMaster && activeTab === 'master_panel') {
            setActiveTab('inventory');
        }
        if (isColaborador && (activeTab === 'branding' || activeTab === 'team')) {
            setActiveTab('inventory');
        }
    }, [activeTab, isMaster, isColaborador]);

    // 4. ESTADO PARA MASTER (Shadow Mode / Selector de Tienda)
    const [selectedStoreId, setSelectedStoreId] = useState(currentUser.id);

    // 5. FLUJO DE ONBOARDING (Socio solamente)
    const [onboardingStep, setOnboardingStep] = useState((isSocio && !currentUser.storeName) ? 1 : 0);
    const [tempStoreName, setTempStoreName] = useState('');
    const [tempStoreLogo, setTempStoreLogo] = useState('');

    const [generatedInviteLink, setGeneratedInviteLink] = useState<string>('');
    const [inviteCopied, setInviteCopied] = useState(false);

    // --- NUEVOS ESTADOS PARA GESTIÓN MASTER ---
    const [userSearch, setUserSearch] = useState('');
    const [userFilter, setUserFilter] = useState<'all' | 'socio' | 'customer' | 'colaborador'>('all');
    const [securityModal, setSecurityModal] = useState<{ show: boolean, title: string, message: string, action: () => void } | null>(null);

    // --- RECOPILACIÓN DE PRODUCTOS ---
    const effectiveStoreId = (isMaster && activeTab !== 'master_panel') ? selectedStoreId : (currentUser.parentStoreId || currentUser.id);
    const storeProducts = products.filter(p => p.userId === effectiveStoreId || (effectiveStoreId === 'master' && !p.userId));

    // --- VISTA LEVEL 4: CUSTOMER (UPSELL) ---
    if (isCustomer) {
        return (
            <div className="container fade-in" style={{ padding: '60px 20px 40px', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

                {/* Saludo personal + Cerrar sesión */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '28px', width: '100%', maxWidth: '520px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)', border: '2px solid white', boxShadow: 'var(--shadow-sm)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {currentUser.photoURL
                                ? <img src={currentUser.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" />
                                : <span style={{ color: 'white', fontWeight: 900, fontSize: '1rem' }}>{currentUser.initials}</span>
                            }
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <p style={{ fontSize: '0.6rem', opacity: 0.4, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Hola 👋</p>
                            <p style={{ fontSize: '0.95rem', fontWeight: 900, margin: 0, color: 'var(--primary)' }}>{currentUser.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        style={{ background: 'transparent', color: 'rgba(0,0,0,0.35)', border: '1px solid rgba(0,0,0,0.1)', padding: '7px 14px', borderRadius: '20px', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                    >
                        Salir 🚪
                    </button>
                </div>

                {/* Card de Upsell */}
                <div style={{ background: 'white', padding: '50px 30px 40px', borderRadius: '40px', boxShadow: 'var(--shadow-lg)', maxWidth: '520px', width: '100%', border: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: '3.5rem', marginBottom: '15px', display: 'block' }}>🏪</span>
                    <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '12px', lineHeight: 1.2 }}>¡Crea tu propia tienda!</h2>
                    <p style={{ fontSize: '1rem', opacity: 0.65, marginBottom: '30px', lineHeight: 1.7 }}>
                        Esta función es exclusiva para <b>Socios DELVA</b>.<br />
                        Sube productos, personaliza tu marca y llega a miles de clientes en la selva.
                    </p>
                    <button
                        onClick={() => window.open(`https://wa.me/${globalWaNumber}?text=Hola,%20soy%20${currentUser.name}%20y%20quiero%20abrir%20mi%20tienda%20en%20DELVA`, '_blank')}
                        className="btn-vibrant"
                        style={{ width: '100%', padding: '18px', borderRadius: '22px', fontSize: '1rem', marginBottom: '12px' }}
                    >
                        PEDIR ACCESO DE SOCIO 🚀
                    </button>
                    <button onClick={() => navigate('/')} style={{ width: '100%', padding: '14px', background: 'transparent', color: 'var(--primary)', border: '1.5px solid rgba(15,48,37,0.15)', borderRadius: '18px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>
                        Volver al Marketplace 🌿
                    </button>
                </div>

                {/* Cerrar sesión — sutil, en la parte de abajo */}
                <button
                    onClick={logout}
                    style={{ marginTop: '24px', background: 'transparent', color: 'rgba(0,0,0,0.28)', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem', letterSpacing: '0.5px' }}
                >
                    Cerrar sesión
                </button>
            </div>
        );
    }

    // --- ONBOARDING UI (Solo Socio) ---
    if (isSocio && onboardingStep > 0) {
        return (/* ... onboarding code ... */
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
                            <button onClick={() => tempStoreName && setOnboardingStep(2)} className="btn-vibrant btn-pulse-gold" style={{ width: '100%', padding: '18px', borderRadius: '20px' }}>CONTINUAR ➔</button>
                        </div>
                    )}
                    {onboardingStep === 2 && (
                        <div className="fade-in">
                            <span style={{ fontSize: '3rem' }}>🎨</span>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '10px' }}>Tu Identidad</h2>
                            <p style={{ opacity: 0.8, marginBottom: '30px' }}>Sube el logo de {tempStoreName}.</p>
                            <div onClick={() => document.getElementById('onboardingLogo')?.click()} style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', margin: '0 auto 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', border: '2px dashed rgba(255,255,255,0.3)' }}>
                                {tempStoreLogo ? <img src={tempStoreLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="logo" /> : <span style={{ fontSize: '2rem' }}>📷</span>}
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
                            <button onClick={async () => {
                                await setDoc(doc(db, 'users', currentUser.id), {
                                    storeName: tempStoreName,
                                    storeLogo: tempStoreLogo,
                                    isPremium: false,
                                    themeId: 'fashion-minimal',
                                    role: 'socio'
                                }, { merge: true });
                                setOnboardingStep(0);
                            }} className="btn-vibrant btn-pulse-gold" style={{ width: '100%', padding: '18px', borderRadius: '20px' }}>ENTRAR A MI PANEL 🌿</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- REUSABLE LOCKED SECTION ---
    const LockedSection = ({ title, children, socioOnly = false }: { title: string, children: React.ReactNode, socioOnly?: boolean }) => {
        const locked = socioOnly && isColaborador;
        return (
            <div style={{ position: 'relative', background: 'var(--surface)', padding: '30px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,0,0,0.05)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', color: 'var(--primary)', opacity: locked ? 0.3 : 1 }}>{title}</h3>
                <div style={{ opacity: locked ? 0.2 : 1, pointerEvents: locked ? 'none' : 'auto', filter: locked ? 'grayscale(1)' : 'none' }}>
                    {children}
                </div>
                {locked && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(3px)', padding: '20px', textAlign: 'center' }}>
                        <span style={{ fontSize: '1.5rem', marginBottom: '10px' }}>🔒 Solo Dueños</span>
                        <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Función Bloqueada</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            {/* HEADER DASHBOARD */}
            <section style={{ background: 'var(--primary)', borderRadius: 'var(--radius-lg)', padding: '30px', margin: '20px 0', color: 'white', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '5px' }}>{activeTab === 'master_panel' ? '👑 Centro de Comando Master' : '🌿 Panel de Gestión'}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.8 }}>
                            <p style={{ fontSize: '0.9rem', margin: 0 }}>Hola, {currentUser.name}. Rol: <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{role.toUpperCase()}</span></p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {isMaster && (
                            <button
                                onClick={() => setActiveTab(activeTab === 'master_panel' ? 'inventory' : 'master_panel')}
                                className="btn-vibrant"
                                style={{ background: activeTab === 'master_panel' ? 'var(--accent)' : 'rgba(255,255,255,0.1)', color: activeTab === 'master_panel' ? 'var(--primary)' : 'white', border: 'none', padding: '12px 20px', borderRadius: '30px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', boxShadow: activeTab === 'master_panel' ? '0 0 15px var(--accent)' : 'none' }}
                            >
                                {activeTab === 'master_panel' ? '🏠 IR A TIENDA' : '👑 MASTER PANEL'}
                            </button>
                        )}
                        <button onClick={logout} style={{ background: 'var(--danger)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Cerrar Sesión 🚪</button>
                    </div>
                </div>

                {/* TABS SELECTOR */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '30px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '18px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                    {activeTab !== 'master_panel' ? (
                        <>
                            <button onClick={() => setActiveTab('inventory')} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: activeTab === 'inventory' ? 'white' : 'transparent', color: activeTab === 'inventory' ? 'var(--primary)' : 'white', fontWeight: 900, transition: '0.3s', fontSize: '0.65rem' }}>📦 PRODUCTOS</button>
                            <button onClick={() => setActiveTab('sales')} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: activeTab === 'sales' ? 'white' : 'transparent', color: activeTab === 'sales' ? 'var(--primary)' : 'white', fontWeight: 900, transition: '0.3s', fontSize: '0.65rem' }}>📈 VENTAS</button>
                            {(isSocio || isMaster) && (
                                <>
                                    <button onClick={() => setActiveTab('branding')} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: activeTab === 'branding' ? 'white' : 'transparent', color: activeTab === 'branding' ? 'var(--primary)' : 'white', fontWeight: 900, transition: '0.3s', fontSize: '0.65rem' }}>🎨 MARCA</button>
                                    <button onClick={() => setActiveTab('team')} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: activeTab === 'team' ? 'white' : 'transparent', color: activeTab === 'team' ? 'var(--primary)' : 'white', fontWeight: 900, transition: '0.3s', fontSize: '0.65rem' }}>👥 EQUIPO</button>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <button onClick={() => setMasterSubTab('analytics')} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: masterSubTab === 'analytics' ? 'white' : 'transparent', color: masterSubTab === 'analytics' ? 'var(--primary)' : 'white', fontWeight: 900, transition: '0.3s', fontSize: '0.65rem' }}>📊 ANALYTICS</button>
                            <button onClick={() => setMasterSubTab('users')} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: masterSubTab === 'users' ? 'white' : 'transparent', color: masterSubTab === 'users' ? 'var(--primary)' : 'white', fontWeight: 900, transition: '0.3s', fontSize: '0.65rem' }}>👤 USUARIOS</button>
                            <button onClick={() => setMasterSubTab('invites')} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: masterSubTab === 'invites' ? 'white' : 'transparent', color: masterSubTab === 'invites' ? 'var(--primary)' : 'white', fontWeight: 900, transition: '0.3s', fontSize: '0.65rem' }}>🎫 INVITACIONES</button>
                            <button onClick={() => setMasterSubTab('shadow')} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: 'none', background: masterSubTab === 'shadow' ? 'white' : 'transparent', color: masterSubTab === 'shadow' ? 'var(--primary)' : 'white', fontWeight: 900, transition: '0.3s', fontSize: '0.65rem' }}>🕵️ SHADOW MODE</button>
                        </>
                    )}
                </div>
            </section>

            {/* CONTENIDO MASTER PANEL */}
            {activeTab === 'master_panel' && (
                <div className="fade-in">
                    {masterSubTab === 'analytics' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                            <div style={{ background: 'white', padding: '30px', borderRadius: '30px', boxShadow: 'var(--shadow-sm)' }}>
                                <p style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 800 }}>TOTAL USUARIOS</p>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '10px 0', color: 'var(--primary)' }}>{users.length}</h3>
                                <p style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 800 }}>+12% este mes</p>
                            </div>
                            <div style={{ background: 'white', padding: '30px', borderRadius: '30px', boxShadow: 'var(--shadow-sm)' }}>
                                <p style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 800 }}>SOCIOS ACTIVOS</p>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '10px 0', color: '#673ab7' }}>{users.filter(u => u.role === 'socio').length}</h3>
                                <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>De {users.filter(u => u.role === 'customer').length} prospectos</p>
                            </div>
                            <div style={{ background: 'white', padding: '30px', borderRadius: '30px', boxShadow: 'var(--shadow-sm)' }}>
                                <p style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 800 }}>CATÁLOGO GLOBAL</p>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '10px 0', color: '#ff9800' }}>{products.length}</h3>
                                <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>Productos publicados</p>
                            </div>
                        </div>
                    )}

                    {masterSubTab === 'users' && (
                        <div style={{ background: 'white', borderRadius: '30px', padding: '30px', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>Gestión de la Comunidad</h3>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input
                                        type="text"
                                        placeholder="🔍 Buscar por nombre o email..."
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        style={{ padding: '10px 20px', borderRadius: '15px', border: '1px solid #eee', fontSize: '0.8rem', width: '250px', margin: 0 }}
                                    />
                                    <div style={{ display: 'flex', background: '#f5f5f5', padding: '5px', borderRadius: '12px', gap: '4px', flexWrap: 'wrap' }}>
                                        {[
                                            { key: 'all', label: 'TODOS', emoji: '🌐' },
                                            { key: 'socio', label: 'SOCIOS', emoji: '🏪' },
                                            { key: 'customer', label: 'CLIENTES', emoji: '🛒' },
                                            { key: 'colaborador', label: 'COLABS', emoji: '👥' },
                                        ].map(f => (
                                            <button key={f.key} onClick={() => setUserFilter(f.key as any)} style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 800, background: userFilter === f.key ? 'white' : 'transparent', color: 'var(--primary)', boxShadow: userFilter === f.key ? '0 2px 5px rgba(0,0,0,0.08)' : 'none', transition: '0.2s' }}>{f.emoji} {f.label}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                    <thead style={{ background: 'var(--bg)', borderRadius: '15px' }}>
                                        <tr>
                                            <th style={{ padding: '15px', fontSize: '0.7rem' }}>USUARIO</th>
                                            <th style={{ padding: '15px', fontSize: '0.7rem' }}>ROL ACTUAL</th>
                                            <th style={{ padding: '15px', fontSize: '0.7rem' }}>ESTADO</th>
                                            <th style={{ padding: '15px', fontSize: '0.7rem' }}>ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.filter(u => {
                                            const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || (u.email || '').toLowerCase().includes(userSearch.toLowerCase());
                                            const matchesFilter = userFilter === 'all' ? true : u.role === userFilter;
                                            return matchesSearch && matchesFilter;
                                        }).map(u => (
                                            <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#eee', overflow: 'hidden' }}>
                                                            {u.photoURL ? <img src={u.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="profile" /> : <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{u.initials}</span>}
                                                        </div>
                                                        <div>
                                                            <p style={{ fontSize: '0.8rem', fontWeight: 800, margin: 0 }}>{u.name}</p>
                                                            <p style={{ fontSize: '0.65rem', opacity: 0.5, margin: 0 }}>{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    {/* Normalizar role legacy antes de mostrarlo  */}
                                                    {(() => {
                                                        const VALID_ROLES = ['customer', 'socio', 'colaborador', 'master'];
                                                        const normalizedRole = VALID_ROLES.includes(u.role) ? u.role : 'customer';
                                                        const ROLE_COLORS: Record<string, string> = {
                                                            master: '#6a1b9a', socio: '#1b5e20', colaborador: '#e65100', customer: '#0277bd'
                                                        };
                                                        return (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: ROLE_COLORS[normalizedRole], display: 'inline-block', flexShrink: 0 }} />
                                                                <select
                                                                    value={normalizedRole}
                                                                    onChange={(e) => {
                                                                        const newRole = e.target.value;
                                                                        setSecurityModal({
                                                                            show: true,
                                                                            title: '⚠️ Cambiar Rango',
                                                                            message: `¿Estás seguro de convertir a ${u.name} en ${newRole.toUpperCase()}? Este cambio afectará sus permisos de inmediato.`,
                                                                            action: async () => await setDoc(doc(db, 'users', u.id), { role: newRole }, { merge: true })
                                                                        });
                                                                    }}
                                                                    style={{ padding: '5px 10px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700, border: '1px solid #ddd', color: ROLE_COLORS[normalizedRole] }}
                                                                >
                                                                    <option value="customer">🛒 Cliente</option>
                                                                    <option value="socio">🏠 Socio</option>
                                                                    <option value="colaborador">👥 Colaborador</option>
                                                                    <option value="master">👑 Master</option>
                                                                </select>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <span style={{ padding: '4px 8px', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 900, background: u.status === 'blocked' ? '#ffebee' : '#e8f5e9', color: u.status === 'blocked' ? 'red' : 'green' }}>
                                                        {u.status === 'blocked' ? 'BLOQUEADO' : 'ACTIVO'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button
                                                            onClick={() => {
                                                                const isBlocking = u.status !== 'blocked';
                                                                setSecurityModal({
                                                                    show: true,
                                                                    title: isBlocking ? '🚫 Suspender Cuenta' : '🔓 Reactivar Cuenta',
                                                                    message: isBlocking ? `¿Bloquear acceso total para ${u.name}? No podrá entrar al Dashboard.` : `¿Restaurar acceso para ${u.name}?`,
                                                                    action: async () => await setDoc(doc(db, 'users', u.id), { status: isBlocking ? 'blocked' : 'active' }, { merge: true })
                                                                });
                                                            }}
                                                            style={{ padding: '5px 10px', borderRadius: '10px', background: 'transparent', border: '1px solid #ddd', fontSize: '0.7rem', cursor: 'pointer', color: u.status === 'blocked' ? 'var(--primary)' : 'var(--danger)' }}
                                                        >
                                                            {u.status === 'blocked' ? 'DESBLOQUEAR' : 'BLOQUEAR'}
                                                        </button>
                                                        <button onClick={() => { setSelectedStoreId(u.id); setActiveTab('inventory'); }} style={{ padding: '5px 10px', borderRadius: '10px', background: 'var(--primary)', color: 'white', border: 'none', fontSize: '0.7rem', cursor: 'pointer' }}>Shadow</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {masterSubTab === 'invites' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                            <div style={{ background: 'white', padding: '30px', borderRadius: '30px', boxShadow: 'var(--shadow-sm)' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '20px' }}>Generar Nueva Tienda 🎫</h3>
                                <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '25px' }}>Usa este generador para dar de alta a nuevos Socios (Dueños).</p>
                                <button
                                    onClick={async () => {
                                        const inviteId = Math.random().toString(36).substring(2, 11);
                                        await setDoc(doc(db, 'invites', inviteId), { id: inviteId, role: 'socio', createdAt: new Date().toISOString() });
                                        const link = `${window.location.origin}?invite=${inviteId}`;
                                        setGeneratedInviteLink(link);
                                        navigator.clipboard.writeText(link);
                                        setInviteCopied(true); setTimeout(() => setInviteCopied(false), 2000);
                                    }}
                                    className="btn-vibrant"
                                    style={{ width: '100%', padding: '18px', borderRadius: '20px' }}
                                >
                                    {inviteCopied ? '✅ LINK COPIADO' : '🔗 GENERAR LINK SOCIO'}
                                </button>
                                {generatedInviteLink && <p style={{ marginTop: '15px', fontSize: '0.65rem', color: 'var(--primary)', wordBreak: 'break-all' }}>{generatedInviteLink}</p>}
                            </div>
                        </div>
                    )}

                    {masterSubTab === 'shadow' && (
                        <div style={{ background: 'white', padding: '40px', borderRadius: '30px', textAlign: 'center' }}>
                            <span style={{ fontSize: '3rem' }}>🕵️</span>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginTop: '15px' }}>Shadow Mode</h3>
                            <p style={{ fontSize: '0.9rem', opacity: 0.6, maxWidth: '400px', margin: '10px auto 30px' }}>Selecciona una tienda para ver su panel exactamente como lo ve el socio.</p>
                            <select
                                value={selectedStoreId}
                                onChange={(e) => setSelectedStoreId(e.target.value)}
                                style={{ width: '100%', maxWidth: '300px', padding: '15px', borderRadius: '15px', border: '1px solid #ddd', fontSize: '1rem', fontWeight: 700 }}
                            >
                                <option value="master">Tienda DELVA Global</option>
                                {users.filter(u => u.role === 'socio').map(u => (
                                    <option key={u.id} value={u.id}>Store: {u.storeName || u.name}</option>
                                ))}
                            </select>
                            <div style={{ marginTop: '20px' }}>
                                <button onClick={() => setActiveTab('inventory')} className="btn-vibrant" style={{ padding: '15px 40px', borderRadius: '20px' }}>ENTRAR EN SOMBRA ➔</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* CONTENIDO NORMAL (VISTAS DE SOCIO/TIENDA) */}
            {activeTab !== 'master_panel' && (
                <div className="fade-in">
                    {/* Sección de Contexto de Tienda (Shadow Mode Info) */}
                    {isMaster && (
                        <div style={{ background: '#fff9c4', padding: '10px 20px', borderRadius: '15px', marginBottom: '20px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #fbc02d' }}>
                            <span>🕶️ MODO SOMBRA ACTIVO: {users.find(u => u.id === effectiveStoreId)?.storeName || 'Tienda Global'}</span>
                            <button onClick={() => setActiveTab('master_panel')} style={{ background: 'var(--primary)', color: 'white', padding: '5px 10px', borderRadius: '10px', border: 'none', fontSize: '0.65rem' }}>Salir</button>
                        </div>
                    )}

                    {/* TABS DE INVENTARIO / MARCA / EQUIPO (Igual que antes pero reactivos al effectiveStoreId) */}
                    {activeTab === 'inventory' && (
                        <div className="fade-in">
                            <div style={{ background: 'linear-gradient(135deg, #1A3C34, #2E7D32)', borderRadius: '24px', padding: '25px', marginBottom: '30px', color: 'white', boxShadow: '0 10px 30px rgba(26, 60, 52, 0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>{users.find(u => u.id === effectiveStoreId)?.storeName || 'Mi Tienda Digital'} 🌿</h2>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Gestiona el catálogo de esta unidad</p>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 900 }}>ID: {effectiveStoreId}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <button onClick={() => { const link = `${window.location.origin}/tienda?u=${effectiveStoreId}`; navigator.clipboard.writeText(link); alertAction('Link Copiado', 'Link copiado! 🚀'); }} className="btn-share" style={{ flex: 1, minWidth: '160px', justifyContent: 'center' }}>🔗 Link Tienda</button>
                                    <button onClick={() => navigate(`/tienda?u=${effectiveStoreId}&viewAsGuest=true`)} style={{ flex: 1, minWidth: '160px', padding: '12px', borderRadius: '15px', border: '1px solid white', background: 'transparent', color: 'white', fontWeight: 900, cursor: 'pointer' }}>👁️ Vista Cliente</button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                                <LockedSection title="📝 Gestión de Productos">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>Catálogo Actual</p>
                                        <button onClick={() => setEditingProduct({ title: '', price: '', categoryId: globalCategories[1]?.id || 'varios', image: '', gallery: [], colors: [], tags: [], userId: effectiveStoreId })} style={{ background: 'var(--accent)', color: 'var(--primary)', border: 'none', padding: '8px 15px', borderRadius: '20px', fontWeight: 800, fontSize: '0.75rem' }}>+ Nuevo</button>
                                    </div>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {storeProducts.map(p => (
                                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg)', padding: '10px', borderRadius: '15px' }}>
                                                <img src={p.image} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} alt={p.title} />
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>{p.title}</p>
                                                    <p style={{ fontSize: '0.7rem', opacity: 0.6, margin: 0 }}>S/ {p.price}</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => setEditingProduct(p)} style={{ background: 'transparent', color: 'var(--primary)', fontSize: '0.7rem' }}>✏️</button>
                                                    <button onClick={() => confirmAction('Borrar', `¿Eliminar?`, () => deleteDoc(doc(db, 'products', p.id)))} style={{ background: 'transparent', color: 'var(--danger)', fontSize: '0.7rem' }}>🗑️</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </LockedSection>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sales' && (
                        <div className="fade-in">
                            <div style={{ background: 'white', padding: '30px', borderRadius: '30px', boxShadow: 'var(--shadow-sm)' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>Ventas de la Tienda</h3>
                                <p style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>S/ 1,250.00</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'branding' && (
                        <div className="fade-in">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
                                <LockedSection title="🎨 Branding de Tienda">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <div style={{ width: '80px', height: '80px', borderRadius: '15px', background: 'var(--bg)', overflow: 'hidden', border: '1px solid #eee' }}>
                                                {users.find(u => u.id === effectiveStoreId)?.storeLogo ? <img src={users.find(u => u.id === effectiveStoreId)!.storeLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="logo" /> : <span style={{ opacity: 0.2 }}>🏙️</span>}
                                            </div>
                                            <button onClick={() => {
                                                const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
                                                i.onchange = async (e: any) => { if (e.target.files[0]) { const c = await compressImage(e.target.files[0]); await setDoc(doc(db, 'users', effectiveStoreId), { storeLogo: c }, { merge: true }); } }; i.click();
                                            }} style={{ background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: '25px', fontSize: '0.75rem', fontWeight: 800 }}>Subir Logo</button>
                                        </div>
                                        <input type="text" defaultValue={users.find(u => u.id === effectiveStoreId)?.storeName} onBlur={async (e) => await setDoc(doc(db, 'users', effectiveStoreId), { storeName: e.target.value }, { merge: true })} placeholder="Nombre de Marca" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd' }} />
                                    </div>
                                </LockedSection>

                                {isMaster && effectiveStoreId === 'master' && (
                                    <LockedSection title="🛠️ Master Global Settings">
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>Nombre de App</label>
                                            <input type="text" value={globalBrandName} onChange={e => setGlobalBrandName(e.target.value)} style={{ padding: '12px', borderRadius: '12px' }} />
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>Primary Color</label>
                                            <input type="color" value={globalPrimaryColor} onChange={e => setGlobalPrimaryColor(e.target.value)} style={{ padding: 0, width: '100%', height: '40px', borderRadius: '10px' }} />

                                            <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>WhatsApp Master</label>
                                            <input type="text" value={globalWaNumber} onChange={e => setGlobalWaNumber(e.target.value)} style={{ padding: '12px', borderRadius: '12px' }} />
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>Grid Columns (Mobile)</label>
                                            <input type="number" value={globalGridCols} onChange={e => setGlobalGridCols(Number(e.target.value))} style={{ padding: '12px', borderRadius: '12px' }} />
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>SEO Desc</label>
                                            <textarea value={globalMetaDesc} onChange={e => setGlobalMetaDesc(e.target.value)} style={{ padding: '12px', borderRadius: '12px', minHeight: '60px' }} />
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>Keywords</label>
                                            <input type="text" value={globalKeywords} onChange={e => setGlobalKeywords(e.target.value)} style={{ padding: '12px', borderRadius: '12px' }} />
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>Redes Sociales</label>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {Object.keys(SOCIAL_ICONS).map(net => (
                                                    <div key={net} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <span>{SOCIAL_ICONS[net]}</span>
                                                        <input type="text" value={globalSocialLinks[net] || ''} onChange={e => setGlobalSocialLinks({ ...globalSocialLinks, [net]: e.target.value })} placeholder={net} style={{ flex: 1, padding: '8px' }} />
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={saveSettings} className="btn-vibrant">GUARDAR MASTER ✨</button>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.onchange = (e: any) => handleLogoUpload(e); i.click(); }} style={{ flex: 1, padding: '10px', fontSize: '0.65rem' }}>Upload Logo</button>
                                                <button onClick={() => { const i = document.createElement('input'); i.type = 'file'; i.onchange = (e: any) => handleFaviconUpload(e); i.click(); }} style={{ flex: 1, padding: '10px', fontSize: '0.65rem' }}>Upload Favicon</button>
                                            </div>
                                            <img src={globalLogo} hidden alt="logo" /> <img src={globalFavicon} hidden alt="favicon" />
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>Font Principal</label>
                                            <select value={globalFont} onChange={e => setGlobalFont(e.target.value)} style={{ padding: '12px' }}>
                                                <option value="Inter">Inter</option>
                                                <option value="Outfit">Outfit</option>
                                                <option value="Montserrat">Montserrat</option>
                                            </select>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>Tags Globales</label>
                                            <input type="text" value={globalTags.join(', ')} onChange={e => setGlobalTags(e.target.value.split(',').map(s => s.trim()))} style={{ padding: '12px' }} />
                                            {exportDB && <button onClick={exportDB} className="btn-cart" style={{ fontSize: '0.6rem' }}>Full Data Export</button>}
                                        </div>
                                    </LockedSection>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="fade-in">
                            <LockedSection title="👥 Gestión de Equipo">
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px' }}>
                                    <button onClick={async () => {
                                        const inviteId = Math.random().toString(36).substring(2, 11);
                                        await setDoc(doc(db, 'invites', inviteId), { id: inviteId, role: 'colaborador', parentStoreId: effectiveStoreId, createdAt: new Date().toISOString() });
                                        const link = `${window.location.origin}?invite=${inviteId}`;
                                        setGeneratedInviteLink(link); navigator.clipboard.writeText(link); setInviteCopied(true); setTimeout(() => setInviteCopied(false), 2000);
                                    }} style={{ background: 'var(--accent)', color: 'var(--primary)', padding: '10px 20px', borderRadius: '15px', fontWeight: 800, fontSize: '0.75rem' }}>
                                        {inviteCopied ? '✅ Copiado' : '🔗 Link Invitación'}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {users.filter(u => u.parentStoreId === effectiveStoreId).map(u => (
                                        <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg)', padding: '15px', borderRadius: '15px' }}>
                                            <div><p style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0 }}>{u.name}</p><p style={{ fontSize: '0.65rem', opacity: 0.6, margin: 0 }}>{u.email}</p></div>
                                            <button onClick={() => confirmAction('Quitar', `¿Remover?`, () => setDoc(doc(db, 'users', u.id), { role: 'customer', parentStoreId: '' }, { merge: true }))} style={{ color: 'var(--danger)', fontSize: '0.7rem', fontWeight: 800 }}>QUITAR</button>
                                        </div>
                                    ))}
                                </div>
                            </LockedSection>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL DE SEGURIDAD MASTER (TAILWIND PREMIUM) */}
            {securityModal?.show && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', maxWidth: '400px', width: '100%', borderRadius: '35px', padding: '40px', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.8)' }}>
                        <div style={{ width: '60px', height: '60px', background: '#fff9c4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '1.5rem' }}>🛡️</div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '15px', color: 'var(--primary)' }}>{securityModal.title}</h2>
                        <p style={{ fontSize: '0.95rem', opacity: 0.7, lineHeight: 1.6, marginBottom: '30px' }}>{securityModal.message}</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setSecurityModal(null)} style={{ flex: 1, padding: '15px', borderRadius: '18px', background: '#f5f5f5', color: '#666', fontWeight: 800, fontSize: '0.85rem' }}>CANCELAR</button>
                            <button onClick={async () => { await securityModal.action(); setSecurityModal(null); }} className="btn-vibrant" style={{ flex: 1, padding: '15px', borderRadius: '18px', fontSize: '0.85rem' }}>CONFIRMAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardView;
