import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../data/products';
import { type User } from '../App';

// Modular Sections
import InventoryManager from '../components/admin/sections/InventoryManager';
import BrandingSettings from '../components/admin/sections/BrandingSettings';
import TeamManager from '../components/admin/sections/TeamManager';
import MasterPanel from '../components/admin/sections/MasterPanel';
import ConfigPanel from '../components/admin/sections/ConfigPanel';

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
    globalCategories: { id: string, name: string }[];
    setGlobalCategories: (val: { id: string, name: string }[]) => void;
    handleLogoUpload: (e: any) => void;
    handleFaviconUpload: (e: any) => void;
    saveSettings: () => void;
    compressImage: (file: File) => Promise<string>;
    setEditingProduct: (p: Product | null) => void;
    SOCIAL_ICONS: any;
    logout: () => void;
    confirmAction: (title: string, message: string, onConfirm: () => void, confirmText?: string, cancelText?: string) => void;
    alertAction: (title: string, message: string) => void;
    onRecordSale: (product: Product) => void;
    banners: any[];
}

const AdminDashboardView: React.FC<AdminDashboardViewProps> = (props) => {
    const { currentUser, products, users, logout, confirmAction } = props;
    const navigate = useNavigate();

    // 1. DETERMINAR EL NIVEL DE ACCESO
    const role = currentUser.role || 'customer';
    const isMaster = role === 'master';
    const isSocio = role === 'socio';
    const isColaborador = role === 'colaborador';
    const isCustomer = role === 'customer';

    // 2. ESTADO DE TABS
    const [activeTab, setActiveTab] = useState<'inventory' | 'sales' | 'branding' | 'team' | 'master_panel' | 'config'>(
        'inventory'
    );

    // 3. BLOQUEO DINÁMICO DE RUTAS
    useEffect(() => {
        if (!isMaster && activeTab === 'master_panel') setActiveTab('inventory');
        if (isColaborador && (activeTab === 'branding' || activeTab === 'team')) setActiveTab('inventory');
    }, [activeTab, isMaster, isColaborador]);

    // 4. ESTADO PARA MASTER (Shadow Mode)
    const [selectedStoreId, setSelectedStoreId] = useState(currentUser.id);

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
                    <button onClick={() => navigate('/')} style={{ width: '100%', padding: '14px', background: 'transparent', color: 'var(--primary)', border: '1.5px solid rgba(15,48,37,0.15)', borderRadius: '18px', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem' }}>Volver al Marketplace 🌿</button>
                </div>
                <button onClick={logout} style={{ marginTop: '24px', background: 'transparent', color: 'rgba(0,0,0,0.28)', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '0.78rem' }}>Cerrar sesión</button>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            {/* COMPACT DASHBOARD HEADER */}
            <section style={{ background: 'var(--primary)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', margin: '12px 0', color: 'white', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <p style={{ fontSize: '0.65rem', opacity: 0.6, margin: '0 0 2px', fontWeight: 900, textTransform: 'uppercase' }}>{activeTab === 'master_panel' ? 'Admin Central' : 'Gestión de Negocio'}</p>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '2px' }}>Panel de Control Delva 🌿</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                             <p style={{ fontSize: '0.78rem', margin: 0, opacity: 0.9 }}>{currentUser.name} · <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{role.toUpperCase()}</span></p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {isMaster && (
                            <>
                                <button 
                                    onClick={() => setActiveTab(activeTab === 'master_panel' ? 'inventory' : 'master_panel')}
                                    style={{ background: activeTab === 'master_panel' ? 'var(--accent)' : 'rgba(255,255,255,0.1)', color: activeTab === 'master_panel' ? 'var(--accent)' : 'white', border: 'none', padding: '10px 18px', borderRadius: '30px', fontWeight: 900, fontSize: '0.7rem', cursor: 'pointer' }}
                                >
                                    {activeTab === 'master_panel' ? '📊 PANEL DE GESTIÓN' : '👑 MASTER PANEL'}
                                </button>
                            </>
                        )}
                        <button onClick={logout} style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '30px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}>Salir 🚪</button>
                    </div>
                </div>

                {/* TABS SELECTOR */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '18px', overflowX: 'auto' }}>
                    {activeTab !== 'master_panel' ? (
                        <>
                            <button onClick={() => setActiveTab('inventory')} style={{ flex: 1, padding: '12px', borderRadius: '15px', border: 'none', background: activeTab === 'inventory' ? 'white' : 'transparent', color: activeTab === 'inventory' ? 'var(--primary)' : 'white', fontWeight: 900, fontSize: '0.7rem' }}>INVENTARIO</button>
                            {(isSocio || isMaster) && (
                                <>
                                    <button onClick={() => setActiveTab('branding')} style={{ flex: 1, padding: '12px', borderRadius: '15px', border: 'none', background: activeTab === 'branding' ? 'white' : 'transparent', color: activeTab === 'branding' ? 'var(--primary)' : 'white', fontWeight: 900, fontSize: '0.7rem' }}>MI MARCA</button>
                                    <button onClick={() => setActiveTab('team')} style={{ flex: 1, padding: '12px', borderRadius: '15px', border: 'none', background: activeTab === 'team' ? 'white' : 'transparent', color: activeTab === 'team' ? 'var(--primary)' : 'white', fontWeight: 900, fontSize: '0.7rem' }}>EQUIPO</button>
                                    {isMaster && <button onClick={() => setActiveTab('config')} style={{ flex: 1, padding: '12px', borderRadius: '15px', border: 'none', background: activeTab === 'config' ? 'white' : 'transparent', color: activeTab === 'config' ? 'var(--primary)' : 'white', fontWeight: 900, fontSize: '0.7rem' }}>⚙️ CONFIG</button>}
                                </>
                            )}
                        </>
                    ) : null}
                </div>
            </section>

            {/* CONTENIDO MODULAR */}
            <main className="fade-in">
                {isMaster && (activeTab === 'inventory' || activeTab === 'branding') && (
                    <div style={{ background: '#fff9c4', padding: '12px 20px', borderRadius: '15px', marginBottom: '20px', fontSize: '0.75rem', fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #fbc02d' }}>
                        <span>🕶️ MODO SOMBRA: {users.find(u => u.id === effectiveStoreId)?.storeName || users.find(u => u.id === effectiveStoreId)?.name || 'Tienda Global'}</span>
                        <button onClick={() => setActiveTab('master_panel')} style={{ background: 'var(--primary)', color: 'white', padding: '5px 12px', borderRadius: '10px', border: 'none', fontSize: '0.65rem' }}>Cambiar</button>
                    </div>
                )}

                {activeTab === 'inventory' && (
                    <InventoryManager 
                        effectiveStoreId={effectiveStoreId} 
                        storeProducts={storeProducts} 
                        setEditingProduct={props.setEditingProduct}
                        globalCategories={props.globalCategories}
                        confirmAction={confirmAction}
                        onRecordSale={props.onRecordSale}
                    />
                )}

                {activeTab === 'branding' && (
                    <BrandingSettings 
                        {...props}
                        effectiveStoreId={effectiveStoreId}
                        users={users}
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

                {activeTab === 'master_panel' && (
                    <MasterPanel 
                        users={users}
                        products={products}
                        setActiveTab={setActiveTab}
                        setSelectedStoreId={setSelectedStoreId}
                        selectedStoreId={selectedStoreId}
                        setEditingProduct={props.setEditingProduct}
                        banners={props.banners}
                        confirmAction={confirmAction}
                        compressImage={props.compressImage}
                    />
                )}

                {activeTab === 'config' && isMaster && (
                    <ConfigPanel
                        globalBrandName={props.globalBrandName}
                        setGlobalBrandName={props.setGlobalBrandName}
                        globalWaNumber={props.globalWaNumber}
                        setGlobalWaNumber={props.setGlobalWaNumber}
                        globalMetaDesc={props.globalMetaDesc}
                        setGlobalMetaDesc={props.setGlobalMetaDesc}
                        globalCategories={props.globalCategories}
                        setGlobalCategories={props.setGlobalCategories}
                        saveSettings={props.saveSettings}
                        products={products}
                        confirmAction={confirmAction}
                    />
                )}
            </main>
        </div>
    );
};

export default AdminDashboardView;
