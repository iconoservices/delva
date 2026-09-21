'use client';

import { useState, useEffect } from 'react';

// Botón de instalar (solo icono) para la cabecera. Solo aparece si la app se puede instalar.
export default function PWAInstallPrompt() {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [canInstall, setCanInstall] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        // Ya instalada (abierta como app): no mostrar nada
        if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) return;

        const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
        setIsIOS(ios);
        setCanInstall(true); // siempre visible; si el navegador no da el aviso nativo, se muestra una guía
        if (ios) return;

        const onPrompt = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
            setCanInstall(true);
        };
        const onInstalled = () => { setCanInstall(false); setInstallPrompt(null); };

        window.addEventListener('beforeinstallprompt', onPrompt);
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', onPrompt);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const install = async () => {
        if (isIOS || !installPrompt) { setShowIOSGuide(true); return; }
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') setCanInstall(false);
    };

    if (!canInstall) return null;

    return (
        <>
            <button className="nav-icon-btn" aria-label="Instalar app" title="Instalar app" onClick={install}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" />
                </svg>
            </button>

            {/* --- GUÍA VISUAL PARA iOS --- */}
            {showIOSGuide && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 20000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div className="fade-in" style={{ background: 'white', maxWidth: '340px', width: '100%', borderRadius: '35px', padding: '40px', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
                        <span style={{ fontSize: '2.5rem' }}>{isIOS ? '🍎' : '📲'}</span>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 900, marginTop: '15px', marginBottom: '10px', color: 'var(--primary)' }}>{isIOS ? 'Instalar en iPhone' : 'Instalar la app'}</h2>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7, lineHeight: 1.6, marginBottom: '25px' }}>
                            Para instalar <b>DELVA</b> en tu pantalla de inicio:
                        </p>
                        <div style={{ textAlign: 'left', background: '#f5f5f5', padding: '20px', borderRadius: '20px', fontSize: '0.85rem', marginBottom: '30px' }}>
                            {isIOS ? (
                                <>
                                    <p style={{ margin: '8px 0' }}>1. Toca el botón <b>Compartir</b> (el cuadrito con la flecha ↑ abajo).</p>
                                    <p style={{ margin: '8px 0' }}>2. Desliza hacia abajo y elige <b>&quot;Agregar a inicio&quot;</b> (+).</p>
                                </>
                            ) : (
                                <>
                                    <p style={{ margin: '8px 0' }}>1. Abre el <b>menú del navegador</b> (⋮ o ⋯).</p>
                                    <p style={{ margin: '8px 0' }}>2. Elige <b>&quot;Instalar app&quot;</b> o <b>&quot;Agregar a la pantalla de inicio&quot;</b>.</p>
                                </>
                            )}
                        </div>
                        <button onClick={() => setShowIOSGuide(false)} className="btn-vibrant" style={{ width: '100%', padding: '15px', borderRadius: '18px', fontWeight: 900 }}>ENTENDIDO</button>
                    </div>
                </div>
            )}
        </>
    );
}
