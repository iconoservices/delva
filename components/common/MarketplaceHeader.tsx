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
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
    categories,
    activeCategory,
    setActiveCategory,
    banners,
    searchTerm = '',
    setSearchTerm = () => {}
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
                <div style={{ padding: '0 20px', marginBottom: '15px' }}>
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

                <CategoryMenu 
                    categories={[{ id: 'all', name: 'Todo' }, ...categories.filter(c => c.id !== 'all' && c.name !== 'Todos' && c.name !== 'Todo')]}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                />
            </div>
        </div>
    );
};
