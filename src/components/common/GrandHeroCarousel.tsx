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
        accent: '#06b6d4',
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
}

const GrandHeroCarousel: React.FC<GrandHeroCarouselProps> = ({ onCtaClick }) => {
    const [current, setCurrent] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);   // unified pause (hover OR touch)
    const [isTransitioning, setIsTransitioning] = useState(false);
    const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    // Touch tracking refs
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

    const next = useCallback(() => goTo((current + 1) % HERO_SLIDES.length), [current, goTo]);
    const prev = useCallback(() => goTo((current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), [current, goTo]);

    // ── PROGRESS BAR TICK ──────────────────────────────────────────────────────
    useEffect(() => {
        if (isPaused) {
            if (progressRef.current) clearInterval(progressRef.current);
            return;
        }
        // Resume from where we left off
        startTimeRef.current = Date.now() - (progress / 100 * AUTOPLAY_DURATION);
        progressRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const pct = Math.min((elapsed / AUTOPLAY_DURATION) * 100, 100);
            setProgress(pct);
            if (pct >= 100) {
                if (progressRef.current) clearInterval(progressRef.current);
                setCurrent(prev => (prev + 1) % HERO_SLIDES.length);
                setProgress(0);
                startTimeRef.current = Date.now();
            }
        }, 50);
        return () => { if (progressRef.current) clearInterval(progressRef.current); };
    }, [current, isPaused]);

    // ── TOUCH / SWIPE HANDLERS ─────────────────────────────────────────────────
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        isSwiping.current = false;
        setIsPaused(true);   // pause autoplay while finger is down
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const dx = e.touches[0].clientX - touchStartX.current;
        const dy = e.touches[0].clientY - touchStartY.current;
        // Only treat as horizontal swipe if dx dominates
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
            isSwiping.current = true;
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (isSwiping.current) {
            if (dx < -40) next();       // swipe left  → next
            else if (dx > 40) prev();   // swipe right → prev
        }
        // Always resume autoplay a tick after finger lifts
        setTimeout(() => {
            setIsPaused(false);
            setProgress(0);
            startTimeRef.current = Date.now();
        }, 50);
    };

    const slide = HERO_SLIDES[current];

    return (
        <div
            // Mouse (desktop: pause on hover)
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => { setIsPaused(false); setProgress(0); startTimeRef.current = Date.now(); }}
            // Touch (mobile: swipe + resume)
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="grand-hero-root"
            style={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                borderRadius: '0 0 32px 32px',
                background: '#050a0f',
                userSelect: 'none',
            }}
        >
            {/* ── SLIDES ── */}
            {HERO_SLIDES.map((s, i) => (
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
                background: 'linear-gradient(105deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.48) 55%, rgba(0,0,0,0.18) 100%)',
                pointerEvents: 'none',
            }} />

            {/* ── CONTENT ── */}
            <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: 'clamp(20px, 5vw, 60px)',
                maxWidth: '620px',
                pointerEvents: 'none',   // let swipe pass through content
            }}>
                {/* Tag pill */}
                <div
                    key={`tag-${current}`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: slide.accent,
                        color: '#000',
                        padding: '4px 13px',
                        borderRadius: '30px',
                        fontSize: '0.58rem',
                        fontWeight: 900,
                        letterSpacing: '2px',
                        marginBottom: '12px',
                        width: 'fit-content',
                        animation: 'heroSlideUp 0.5s ease forwards',
                        boxShadow: `0 0 20px ${slide.accent}55`,
                    }}
                >
                    ✦ {slide.tag}
                </div>

                {/* Title */}
                <h2
                    key={`title-${current}`}
                    style={{
                        color: 'white',
                        fontSize: 'clamp(1.6rem, 5vw, 3.5rem)',
                        fontWeight: 900,
                        lineHeight: 1.1,
                        margin: '0 0 10px',
                        whiteSpace: 'pre-line',
                        textShadow: '0 2px 20px rgba(0,0,0,0.4)',
                        animation: 'heroSlideUp 0.5s 0.1s ease both',
                    }}
                >
                    {slide.title}
                </h2>

                {/* Subtitle — hide on very small screens */}
                <p
                    key={`sub-${current}`}
                    className="hero-subtitle"
                    style={{
                        color: 'rgba(255,255,255,0.75)',
                        fontSize: 'clamp(0.75rem, 2vw, 1rem)',
                        margin: '0 0 22px',
                        lineHeight: 1.5,
                        animation: 'heroSlideUp 0.5s 0.2s ease both',
                    }}
                >
                    {slide.subtitle}
                </p>

                {/* CTA Button */}
                <button
                    key={`cta-${current}`}
                    onClick={() => onCtaClick?.(slide.ctaLink)}
                    style={{
                        background: slide.accent,
                        color: '#000',
                        padding: '12px 28px',
                        borderRadius: '50px',
                        fontWeight: 900,
                        fontSize: '0.8rem',
                        letterSpacing: '1.5px',
                        border: 'none',
                        cursor: 'pointer',
                        width: 'fit-content',
                        boxShadow: `0 0 25px ${slide.accent}66, 0 4px 15px rgba(0,0,0,0.3)`,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        animation: 'heroSlideUp 0.5s 0.3s ease both',
                        pointerEvents: 'auto',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.03)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 35px ${slide.accent}88, 0 8px 25px rgba(0,0,0,0.35)`;
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(1)';
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 25px ${slide.accent}66, 0 4px 15px rgba(0,0,0,0.3)`;
                    }}
                >
                    {slide.cta} →
                </button>
            </div>

            {/* ── ARROWS (desktop only — hidden via CSS on mobile) ── */}
            <button onClick={prev} className="hero-arrow hero-arrow-left" aria-label="Anterior">‹</button>
            <button onClick={next} className="hero-arrow hero-arrow-right" aria-label="Siguiente">›</button>

            {/* ── BOTTOM CONTROLS ── */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '0 clamp(18px, 5vw, 50px) 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none',
            }}>
                {/* Dots */}
                <div style={{ display: 'flex', gap: '7px', alignItems: 'center', pointerEvents: 'auto' }}>
                    {HERO_SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            style={{
                                width: i === current ? '26px' : '7px',
                                height: '7px',
                                borderRadius: '10px',
                                background: i === current ? slide.accent : 'rgba(255,255,255,0.4)',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                                boxShadow: i === current ? `0 0 10px ${slide.accent}88` : 'none',
                            }}
                        />
                    ))}
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: slide.accent,
                        borderRadius: '10px',
                        transition: isPaused ? 'none' : 'width 0.05s linear',
                        boxShadow: `0 0 8px ${slide.accent}`,
                    }} />
                </div>
            </div>

            {/* Slide counter */}
            <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '2px',
                pointerEvents: 'none',
            }}>
                {String(current + 1).padStart(2, '0')} / {String(HERO_SLIDES.length).padStart(2, '0')}
            </div>
        </div>
    );
};

export default GrandHeroCarousel;
