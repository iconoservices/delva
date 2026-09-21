'use client';
import React from 'react';

interface ProductCarouselProps {
    children: React.ReactNode;
    interval?: number; // ms entre avances
}

// Carrusel horizontal que avanza solo, con flechas; se pausa al tocarlo o pasar el mouse.
const ProductCarousel: React.FC<ProductCarouselProps> = ({ children, interval = 3500 }) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const pausedUntil = React.useRef(0);
    const [canScroll, setCanScroll] = React.useState(false);

    const step = () => {
        const el = ref.current;
        if (!el) return 0;
        const first = el.firstElementChild as HTMLElement | null;
        return first ? first.offsetWidth + 12 : el.clientWidth * 0.8;
    };

    const go = (dir: 1 | -1) => {
        const el = ref.current;
        if (!el) return;
        const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
        if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: 'smooth' });
        else if (dir === -1 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
        else el.scrollBy({ left: dir * step(), behavior: 'smooth' });
    };

    const pause = (ms = 6000) => { pausedUntil.current = Date.now() + ms; };

    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const measure = () => setCanScroll(el.scrollWidth > el.clientWidth + 4);
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [children]);

    React.useEffect(() => {
        if (!canScroll) return;
        const id = setInterval(() => {
            if (Date.now() < pausedUntil.current || document.hidden) return;
            go(1);
        }, interval);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canScroll, interval]);

    return (
        <div
            className="pcar"
            onMouseEnter={() => pause(60000)}
            onMouseLeave={() => pause(1500)}
            onTouchStart={() => pause()}
            onWheel={() => pause()}
        >
            <div className="pcar-track" ref={ref} onPointerDown={() => pause()}>
                {children}
            </div>
            {canScroll && (
                <>
                    <button className="pcar-arrow pcar-prev" aria-label="Anterior" onClick={() => { pause(); go(-1); }}>‹</button>
                    <button className="pcar-arrow pcar-next" aria-label="Siguiente" onClick={() => { pause(); go(1); }}>›</button>
                </>
            )}
        </div>
    );
};

export default ProductCarousel;
