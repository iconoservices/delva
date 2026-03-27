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
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
    categories,
    activeCategory,
    setActiveCategory,
    banners
}) => {
    const router = useRouter();

    return (
        <div className="marketplace-header" style={{ background: 'transparent' }}>
            {/* HERO CAROUSEL */}
            <section style={{ marginBottom: '0px' }}>
                <GrandHeroCarousel onCtaClick={(link) => router.push(link)} banners={banners} />
            </section>

            {/* SHARED CATEGORY MENU */}
            <div className="content-shell" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <CategoryMenu 
                    categories={[{ id: 'all', name: 'Todo' }, ...categories.filter(c => c.id !== 'all' && c.name !== 'Todos' && c.name !== 'Todo')]}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                />
            </div>
        </div>
    );
};
