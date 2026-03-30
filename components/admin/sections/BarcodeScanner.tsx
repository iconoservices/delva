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

  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 1. Cargar cámaras
  useEffect(() => {
    if (!isMobile) return;
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
      setError("Permiso denegado o sin cámara.");
    });
  }, [isMobile]);

  // --- LÓGICA VISTA PC (RESTAURADA AL ORIGINAL) ---
  useEffect(() => {
    if (isMobile) return;

    const scanner = new Html5QrcodeScanner(
      "reader-pc",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
      },
      false
    );

    scanner.render((decodedText) => {
        scanner.clear().then(() => onScan(decodedText)).catch(() => onScan(decodedText));
    }, () => {});

    return () => {
      scanner.clear().catch(err => console.warn("Scanner cleanup failed", err));
    };
  }, [isMobile, onScan]);

  // --- LÓGICA VISTA MÓVIL ---
  
  const toggleFlash = async () => {
    if (!scannerInstanceRef.current || !hasFlash) return;
    try {
        const newState = !isFlashOn;
        await scannerInstanceRef.current.applyVideoConstraints({
            //@ts-ignore
            advanced: [{ torch: newState }]
        });
        setIsFlashOn(newState);
    } catch (e) {
        console.error("Error toggling flash", e);
    }
  };

  const startScanningOnCamera = useCallback(async (cameraId: string) => {
    if (!scannerInstanceRef.current) {
        scannerInstanceRef.current = new Html5Qrcode("reader-mobile");
    }
    const scanner = scannerInstanceRef.current;

    try {
        setIsStarting(true);
        setError(null);
        if (scanner.isScanning) await scanner.stop();

        const config = {
            fps: 30,
            qrbox: (viewWidth: number, viewHeight: number) => {
                // Match visual CSS: 300x150
                return { width: 300, height: 150 };
            },
            aspectRatio: window.innerWidth / window.innerHeight,
            videoConstraints: {
                deviceId: { exact: cameraId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: "environment",
                focusMode: "continuous"
            }
        };

        await scanner.start(
            cameraId,
            config,
            (decodedText) => {
                scanner.stop().then(() => onScan(decodedText)).catch(() => onScan(decodedText));
            },
            () => {}
        );
        
        // Revisar si soporta flash
        // Revisar si soporta flash
        const capabilities = scanner.getRunningTrackCapabilities();
        if ((capabilities as any).torch) setHasFlash(true);
        
        setIsStarting(false);
    } catch (err) {
        console.error("Camera Switch Error:", err);
        setError("Lente no disponible.");
        setIsStarting(false);
    }
  }, [onScan]);

  useEffect(() => {
    if (!isMobile || !selectedCameraId) return;
    startScanningOnCamera(selectedCameraId);
  }, [isMobile, selectedCameraId, startScanningOnCamera]);

  useEffect(() => {
    return () => {
        if (scannerInstanceRef.current?.isScanning) {
            scannerInstanceRef.current.stop().catch(e => console.log("Final stop error", e));
        }
    };
  }, []);

  if (!isMobile) {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'white', borderRadius: '35px', width: '100%', maxWidth: '500px', padding: '30px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ margin: 0, fontWeight: 900, color: 'var(--primary)', fontSize: '1.4rem' }}>Inventario Delva PC 🌿</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Escaneo con cámara web</p>
              </div>
              <button onClick={onClose} style={{ background: '#f0f0f0', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontWeight: 900, fontSize: '1.1rem', color: '#666' }}>✕</button>
            </div>
            <div id="reader-pc" style={{ width: '100%', overflow: 'hidden', borderRadius: '25px', border: '2px solid #eee' }}></div>
          </div>
        </div>
    );
  }

  // RENDER MÓVIL PREMIUM
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'black', zIndex: 10000, color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* OCULTAR INTERFAZ INTERNA DE LA LIBRERÍA DE FORMA AGRESIVA */}
      <style>{`
        #reader-mobile { border: none !important; }
        #reader-mobile__region { display: none !important; }
        #reader-mobile__scanner_region { display: none !important; }
        #reader-mobile img { display: none !important; }
        #reader-mobile span { display: none !important; }
        #reader-mobile button { display: none !important; }
        #reader-mobile video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
        }
      `}</style>

      <div id="reader-mobile" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}></div>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 11, pointerEvents: 'none' }}>
          
          {/* Header Minimalista */}
          <div style={{ padding: '25px 20px', background: 'linear-gradient(rgba(0,0,0,0.85), transparent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto', backdropFilter: 'blur(5px)' }}>
              <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#00ff88', letterSpacing: '-0.5px' }}>Lector Delva</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.7, fontWeight: 600 }}>ALTA PRECISIÓN HD</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                  {hasFlash && (
                      <button onClick={toggleFlash} style={{ width: '44px', height: '44px', borderRadius: '50%', background: isFlashOn ? '#00ff88' : 'rgba(255,255,255,0.15)', border: 'none', color: isFlashOn ? 'black' : 'white', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isFlashOn ? '🔆' : '🔦'}
                      </button>
                  )}
                  <button onClick={onClose} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '1.3rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
          </div>

          {/* Shroud / Overlay Central (Asegurando alineación perfecta) */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              {/* Nuevo Shroud: Un solo div con borde gigante para evitar huecos o superposiciones */}
              <div style={{ 
                  position: 'absolute', 
                  width: '300px', 
                  height: '150px', 
                  borderRadius: '24px',
                  boxShadow: '0 0 0 1000px rgba(0,0,0,0.85)',
                  zIndex: 1
              }} />

              {/* Visor Único Limpio */}
              <div className="scanner-viewfinder-frame" style={{ 
                  width: '300px', 
                  height: '150px', 
                  position: 'relative', 
                  zIndex: 2,
                  overflow: 'hidden', 
                  border: '3px solid #00ff88', 
                  borderRadius: '24px',
                  backgroundColor: 'transparent'
              }}>
                  <div className="scanner-laser-line" style={{ height: '3px', background: '#00ff88', boxShadow: '0 0 20px #00ff88' }} />
              </div>

              {isStarting && <div style={{ position: 'absolute', zIndex: 10, background: 'rgba(0,255,136,0.2)', padding: '10px 20px', borderRadius: '20px', color: '#00ff88', fontWeight: 900, fontSize: '0.8rem', bottom: '20%', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,255,136,0.3)' }}>CALIBRANDO LENTE...</div>}
              {error && <div style={{ position: 'absolute', zIndex: 10, bottom: '20%', background: 'rgba(255,60,60,0.9)', padding: '12px 25px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>{error}</div>}
          </div>

          {/* Footer Selector Moderno */}
          <div style={{ padding: '40px 20px 60px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ margin: '0 0 20px', fontSize: '0.85rem', fontWeight: 700 }}>Toca para cambiar de lente:</p>
              
              <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '12px', 
                  width: '100%', 
                  maxWidth: '340px' 
              }}>
                {cameras.map((cam, i) => (
                    <button
                        key={cam.id}
                        onClick={() => setSelectedCameraId(cam.id)}
                        disabled={isStarting}
                        style={{
                            padding: '18px 10px',
                            borderRadius: '24px',
                            border: 'none',
                            background: selectedCameraId === cam.id ? '#00ff88' : 'rgba(255,255,255,0.15)',
                            color: selectedCameraId === cam.id ? 'black' : 'white',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            opacity: isStarting ? 0.5 : 1,
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: selectedCameraId === cam.id ? '0 0 20px rgba(0,255,136,0.5)' : 'none'
                        }}
                    >
                        <span style={{ fontSize: '0.9rem', marginBottom: '4px' }}>LENTE {i + 1}</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 600 }}>
                            {cam.label.replace('Camera ', '').split('(')[0] || 'Cámara'}
                        </span>
                    </button>
                ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
