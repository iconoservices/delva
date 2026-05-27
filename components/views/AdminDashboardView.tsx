import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/data/products';
import { type User } from '@/lib/types';
import { useApp } from '@/lib/context/AppContext';

// Modular Sections
import InventoryManager from '@/components/admin/sections/InventoryManager';
import BrandingSettings from '@/components/admin/sections/BrandingSettings';
import TeamManager from '@/components/admin/sections/TeamManager';
import MasterPanel from '@/components/admin/sections/MasterPanel';
import FinancialDashboard from '@/components/admin/sections/FinancialDashboard';
import SalesManager from '@/components/admin/sections/SalesManager';

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
    setGlobalLogo: (v: string) => void;
    globalFavicon: string;
    setGlobalFavicon: (v: string) => void;
    globalMetaDesc: string;
    setGlobalMetaDesc: (val: string) => void;
    globalKeywords: string;
    setGlobalKeywords: (val: string) => void;
    globalSocialLinks: any;
    setGlobalSocialLinks: (val: any) => void;
    globalTags: string[];
    setGlobalTags: (val: string[]) => void;
    globalCategories: { id: string, name: string, subCategories?: any[] }[];
    setGlobalCategories: (val: { id: string, name: string, subCategories?: { id: string, name: string }[] }[]) => void;
    globalColors: { name: string, hex: string }[];
    saveGlobalColors: (colors: { name: string, hex: string }[]) => Promise<void>;
    handleLogoUpload: (e: any) => void;
    handleFaviconUpload: (e: any) => void;
    saveSettings: () => void;
    saveGlobalCategories: (newCats: any[]) => Promise<void>;
    updateProductStock: (id: string, delta: number) => Promise<void>;
    assignSKUToProduct: (id: string, sku: string) => Promise<void>;
    generateSuggestedSKU: (categoryId: string, title: string, color?: string, subCategoryId?: string) => string;
    deleteProduct: (id: string) => Promise<void>;
    compressImage: (file: File) => Promise<string>;
    setEditingProduct: (p: Product | null) => void;
    SOCIAL_ICONS: any;
    logout: () => void;
    confirmAction: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
    alertAction: (title: string, message: string) => void;
    onRecordSale: (p: Product) => void;
    isSynced: boolean;
    authEmail: string | null;
    banners: any[];
}

const AdminDashboardView: React.FC<AdminDashboardViewProps> = (props) => {
    const {
        currentUser, products, users, exportDB, SOCIAL_ICONS, logout, confirmAction, alertAction,
        onRecordSale, banners, isSynced, authEmail
    } = props;
    const { selectedStoreId, setSelectedStoreId } = useApp();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // 1. DETERMINAR EL NIVEL DE ACCESO
    const role = currentUser.role || 'customer';
    const isMaster = role === 'master';
    const isSocio = role === 'socio';
    const isColaborador = role === 'colaborador';
    const isCustomer = role === 'customer';

    const [activeTab, setActiveTabBase] = useState<'inventory' | 'sales' | 'metrics' | 'branding' | 'team' | 'master_panel' | 'config'>(
        'inventory'
    );

    // Sync tab with URL
    const setActiveTab = (tab: any) => {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url);
        setActiveTabBase(tab);
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && ['inventory', 'sales', 'metrics', 'branding', 'team', 'master_panel', 'config'].includes(tab)) {
            setActiveTabBase(tab as any);
        }
    }, []);

    // 3. BLOQUEO DINÁMICO DE RUTAS
    useEffect(() => {
        if (!isMaster && (activeTab === 'master_panel' || activeTab === 'config')) {
            setActiveTab('inventory');
        }
    }, [activeTab, isMaster]);

    // Sync context store ID if missing
    useEffect(() => {
        if (!selectedStoreId && currentUser.id) setSelectedStoreId(currentUser.id);
    }, [currentUser.id, selectedStoreId]);

    // --- RECOPILACIÓN DE PRODUCTOS ---
    const effectiveStoreId = (isMaster && activeTab !== 'master_panel') ? selectedStoreId : (currentUser.parentStoreId || currentUser.id);
    const storeProducts = products.filter(p => p.userId === effectiveStoreId || (effectiveStoreId === 'master' && !p.userId));

    // --- VISTA LEVEL 4: CUSTOMER (UPSELL) ---
    if (isCustomer) {
        return (
            <div className="container fade-in" style={{ padding: '60px 20px 40px', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'white', padding: '50px 30px 40px', borderRadius: '40px', boxShadow: 'var(--shadow-lg)', maxWidth: '520px', width: '100%', border: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: '3.5rem', marginBottom: '15px', display: 'block' }}>🏪</span>
                    <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '12px' }}>¡Crea tu propia tienda!</h2>
                    <p style={{ fontSize: '1rem', opacity: 0.65, marginBottom: '30px', lineHeight: 1.7 }}>
                        Esta función es exclusiva para <b>Socios DELVA</b>.<br />
                        Sube productos, personaliza tu marca y llega a miles de clientes en la selva.
                    </p>
                    <button onClick={() => window.open(`https://wa.me/${props.globalWaNumber}?text=Hola,%20soy%20${currentUser.name}%20y%20quiero%20abrir%20mi%20tienda%20en%20DELVA`, '_blank')} className="btn-vibrant" style={{ width: '100%', padding: '18px', borderRadius: '22px', fontSize: '1rem', marginBottom: '12px' }}>PEDIR ACCESO DE SOCIO 🚀</button>
                    <button onClick={() => router.push('/')} style={{ width: '100%', padding: '14px', background: 'transparent', color: 'var(--primary)', border: '1.5px solid rgba(15,48,37,0.15)', borderRadius: '18px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>Volver al Marketplace 🌿</button>
                </div>
                <button onClick={logout} style={{ marginTop: '24px', background: 'transparent', color: 'rgba(0,0,0,0.28)', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}>Cerrar sesión</button>
            </div>
        );
    }

    return (
        <div className="workspace-layout">
            <style>{`
                .workspace-layout {
                    display: flex;
                    min-height: 100vh;
                    background-color: #f8fafc;
                    width: 100%;
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                .workspace-sidebar {
                    width: 260px;
                    background-color: #ffffff;
                    border-right: 1px solid #f1f5f9;
                    display: flex;
                    flex-direction: column;
                    padding: 24px 16px;
                    flex-shrink: 0;
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    z-index: 1000;
                    box-sizing: border-box;
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .workspace-content {
                    flex: 1;
                    padding: 40px;
                    min-width: 0;
                    background-color: #f8fafc;
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                }
                .sidebar-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 30px;
                    padding-left: 8px;
                }
                .logo-box {
                    width: 40px;
                    height: 40px;
                    background-color: #000000;
                    color: #ffffff;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 900;
                    font-size: 1.3rem;
                }
                .logo-text {
                    font-weight: 800;
                    font-size: 1.25rem;
                    color: #0f172a;
                    margin: 0;
                    letter-spacing: -0.5px;
                }
                .sidebar-menu {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    flex: 1;
                }
                .menu-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    border: none;
                    background: transparent;
                    color: #475569;
                    font-weight: 600;
                    font-size: 0.92rem;
                    cursor: pointer;
                    text-align: left;
                    transition: all 0.2s ease;
                    width: 100%;
                }
                .menu-item:hover {
                    background-color: #f1f5f9;
                    color: #0f172a;
                }
                .menu-item.active {
                    background-color: #000000;
                    color: #ffffff;
                    font-weight: 800;
                }
                .sidebar-footer {
                    padding-top: 16px;
                    border-top: 1px solid #f1f5f9;
                    margin-top: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .mobile-bar {
                    display: none;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 20px;
                    background-color: #ffffff;
                    border-bottom: 1px solid #f1f5f9;
                    position: sticky;
                    top: 0;
                    z-index: 1001;
                    box-sizing: border-box;
                    width: 100%;
                }
                .mobile-toggle {
                    background: transparent;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    color: #0f172a;
                }
                .sidebar-overlay {
                    display: none;
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(4px);
                    z-index: 999;
                }
                @media (max-width: 768px) {
                    .workspace-sidebar {
                        position: fixed;
                        left: 0;
                        top: 0;
                        bottom: 0;
                        transform: translateX(-100%);
                        height: 100%;
                        box-shadow: 20px 0 25px -5px rgba(0, 0, 0, 0.1);
                    }
                    .workspace-sidebar.open {
                        transform: translateX(0);
                    }
                    .workspace-content {
                        padding: 20px;
                    }
                    .mobile-bar {
                        display: flex;
                    }
                    .sidebar-overlay.open {
                        display: block;
                    }
                }
            `}</style>

            {/* OVERLAY FOR MOBILE SIDEBAR */}
            <div className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)} />

            {/* MOBILE TOP BAR */}
            <div className="mobile-bar">
                <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(true)}>
                    ☰
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🌿</span>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>Delva Workspace</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isSynced ? '#00b96b' : '#ff4d4f', boxShadow: isSynced ? '0 0 8px #00b96b' : 'none' }} />
                </div>
            </div>

            {/* SIDEBAR NAVIGATION */}
            <aside className={`workspace-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-box">
                        D
                    </div>
                    <div>
                        <h2 className="logo-text">Workspace</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSynced ? '#00b96b' : '#ff4d4f' }} />
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
                                {isSynced ? 'En línea' : 'Sin Conexión'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="sidebar-menu">
                    <button 
                        onClick={() => { setActiveTab('inventory'); setIsMobileMenuOpen(false); }}
                        className={`menu-item ${activeTab === 'inventory' ? 'active' : ''}`}
                    >
                        <span style={{ fontSize: '1.1rem' }}>📦</span>
                        Productos
                    </button>

                    <button 
                        onClick={() => { setActiveTab('sales'); setIsMobileMenuOpen(false); }}
                        className={`menu-item ${activeTab === 'sales' ? 'active' : ''}`}
                    >
                        <span style={{ fontSize: '1.1rem' }}>🛒</span>
                        Ventas
                    </button>

                    <button 
                        onClick={() => { 
                            alertAction("Pedidos", "La gestión de pedidos de clientes en tiempo real estará disponible en la próxima versión."); 
                            setIsMobileMenuOpen(false); 
                        }}
                        className="menu-item"
                        style={{ opacity: 0.65 }}
                    >
                        <span style={{ fontSize: '1.1rem' }}>📋</span>
                        Pedidos
                        <span style={{ fontSize: '0.52rem', fontWeight: 800, background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>
                            PRÓX.
                        </span>
                    </button>

                    <button 
                        onClick={() => { setActiveTab('metrics'); setIsMobileMenuOpen(false); }}
                        className={`menu-item ${activeTab === 'metrics' ? 'active' : ''}`}
                    >
                        <span style={{ fontSize: '1.1rem' }}>📈</span>
                        Métricas
                    </button>

                    {isMaster && (
                        <button 
                            onClick={() => { setActiveTab('master_panel'); setIsMobileMenuOpen(false); }}
                            className={`menu-item ${activeTab === 'master_panel' ? 'active' : ''}`}
                        >
                            <span style={{ fontSize: '1.1rem' }}>🏪</span>
                            Mis Tiendas
                        </button>
                    )}

                    <button 
                        onClick={() => { setActiveTab('branding'); setIsMobileMenuOpen(false); }}
                        className={`menu-item ${activeTab === 'branding' ? 'active' : ''}`}
                    >
                        <span style={{ fontSize: '1.1rem' }}>🎨</span>
                        Branding
                    </button>

                    <button 
                        onClick={() => { setActiveTab('team'); setIsMobileMenuOpen(false); }}
                        className={`menu-item ${activeTab === 'team' ? 'active' : ''}`}
                    >
                        <span style={{ fontSize: '1.1rem' }}>👥</span>
                        Mi Equipo
                    </button>

                    {isMaster && (
                        <button 
                            onClick={() => { setActiveTab('config'); setIsMobileMenuOpen(false); }}
                            className={`menu-item ${activeTab === 'config' ? 'active' : ''}`}
                        >
                            <span style={{ fontSize: '1.1rem' }}>⚙️</span>
                            Configuración
                        </button>
                    )}

                    <button 
                        onClick={() => { 
                            alertAction("Instalar App", "Esta aplicación está lista como PWA. Para instalarla, abre el menú de tu navegador y selecciona 'Instalar aplicación' o 'Agregar a la pantalla de inicio'.");
                            setIsMobileMenuOpen(false); 
                        }}
                        className="menu-item"
                        style={{ color: '#4f46e5' }}
                    >
                        <span style={{ fontSize: '1.1rem' }}>📱</span>
                        Instalar App
                    </button>
                </div>

                <div className="sidebar-footer">
                    <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {currentUser.name || authEmail || 'Socio Delva'}
                        </span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                            Rol: {role}
                        </span>
                    </div>

                    <button 
                        onClick={() => { router.push('/'); setIsMobileMenuOpen(false); }}
                        className="menu-item"
                        style={{ color: '#0f3025' }}
                    >
                        <span style={{ fontSize: '1.1rem' }}>🌿</span>
                        Volver a Delva
                    </button>

                    <button 
                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                        className="menu-item"
                        style={{ color: '#ff4d4f' }}
                    >
                        <span style={{ fontSize: '1.1rem' }}>🚪</span>
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="workspace-content">
                {activeTab === 'inventory' && (
                    <InventoryManager 
                        effectiveStoreId={effectiveStoreId} 
                        storeProducts={storeProducts} 
                        setEditingProduct={props.setEditingProduct}
                        globalCategories={props.globalCategories}
                        saveGlobalCategories={props.saveGlobalCategories}
                        updateProductStock={props.updateProductStock}
                        assignSKUToProduct={props.assignSKUToProduct}
                        generateSuggestedSKU={props.generateSuggestedSKU}
                        confirmAction={confirmAction}
                        onRecordSale={props.onRecordSale}
                        deleteProduct={props.deleteProduct}
                        globalColors={props.globalColors}
                        saveGlobalColors={props.saveGlobalColors}
                        isMaster={isMaster}
                        isSocio={isSocio}
                    />
                )}

                {activeTab === 'sales' && (
                    <SalesManager
                        storeProducts={storeProducts}
                        effectiveStoreId={effectiveStoreId}
                        updateProductStock={props.updateProductStock}
                        confirmAction={confirmAction}
                        globalColors={props.globalColors}
                        isMaster={isMaster}
                        isSocio={isSocio}
                    />
                )}

                {activeTab === 'branding' && (
                    <BrandingSettings 
                        {...props}
                        effectiveStoreId={effectiveStoreId}
                        users={users}
                        products={products}
                        isMaster={isMaster}
                        isColaborador={isColaborador}
                        isSocio={isSocio}
                    />
                )}

                {activeTab === 'team' && (
                    <TeamManager 
                        effectiveStoreId={effectiveStoreId}
                        users={users}
                        isColaborador={isColaborador}
                        confirmAction={confirmAction}
                    />
                )}

                {activeTab === 'metrics' && (
                    <FinancialDashboard
                        storeProducts={storeProducts}
                        effectiveStoreId={effectiveStoreId}
                        isMaster={isMaster}
                        isSocio={isSocio}
                    />
                )}

                {activeTab === 'config' && (
                    <div style={{ display: 'grid', gap: '25px' }}>
                        <div style={{ background: 'white', padding: '30px', borderRadius: '35px', border: '1px solid #f0f0f0' }}>
                           <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '20px' }}>Cerebro del Marketplace (Master) ⚙️</h3>
                           <div style={{ display: 'grid', gap: '15px' }}>
                               <div><label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#888' }}>NOMBRE DEL SITIO</label><input value={props.globalBrandName} onChange={e => props.setGlobalBrandName(e.target.value)} onBlur={props.saveSettings} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #eee' }} /></div>
                               <div><label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#888' }}>WHATSAPP MASTER</label><input value={props.globalWaNumber} onChange={e => props.setGlobalWaNumber(e.target.value)} onBlur={props.saveSettings} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #eee' }} /></div>
                               <div><label style={{ fontSize: '0.7rem', fontWeight: 900, color: '#888' }}>DESCRIPCIÓN SEO</label><textarea value={props.globalMetaDesc} onChange={e => props.setGlobalMetaDesc(e.target.value)} onBlur={props.saveSettings} rows={3} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #eee', resize: 'vertical' }} /></div>
                           </div>
                        </div>
                        <div style={{ background: 'white', padding: '30px', borderRadius: '35px', border: '1px solid #f0f0f0', textAlign: 'center' }}>
                            <span style={{ fontSize: '2.5rem' }}>📱</span>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginTop: '10px' }}>PWA Ready</h3>
                            <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Manifest.json detectado. El marketplace ya es instalable.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'master_panel' && (
                    <MasterPanel 
                        users={users}
                        products={products}
                        globalCategories={props.globalCategories}
                        setActiveTab={setActiveTab}
                        setSelectedStoreId={setSelectedStoreId}
                        selectedStoreId={selectedStoreId}
                        setEditingProduct={props.setEditingProduct}
                    />
                )}
            </main>
        </div>
    );
};

export default AdminDashboardView;
