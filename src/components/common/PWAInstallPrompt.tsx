import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Ocultar si ya está instalada
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowBanner(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
        }
        setInstallPrompt(null);
    };

    if (!showBanner) return null;

    return (
        <div className="pwa-banner fade-in">
            <div className="pwa-content">
                <span style={{ fontSize: '1.5rem' }}>🌿</span>
                <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem' }}>Instala DELVA</p>
                    <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.8 }}>Acceso rápido y mejor experiencia</p>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowBanner(false)} style={{ background: 'transparent', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem' }}>Omitir</button>
                <button onClick={handleInstallClick} className="btn-vibrant" style={{ padding: '8px 15px', borderRadius: '12px', fontSize: '0.75rem' }}>INSTALAR</button>
            </div>
        </div>
    );
}
