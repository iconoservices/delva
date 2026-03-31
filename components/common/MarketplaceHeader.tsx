'use client';

import React from 'react';
import GrandHeroCarousel from './GrandHeroCarousel';
import { CategoryMenu } from './CategoryMenu';
import { useRouter } from 'next/navigation';

interface MarketplaceHeaderProps {
    categories: { id: string, name: string }[];
    activeCategory: string;
    setActiveCategory: (val: string) => void;
    banners?: any[];
    globalBrandName?: string;
    searchTerm?: string;
    setSearchTerm?: (val: string) => void;
    activeGlobalFilter?: string;
    setActiveGlobalFilter?: (val: any) => void;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
    categories,
    activeCategory,
    setActiveCategory,
    banners,
    searchTerm = '',
    setSearchTerm = () => {},
    activeGlobalFilter = 'all',
    setActiveGlobalFilter = () => {}
}) => {
    const router = useRouter();

    return (
        <div className="marketplace-header" style={{ background: 'transparent' }}>
            {/* HERO CAROUSEL */}
            <section style={{ marginBottom: '0px' }}>
                <GrandHeroCarousel onCtaClick={(link) => router.push(link)} banners={banners} />
            </section>

            {/* SEARCH & CATEGORY CONTAINER */}
            <div className="content-shell" style={{ maxWidth: '1400px', margin: '0 auto', marginTop: '-20px', position: 'relative', zIndex: 50 }}>
                
                {/* SEARCH BAR */}
                <div style={{ padding: '0 20px', marginBottom: '8px' }}>
                    <div style={{ 
                        background: 'white', 
                        borderRadius: '20px', 
                        padding: '10px 20px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(0,0,0,0.03)'
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>🔍</span>
                        <input 
                            type="text" 
                            placeholder="Buscar en Delva Marketplace..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                flex: 1, 
                                border: 'none', 
                                outline: 'none', 
                                fontSize: '0.95rem', 
                                fontWeight: 600,
                                color: '#1a1a1a'
                            }}
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 900 }}
                            >✕</button>
                        )}
                    </div>
                </div>

                {/* ── APP-STYLE ACTION SHORTCUTS (Yape Style) ── */}
                <div style={{ 
                    padding: '12px 20px 15px',
                    display: 'flex', 
                    gap: '20px', 
                    overflowX: 'auto', 
                    scrollbarWidth: 'none',
                }}>
                    {[
                        { id: 'all', label: 'Inicio', icon: '🏠', color: '#6C4AB6', bg: '#F2EBFF' },
                        { id: 'offers', label: 'Promos', icon: '🔥', color: '#E91E63', bg: '#FFF0F5', badge: '¡Dscto!' },
                        { id: 'reservations', label: 'Reserva', icon: '🗓️', color: '#F39C12', bg: '#FFF8F0' },
                        { id: 'new', label: 'Novedad', icon: '✨', color: '#00A651', bg: '#F1F9F5', badge: 'Nuevo' }
                    ].map((btn: any) => (
                        <div 
                            key={btn.id}
                            onClick={() => {
                                setActiveGlobalFilter(btn.id);
                                const scrollOffset = window.innerWidth > 768 ? 520 : 450;
                                window.scrollTo({ top: scrollOffset, behavior: 'smooth' });
                            }}
                            style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                gap: '8px', 
                                flexShrink: 0,
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                position: 'relative',
                                width: '60px',
                                height: '60px',
                                background: btn.bg,
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.6rem',
                                border: activeGlobalFilter === btn.id ? `3px solid ${btn.color}` : 'none',
                                boxShadow: activeGlobalFilter === btn.id ? `0 10px 20px ${btn.color}22` : '0 4px 12px rgba(0,0,0,0.03)',
                                transition: 'all 0.2s'
                            }}>
                                {btn.icon}
                                {btn.badge && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '-8px',
                                        right: '-10px',
                                        background: btn.color,
                                        color: 'white',
                                        padding: '3px 7px',
                                        borderRadius: '9px',
                                        fontSize: '0.55rem',
                                        fontWeight: 950,
                                        boxShadow: `0 4px 10px ${btn.color}44`,
                                        whiteSpace: 'nowrap',
                                        zIndex: 10
                                    }}>
                                        {btn.badge}
                                    </div>
                                )}
                            </div>
                            <span style={{ 
                                fontSize: '0.7rem', 
                                fontWeight: activeGlobalFilter === btn.id ? 900 : 700, 
                                color: activeGlobalFilter === btn.id ? btn.color : '#555',
                                transition: 'all 0.2s'
                            }}>
                                {btn.label}
                            </span>
                        </div>
                    ))}
                </div>

                <CategoryMenu 
                    categories={[{ id: 'all', name: 'Todo' }, ...categories.filter(c => c.id !== 'all' && c.name !== 'Todos' && c.name !== 'Todo')]}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                />
            </div>
        </div>
    );
};
