'use client';

import React, { useEffect } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { useRouter } from 'next/navigation';
import SalesManager from '@/components/admin/sections/SalesManager';

export default function PosPage() {
    const {
        products, users, currentUser, updateProductStock, confirmAction,
        globalColors, selectedStoreId, setSelectedStoreId
    } = useApp();
    
    const router = useRouter();

    // Loading state
    if (!currentUser) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
                <p style={{ opacity: 0.4, fontSize: '0.9rem', fontWeight: 600 }}>Cargando Caja...</p>
            </div>
        );
    }

    const { role, id, parentStoreId } = currentUser;
    const isMaster = role === 'master';
    const isSocio = role === 'socio';

    // Sync context store ID if missing
    useEffect(() => {
        if (!selectedStoreId && id) setSelectedStoreId(id);
    }, [id, selectedStoreId]);

    // Calcular effectiveStoreId y productos (misma lógica que AdminDashboardView)
    const effectiveStoreId = isMaster ? selectedStoreId : (parentStoreId || id);
    const storeProducts = products.filter(p => p.userId === effectiveStoreId || (effectiveStoreId === 'master' && !p.userId));

    return (
        <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '10px 15px 100px' }}>
            {/* Header Standalone POS — todo en una sola barra, estilo AdminDashboard */}
            <section style={{ background: 'var(--primary)', borderRadius: '24px', padding: '10px 16px', margin: '8px 0 16px', color: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto' }}>
                    {/* Botón atrás + título */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <button
                            onClick={() => router.push('/admin')}
                            style={{ width: '32px', height: '32px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'white' }}
                        >
                            ←
                        </button>
                        <div style={{ flexShrink: 0 }}>
                            <h1 style={{ fontSize: '0.95rem', fontWeight: 900, margin: 0, whiteSpace: 'nowrap', color: 'white' }}>Caja Rápida ⚡</h1>
                            <p style={{ fontSize: '0.6rem', margin: 0, opacity: 0.7, whiteSpace: 'nowrap' }}>Terminal de Venta</p>
                        </div>
                    </div>

                    {/* Selector de tienda (solo Master) — inline en la misma barra */}
                    {isMaster && (
                        <div style={{ display: 'flex', gap: '4px', flex: 1, background: 'rgba(255,255,255,0.06)', padding: '4px', borderRadius: '14px', overflowX: 'auto' }}>
                            <select
                                value={selectedStoreId}
                                onChange={e => setSelectedStoreId(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '7px 10px',
                                    borderRadius: '11px',
                                    border: 'none',
                                    background: 'rgba(255,255,255,0.12)',
                                    color: 'white',
                                    fontWeight: 900,
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <option value="master" style={{ color: '#111', background: 'white' }}>🟢 DELVA Global</option>
                                {users.filter(u => u.role === 'socio').map(u => (
                                    <option key={u.id} value={u.id} style={{ color: '#111', background: 'white' }}>🏪 {u.storeName || u.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Avatar usuario — derecha */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, color: 'white', opacity: 0.9 }}>{currentUser.name}</p>
                            <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'capitalize' }}>{role}</p>
                        </div>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', flexShrink: 0 }}>
                            {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    </div>
                </div>
            </section>

            {/* Contenido POS */}
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <SalesManager
                    storeProducts={storeProducts}
                    effectiveStoreId={effectiveStoreId}
                    updateProductStock={updateProductStock}
                    confirmAction={confirmAction}
                    globalColors={globalColors || []}
                    isMaster={isMaster}
                    isSocio={isSocio}
                />
            </div>
        </div>
    );
}
