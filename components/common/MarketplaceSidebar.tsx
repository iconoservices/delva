import React from 'react';
import { CategoryMenu } from './CategoryMenu';
import { ShortcutRibbon } from './ShortcutRibbon';

interface MarketplaceSidebarProps {
    activeGlobalFilter: string;
    setActiveGlobalFilter: (id: any) => void;
    globalCategories: any[];
    localActiveCat: string;
    handleCategoryChange: (id: string) => void;
    availableColors: string[];
    activeColor: string;
    setActiveColor: (color: string) => void;
    showShortcuts?: boolean;
}

export const MarketplaceSidebar: React.FC<MarketplaceSidebarProps> = ({
    activeGlobalFilter,
    setActiveGlobalFilter,
    globalCategories,
    localActiveCat,
    handleCategoryChange,
    availableColors,
    activeColor,
    setActiveColor,
    showShortcuts = true
}) => {
    const ref = React.useRef<HTMLElement>(null);

    // Si la barra es más alta que la pantalla, se desplaza con la página hasta ver su final y ahí se fija.
    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const update = () => {
            const top = Math.min(84, window.innerHeight - el.offsetHeight - 16);
            el.style.top = `${top}px`;
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        window.addEventListener('resize', update);
        return () => { ro.disconnect(); window.removeEventListener('resize', update); };
    }, []);

    return (
        <aside ref={ref} className="market-sidebar" style={{
            width: '260px',
            flexShrink: 0,
            position: 'sticky',
            top: '84px',
            height: 'fit-content',
            paddingTop: '14px',
            paddingBottom: '40px'
        }}>
            {/* ── ACTION SHORTCUTS (Horizontal Row in Sidebar) ── */}
            {showShortcuts && (
                <>
                    <h4 style={{ fontSize: '0.7rem', fontWeight: 950, color: '#aaa', marginBottom: '4px', letterSpacing: '2px', textTransform: 'uppercase' }}>DESTACADOS</h4>
                    <div className="sidebar-chips">
                        <ShortcutRibbon activeGlobalFilter={activeGlobalFilter} setActiveGlobalFilter={setActiveGlobalFilter} />
                    </div>
                    <div style={{ height: '1px', background: '#eee', margin: '15px 0' }} />
                </>
            )}

            {/* ── CATEGORIES ── */}
            <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.7rem', fontWeight: 950, color: '#aaa', marginLeft: '15px', marginBottom: '10px', letterSpacing: '2px', textTransform: 'uppercase' }}>EXPLORAR POR</h4>
                <CategoryMenu
                    variant="sidebar"
                    categories={[{ id: 'all', name: 'Todo' }, ...globalCategories.filter(c => c.id !== 'all' && c.name !== 'Todos' && c.name !== 'Todo')]}
                    activeCategory={localActiveCat}
                    setActiveCategory={handleCategoryChange}
                />
            </div>

            <div style={{ height: '1px', background: '#eee', margin: '20px 0' }} />

            {/* ── COLORS ── */}
            {availableColors.length > 0 && (
                <div style={{ marginBottom: '35px', padding: '0 15px' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 950, color: '#aaa', marginBottom: '15px', letterSpacing: '1px' }}>FILTRAR POR COLOR</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {activeColor && (
                            <button onClick={() => setActiveColor('')} style={{ background: '#f0f0f0', border: 'none', borderRadius: '10px', padding: '5px 12px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}>Limpiar ✕</button>
                        )}
                        {availableColors.map(c => (
                            <button
                                key={c}
                                onClick={() => setActiveColor(activeColor === c ? '' : c)}
                                style={{
                                    width: '26px', height: '26px', borderRadius: '50%', background: c,
                                    border: activeColor === c ? '3px solid var(--primary)' : '2px solid #eee',
                                    cursor: 'pointer', transition: '0.2s',
                                    transform: activeColor === c ? 'scale(1.1)' : 'scale(1)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Sidebar Info Card */}
            <div style={{ background: '#f9f9f9', borderRadius: '20px', padding: '20px', border: '1px solid #eee', margin: '0 10px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: '12px' }}>🎯 Filtros Pro</h4>
                    <p style={{ fontSize: '0.75rem', color: '#666', lineHeight: 1.5 }}>
                        Estas viendo la selección inteligente de Delva para hoy.
                    </p>
                </div>
                <div style={{ opacity: 0.3 }}>
                    <h5 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#999', margin: 0 }}>ORDENAR POR (Próximamente)</h5>
                </div>
            </div>
        </aside>
    );
};
