import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── MOCK DATA (reemplazar con Firebase luego) ──────────────────────────────
const HERO_SLIDES = [
    {
        id: '1',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600',
        tag: 'NUEVA COLECCIÓN',
        title: 'La Esencia\nde la Selva',
        subtitle: 'Moda, café y artesanía amazónica de autor',
        cta: 'VER COLECCIÓN',
        ctaLink: '/tienda?viewAsGuest=true',
        accent: '#FF5722',
    },
    {
        id: '2',
        image: 'https://images.unsplash.com/photo-1447078806655-40579c2520d6?q=80&w=1600',
        tag: 'OFERTA ESPECIAL',
        title: 'Sabores que\nEnamoran',
        subtitle: 'Los mejores productos gourmet de la región',
        cta: 'COMPRAR AHORA',
        ctaLink: '/tienda?viewAsGuest=true',
        accent: '#f97316',
    },
    {
        id: '3',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600',
        tag: 'ARTESANÍA DE AUTOR',
        title: 'Hecho a Mano\ncon Alma',
        subtitle: 'Piezas únicas creadas por artesanos locales',
        cta: 'DESCUBRIR',
        ctaLink: '/tienda?viewAsGuest=true',
        accent: '#a78bfa',
    },
];

const AUTOPLAY_DURATION = 5000;

interface GrandHeroCarouselProps {
    onCtaClick?: (link: string) => void;
    banners?: any[];
}

const GrandHeroCarousel: React.FC<GrandHeroCarouselProps> = ({ onCtaClick, banners = [] }) => {
    const slides = banners.length > 0 ? banners : HERO_SLIDES;
    const [current, setCurrent] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    const touchStartX = useRef<number>(0);
    const touchStartY = useRef<number>(0);
    const isSwiping = useRef<boolean>(false);

    const goTo = useCallback((index: number) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setProgress(0);
        startTimeRef.current = Date.now();
        setTimeout(() => {
            setCurrent(index);
            setIsTransitioning(false);
        }, 400);
    }, [isTransitioning]);

    const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo, slides.length]);
    const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo, slides.length]);

    useEffect(() => {
        if (isPaused) {
            if (progressRef.current) clearInterval(progressRef.current);
            return;
        }
        startTimeRef.current = Date.now() - (progress / 100 * AUTOPLAY_DURATION);
        progressRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const pct = Math.min((elapsed / AUTOPLAY_DURATION) * 100, 100);
            setProgress(pct);
            if (pct >= 100) {
                setCurrent(prev => (prev + 1) % HERO_SLIDES.length);
                setProgress(0);
                startTimeRef.current = Date.now();
            }
        }, 50);
        return () => { if (progressRef.current) clearInterval(progressRef.current); };
    }, [current, isPaused, progress]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        setIsPaused(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const dx = e.touches[0].clientX - touchStartX.current;
        const dy = e.touches[0].clientY - touchStartY.current;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) isSwiping.current = true;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (isSwiping.current) {
            if (dx < -40) next();
            else if (dx > 40) prev();
        }
        setTimeout(() => { setIsPaused(false); setProgress(0); startTimeRef.current = Date.now(); }, 50);
    };

    // Render complete
    return (
        <div className="container">
        <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => { setIsPaused(false); setProgress(0); startTimeRef.current = Date.now(); }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                position: 'relative',
                width: '100%',
                height: '145px',
                overflow: 'hidden',
                borderRadius: '24px',
                background: '#050a0f',
                userSelect: 'none',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                cursor: 'pointer'
            }}
        >
            {/* ── SLIDES ── */}
            {slides.map((s, i) => (
                <div
                    key={s.id}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: i === current ? 1 : 0,
                        transform: i === current ? 'scale(1)' : 'scale(1.04)',
                        transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1), transform 0.7s cubic-bezier(0.4,0,0.2,1)',
                        backgroundImage: `url(${s.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
            ))}

            {/* ── GRADIENT OVERLAY ── */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(105deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 65%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 1
            }} />

            {/* ── CONTENT ── */}
            {slides.map((slideItem, i) => (
                <div
                    key={`content-${slideItem.id}`}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '0 25px',
                        zIndex: 2,
                        opacity: i === current ? 1 : 0,
                        transition: 'opacity 0.5s ease',
                        pointerEvents: i === current ? 'auto' : 'none',
                    }}
                    onClick={() => { if (onCtaClick) onCtaClick(slideItem.ctaLink || '/tienda?viewAsGuest=true'); }}
                >
                    <span className="slide-tag" style={{ color: slideItem.accent || '#FF5722', fontWeight: 900, fontSize: '0.65rem', letterSpacing: '1px', marginBottom: '6px' }}>{slideItem.tag || 'DESTACADO'}</span>
                    <h2 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 900, lineHeight: 1.15, margin: '0 0 6px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                        {(slideItem.title || 'Explora Delva').split('\n').join(' ')}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 500, maxWidth: '200px', margin: 0 }}>{slideItem.subtitle || 'Los mejores productos en un solo lugar'}</p>
                </div>
            ))}

            {/* ── DOTS ── */}
            <div style={{
                position: 'absolute',
                bottom: '12px',
                right: '25px',
                display: 'flex',
                gap: '8px',
                pointerEvents: 'auto',
                zIndex: 3,
            }}>
                {slides.map((s, i) => (
                    <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); goTo(i); }}
                        style={{
                            width: i === current ? '22px' : '6px',
                            height: '6px',
                            borderRadius: '10px',
                            background: i === current ? (s.accent || '#FF5722') : 'rgba(255,255,255,0.3)',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            transition: 'all 0.3s ease',
                        }}
                    />
                ))}
            </div>
        </div>
        </div>
    );
};

export default GrandHeroCarousel;
