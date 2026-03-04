import { useState, useEffect } from 'react';

interface PWAStats {
    visitCount: number;
    lastVisit: number;
    isInstalled: boolean;
}

export default function PWAInstallPrompt() {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);

    // Recuperar o inicializar estadísticas
    const getStats = (): PWAStats => {
        const saved = localStorage.getItem('delva_pwa_stats');
        if (saved) return JSON.parse(saved);
        return { visitCount: 0, lastVisit: Date.now(), isInstalled: false };
    };

    const saveStats = (stats: PWAStats) => {
        localStorage.setItem('delva_pwa_stats', JSON.stringify(stats));
    };

    useEffect(() => {
        const isPWA = window.matchMedia('(display-mode: standalone)').matches;
        if (isPWA) {
            localStorage.removeItem('delva_pwa_stats'); // Cleanup
            return;
        }

        const stats = getStats();
        const now = Date.now();
        const hoursSinceLastVisit = (now - stats.lastVisit) / (1000 * 60 * 60);

        // Actualizar estadísticas para esta visita
        const newStats: PWAStats = {
            visitCount: stats.visitCount + 1,
            lastVisit: now,
            isInstalled: false
        };
        saveStats(newStats);

        const handler = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);

            // --- LÓGICA ASIMÉTRICA DE ACTIVACIÓN ---

            // Caso Visita 1: Descubrimiento (3 segundos)
            if (newStats.visitCount === 1) {
                setTimeout(() => setShowBanner(true), 3000);
            }

            // Caso Visita 2: Contextual (Scroll 50%)
            else if (newStats.visitCount === 2) {
                const checkScroll = () => {
                    const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
                    if (scrollPercent >= 0.5) {
                        setShowBanner(true);
                        window.removeEventListener('scroll', checkScroll);
                    }
                };
                window.addEventListener('scroll', checkScroll);
                return () => window.removeEventListener('scroll', checkScroll);
            }

            // Caso Visita 3: Recordatorio Tardío (15-20 segs)
            else if (newStats.visitCount === 3) {
                setTimeout(() => setShowBanner(true), 18000);
            }

            // Caso Visita 4+ (Loop de persistencia: cada 5 visitas o > 48h)
            else {
                const shouldShowByLoop = newStats.visitCount % 5 === 0;
                const shouldShowByInactivity = hoursSinceLastVisit >= 48;

                if (shouldShowByLoop || shouldShowByInactivity) {
                    setTimeout(() => setShowBanner(true), 10000); // 10s de lag por respeto
                }
            }
        };

        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', () => {
            setShowBanner(false);
            localStorage.removeItem('delva_pwa_stats');
        });

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowBanner(false);
        }
    };

    if (!showBanner) return null;

    return (
        <div className="pwa-banner fade-in">
            <div className="pwa-content">
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(26,60,52,0.2)' }}>
                    🌿
                </div>
                <div>
                    <p style={{ margin: 0, fontWeight: 900, fontSize: '0.85rem', color: 'var(--primary)', letterSpacing: '-0.2px' }}>Lleva la Selva Contigo</p>
                    <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, fontWeight: 600 }}>Instala DELVA y compra sin interrupciones</p>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => setShowBanner(false)} style={{ background: 'transparent', color: 'rgba(0,0,0,0.3)', fontWeight: 800, fontSize: '0.7rem', padding: '8px' }}>AHORA NO</button>
                <button onClick={handleInstallClick} className="btn-vibrant" style={{ padding: '10px 18px', borderRadius: '14px', fontSize: '0.75rem', fontWeight: 900, boxShadow: '0 4px 15px rgba(255,87,34,0.3)' }}>INSTALAR ✨</button>
            </div>
        </div>
    );
}
