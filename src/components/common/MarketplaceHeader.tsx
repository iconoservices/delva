import React from 'react';
import GrandHeroCarousel from './GrandHeroCarousel';
import { CategoryMenu } from './CategoryMenu';
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();

    return (
        <div className="marketplace-header" style={{ background: 'transparent' }}>
            {/* HERO CAROUSEL */}
            <section style={{ marginBottom: '0px' }}>
                <GrandHeroCarousel onCtaClick={(link) => navigate(link)} banners={banners} />
            </section>

            {/* SHARED CATEGORY MENU */}
            <div className="content-shell" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <CategoryMenu 
                    categories={[{ id: 'all', name: 'Todo' }, ...categories.filter(c => c.id !== 'all' && c.name !== 'Todos' && c.name !== 'Todo')]}
                    activeCategory={activeCategory}
                    setActiveCategory={(id) => {
                        const cat = categories.find(c => c.id === id);
                        // Prioritize the slug field, fallback to ID or slugified name
                        const slug = id === 'all' ? '' : ((cat as any)?.slug || (cat as any)?.id || cat?.name?.toLowerCase().replace(/\s+/g, '-'));
                        
                        setActiveCategory(id);
                        if (id === 'all') navigate('/');
                        else navigate(`/categoria/${slug}`);
                    }}
                />
            </div>
        </div>
    );
};
