'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [canZoom, setCanZoom] = useState(false);

  const scannerInstanceRef = useRef<Html5QrcodeScanner | null>(null);
  const coreRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 1. Cargar cámaras (Solo para móviles/selector)
  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        setCameras(devices);
        const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('trasera')
        );
        setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
      }
    }).catch(err => {
      console.error("Error cámaras", err);
    });
  }, []);

  // --- ESCÁNER HÍBRIDO (Misma lógica PC para todos) ---
  const startScanner = useCallback((id: string, isMob: boolean) => {
    // Limpieza previa
    if (scannerInstanceRef.current) {
        scannerInstanceRef.current.clear().catch(() => {});
    }

    const scanner = new Html5QrcodeScanner(
      id,
      { 
        fps: 10, 
        qrbox: 250, // Cuadrado estándar infalible
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        rememberLastUsedCamera: true
      },
      false
    );

    scannerInstanceRef.current = scanner;

    scanner.render((decodedText) => {
        onScan(decodedText);
    }, () => {});

    // Capturar instancia CORE para controles manuales (Flash/Zoom)
    setTimeout(() => {
        // En móviles, intentamos detectar hardware extra
        const video = document.querySelector(`#${id} video`) as HTMLVideoElement;
        if (video && video.srcObject) {
            const stream = video.srcObject as MediaStream;
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities() as any;
            if (capabilities.torch) setHasFlash(true);
            if (capabilities.zoom) setCanZoom(true);
        }
    }, 2000);

  }, [onScan]);

  useEffect(() => {
    const timer = setTimeout(() => {
        startScanner(isMobile ? "reader-mobile" : "reader-pc", isMobile);
    }, 500);
    return () => clearTimeout(timer);
  }, [isMobile, startScanner]);

  useEffect(() => {
    return () => {
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.clear().catch(() => {});
      }
    };
  }, []);

  // Lógica de Controles Manuales (Solo móviles)
  const toggleFlash = async () => {
    try {
        const video = document.querySelector("#reader-mobile video") as HTMLVideoElement;
        const track = (video.srcObject as MediaStream).getVideoTracks()[0];
        const newState = !isFlashOn;
        await track.applyConstraints({
            advanced: [{ torch: newState }] as any
        });
        setIsFlashOn(newState);
    } catch (e) {
        console.error(e);
    }
  };

  const applyZoom = async (lvl: number) => {
    try {
        const video = document.querySelector("#reader-mobile video") as HTMLVideoElement;
        const track = (video.srcObject as MediaStream).getVideoTracks()[0];
        await track.applyConstraints({
            advanced: [{ zoom: lvl }] as any
        });
        setZoom(lvl);
    } catch (e) {
        console.error(e);
    }
  };

  if (!isMobile) {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'white', borderRadius: '35px', width: '100%', maxWidth: '500px', padding: '30px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ margin: 0, fontWeight: 900, color: 'var(--primary)', fontSize: '1.4rem' }}>Inventario Delva PC 🌿</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Escaneo robusto garantizado</p>
              </div>
              <button onClick={onClose} style={{ background: '#f0f0f0', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontWeight: 900, fontSize: '1.1rem', color: '#666' }}>✕</button>
            </div>
            <div id="reader-pc" style={{ width: '100%', overflow: 'hidden', borderRadius: '25px', border: '2px solid #eee' }}></div>
          </div>
        </div>
    );
  }

  // RENDER MÓVIL HÍBRIDO (DISEÑO BONITO + MOTOR ROBUSTO)
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'black', zIndex: 10000, color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* OCULTAR UI NATIVA PERO MANTENER MOTOR */}
      <style>{`
        #reader-mobile { border: none !important; }
        #reader-mobile img { display: none !important; }
        #reader-mobile span { display: none !important; }
        #reader-mobile button { display: none !important; }
        #reader-mobile__dashboard { display: none !important; }
        #reader-mobile__status_span { display: none !important; }
        #reader-mobile video { width: 100vw !important; height: 100vh !important; object-fit: cover !important; position: absolute !important; top: 0 !important; left: 0 !important; }
        /* Ocultar el cuadro blanco por defecto porque pondremos el nuestro */
        #reader-mobile__scanner_region > div { border: none !important; background: transparent !important; }
      `}</style>

      {/* MOTOR INVISIBLE DETRÁS */}
      <div id="reader-mobile" style={{ width: '100vw', height: '100vh', background: 'black' }}></div>

      {/* OVERLAY NATIVO IPHONE */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 100, pointerEvents: 'none' }}>
          
          {/* Header */}
          <div style={{ padding: '25px 20px', background: 'linear-gradient(rgba(0,0,0,0.85), transparent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
              <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#00ff88' }}>Escáner Delva</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8, fontWeight: 700 }}>MOTOR HÍBRIDO - 2026</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                  {hasFlash && (
                      <button onClick={toggleFlash} style={{ width: '44px', height: '44px', borderRadius: '50%', background: isFlashOn ? '#00ff88' : 'rgba(255,255,255,0.2)', border: 'none', color: isFlashOn ? 'black' : 'white', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isFlashOn ? '🔆' : '🔦'}
                      </button>
                  )}
                  <button 
                    onClick={onClose} 
                    style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '1.4rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >×</button>
              </div>
          </div>

          {/* Visor Cuadrado Centrado */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              
              {/* Sombra (Shroud) */}
              <div style={{ 
                  position: 'absolute', 
                  width: '260px', 
                  height: '260px', 
                  borderRadius: '35px',
                  boxShadow: '0 0 0 2000px rgba(0,0,0,0.8)', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
              }}>
                  {/* Marco Verde */}
                  <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      border: '3px solid #00ff88', 
                      borderRadius: '35px',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 0 20px rgba(0,255,136,0.3)'
                  }}>
                      <div className="scanner-laser-line" style={{ height: '3px', background: '#00ff88', boxShadow: '0 0 20px #00ff88' }} />
                  </div>
              </div>

              {/* Controles de Zoom */}
              {canZoom && (
                  <div style={{ position: 'absolute', bottom: '15%', display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
                      {[1.0, 1.5, 2.0].map(lvl => (
                          <button 
                            key={lvl}
                            onClick={() => applyZoom(lvl)}
                            style={{ 
                                width: '44px', height: '44px', borderRadius: '50%', 
                                background: zoom === lvl ? '#00ff88' : 'rgba(255,255,255,0.15)',
                                color: zoom === lvl ? 'black' : 'white',
                                border: 'none', fontWeight: 900, fontSize: '0.75rem', 
                                cursor: 'pointer', backdropFilter: 'blur(10px)'
                            }}>
                              {lvl}x
                          </button>
                      ))}
                  </div>
              )}
          </div>

          {/* Footer Informativo */}
          <div style={{ padding: '40px 20px 60px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: 'rgba(0,255,136,0.1)', padding: '12px 25px', borderRadius: '25px', border: '1px solid rgba(0,255,136,0.3)', backdropFilter: 'blur(10px)' }}>
                <span style={{ fontSize: '0.8rem', color: '#00ff88', fontWeight: 900 }}>CENTRA EL CÓDIGO AQUÍ</span>
              </div>
          </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
