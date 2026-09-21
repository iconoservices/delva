'use client';

import React from 'react';
import GrandHeroCarousel from './GrandHeroCarousel';
import AnnouncementBar from './AnnouncementBar';
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
    showHero?: boolean;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
    categories,
    activeCategory,
    setActiveCategory,
    banners,
    searchTerm = '',
    setSearchTerm = () => {},
    activeGlobalFilter = 'all',
    setActiveGlobalFilter = () => {},
    showHero = true
}) => {
    const router = useRouter();
    const [isDesktop, setIsDesktop] = React.useState(false);
    const [hasMounted, setHasMounted] = React.useState(false);

    React.useEffect(() => {
        setHasMounted(true);
        const checkSize = () => setIsDesktop(window.innerWidth > 1024);
        checkSize();
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    return (
        <div className="marketplace-header" style={{ background: 'transparent' }}>
            {/* HERO CAROUSEL */}
            {showHero && <AnnouncementBar />}
            {showHero && (
                <section className="hero-wrap">
                    <GrandHeroCarousel onCtaClick={(link) => router.push(link)} banners={banners} />
                </section>
            )}

            {/* SEARCH & CATEGORY CONTAINER */}
            <div className="content-shell" style={{ maxWidth: '1400px', margin: '0 auto', marginTop: showHero ? '12px' : '14px', position: 'relative', zIndex: 50 }}>
                
                {/* SEARCH BAR */}
                {searchTerm && (
                    <div className="search-wrap">
                        <div className="search-active">
                            <span>Buscando: <b>{searchTerm}</b></span>
                            <button aria-label="Quitar búsqueda" onClick={() => setSearchTerm('')}>✕</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
