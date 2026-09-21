'use client';

import { useState, useEffect } from 'react';

// Botón de instalar (solo icono) para la cabecera. Solo aparece si la app se puede instalar.
export default function PWAInstallPrompt() {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [canInstall, setCanInstall] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        // Se esconde solo si ESTA app está instalada y abierta como app: avisó `appinstalled`, o
        // llegó con `?source=pwa` (el manifiesto arranca ahí: solo pasa al abrirla desde su ícono).
        // "Modo app" solo no basta: si DELVA se abre desde dentro de otra app instalada (p. ej.
        // BogaHub) el navegador también dice "modo app", y ahí el botón tiene que aparecer.
        const params = new URLSearchParams(window.location.search);
        if (params.get('source') === 'pwa') {
            localStorage.setItem('delva_pwa_installed', 'true');
            params.delete('source');
            const q = params.toString();
            window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : '') + window.location.hash);
        }
        // También cuenta como instalada si está en modo app y NO llegó desde otro origen (abierta
        // desde su ícono): cubre las apps instaladas antes de existir la marca. Los links de BogaHub
        // a Delva no llevan `noreferrer` justamente para poder distinguir este caso.
        const llegoDeOtroOrigen = (() => {
            try { return !!document.referrer && new URL(document.referrer).origin !== window.location.origin; } catch { return false; }
        })();
        // En iPhone no hay forma de saber desde afuera si la app está instalada: el usuario lo dice
        // con "Ya la tengo instalada" en la guía y eso se respeta.
        if (localStorage.getItem('delva_pwa_manual') === 'true') return;
        const enModoApp = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
        if (enModoApp && (localStorage.getItem('delva_pwa_installed') === 'true' || !llegoDeOtroOrigen)) return;

        const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
        setIsIOS(ios);
        setCanInstall(true); // siempre visible; si el navegador no da el aviso nativo, se muestra una guía
        if (ios) return;

        const onPrompt = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
            setCanInstall(true);
        };
        const onInstalled = () => { localStorage.setItem('delva_pwa_installed', 'true'); setCanInstall(false); setInstallPrompt(null); };

        window.addEventListener('beforeinstallprompt', onPrompt);
        window.addEventListener('appinstalled', onInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', onPrompt);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const install = async () => {
        // Dentro de otra app instalada no se puede instalar una segunda: invitar a abrirla en el navegador.
        const enOtraApp = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
        if (enOtraApp && !installPrompt) {
            // iPhone: abierta dentro del navegador integrado de otra app (BogaHub). Ese navegador tiene
            // su PROPIO botón de compartir (barra de abajo) con "Agregar a Inicio"; la hoja de
            // `navigator.share` no la trae. Se guía al de la barra en vez de abrir la nuestra.
            if (/iphone|ipad|ipod/i.test(navigator.userAgent)) { setShowIOSGuide(true); return; }
            const url = window.location.href;
            navigator.clipboard?.writeText(url).catch(() => {});
            if (navigator.share) navigator.share({ title: 'DELVA', text: 'Instala la app de DELVA', url }).catch(() => {});
            else alert(`Para instalar DELVA como app aparte, abre este link en tu navegador (Chrome o Safari), no desde aquí dentro. Se copió el link:

${url}`);
            return;
        }
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
                        <button onClick={() => { try { localStorage.setItem('delva_pwa_manual', 'true'); } catch {} setCanInstall(false); setShowIOSGuide(false); }} style={{ width: '100%', marginTop: '10px', padding: '8px', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 700, opacity: 0.55, textDecoration: 'underline', cursor: 'pointer' }}>Ya la tengo instalada</button>
                    </div>
                    {/* Flecha que apunta a la barra del navegador, donde está el botón Compartir */}
                    <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(14px + env(safe-area-inset-bottom))', textAlign: 'center', color: 'white', fontWeight: 800, animation: 'delvaFlecha 1s ease-in-out infinite' }}>
                        <div style={{ fontSize: '0.8rem', letterSpacing: '0.02em' }}>Compartir está aquí abajo</div>
                        <div style={{ fontSize: '2rem', lineHeight: 1 }}>&#11015;</div>
                    </div>
                    <style>{`@keyframes delvaFlecha{0%,100%{transform:translateY(0)}50%{transform:translateY(10px)}}`}</style>
                </div>
            )}
        </>
    );
}
