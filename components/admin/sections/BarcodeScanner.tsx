'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

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

  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 1. Cargar cámaras
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
      setError("Permisos denegados.");
    });
  }, []);

  // --- LÓGICA DE ESCANEO (REPLICADA DE LA VERSIÓN EXITOSA) ---
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
        console.error("Error flash", e);
    }
  };

  const applyZoom = async (lvl: number) => {
    if (!scannerInstanceRef.current || !canZoom) return;
    try {
        await scannerInstanceRef.current.applyVideoConstraints({
            //@ts-ignore
            advanced: [{ zoom: lvl }]
        });
        setZoom(lvl);
    } catch (e) {
        console.error("Error zoom", e);
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
            fps: 25, // Velocidad máxima original
            qrbox: { width: 300, height: 160 }, // Área rectangular horizontal
            aspectRatio: window.innerWidth / window.innerHeight,
            videoConstraints: {
                deviceId: { exact: cameraId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: "environment"
            }
        };

        await scanner.start(
            cameraId,
            config,
            (decodedText) => {
                // LLAMADA DIRECTA (Éxito garantizado)
                onScan(decodedText);
                scanner.stop().catch(() => {});
            },
            () => {} 
        );
        
        const capabilities = scanner.getRunningTrackCapabilities();
        if ((capabilities as any).torch) setHasFlash(true);
        if ((capabilities as any).zoom) {
            setCanZoom(true);
            setZoom(1);
        } else {
            setCanZoom(false);
        }
        setIsStarting(false);
    } catch (err) {
        console.error("Switch Lens Error", err);
        setError("Error de lente.");
        setIsStarting(false);
    }
  }, [onScan]);

  useEffect(() => {
    if (isMobile && selectedCameraId) {
        startScanningOnCamera(selectedCameraId);
    }
  }, [isMobile, selectedCameraId, startScanningOnCamera]);

  useEffect(() => {
    return () => {
        if (scannerInstanceRef.current?.isScanning) {
            scannerInstanceRef.current.stop().catch(() => {});
        }
    };
  }, []);

  // VISTA PC (Simple)
  if (!isMobile) {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'white', borderRadius: '35px', width: '100%', maxWidth: '500px', padding: '30px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ margin: 0, fontWeight: 900, color: '#00ff88', fontSize: '1.4rem', textShadow: '0 0 10px rgba(0,255,136,0.3)' }}>Inventario Delva 🌿</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Escaneo con cámara web</p>
              </div>
              <button onClick={onClose} style={{ background: '#f0f0f0', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontWeight: 900 }}>✕</button>
            </div>
            <div id="reader-mobile" style={{ width: '100%', overflow: 'hidden', borderRadius: '25px', border: '2px solid #eee' }}></div>
          </div>
        </div>
    );
  }

  // VISTA MÓVIL PREMIUM (CALCO DE LA CAPTURA)
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'black', zIndex: 10000, color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* LIMPIEZA RADICAL DE LA LIBERÍA */}
      <style>{`
        #reader-mobile { border: none !important; }
        #reader-mobile__region { display: none !important; opacity: 0 !important; }
        #reader-mobile__scanner_region { display: none !important; }
        #reader-mobile video { width: 100vw !important; height: 100vh !important; object-fit: cover !important; position: absolute !important; top: 0 !important; left: 0 !important; }
        #reader-mobile__scanner_region > div { display: none !important; border: none !important; }
      `}</style>

      {/* MOTOR DE CÁMARA */}
      <div id="reader-mobile" style={{ width: '100vw', height: '100vh', background: 'black' }}></div>

      {/* OVERLAY NATIVO IPHONE (Z-INDEX 100) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 100, pointerEvents: 'none' }}>
          
          {/* Header Superior */}
          <div style={{ padding: '30px 20px', background: 'linear-gradient(rgba(0,0,0,0.85), transparent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
              <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#00ff88', textShadow: '0 0 15px rgba(0,255,136,0.5)' }}>Escáner Delva</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9, fontWeight: 700, letterSpacing: '0.5px' }}>VERSIÓN LIMPIA - HD</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                  {hasFlash && (
                      <button onClick={toggleFlash} style={{ width: '48px', height: '48px', borderRadius: '50%', background: isFlashOn ? '#00ff88' : 'rgba(255,255,255,0.15)', border: 'none', color: isFlashOn ? 'black' : 'white', fontSize: '1.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', transition: 'all 0.2s' }}>
                          {isFlashOn ? '🔆' : '🔦'}
                      </button>
                  )}
                  <button 
                    onClick={onClose} 
                    style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '1.5rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
                  >×</button>
              </div>
          </div>

          {/* Área Central: Shroud + Visor */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              
              {/* SHROUD UNIFICADO (Sombra con agujero perfecto 300x160) */}
              <div style={{ 
                  position: 'absolute', 
                  width: '300px', 
                  height: '160px', 
                  borderRadius: '35px',
                  boxShadow: '0 0 0 2000px rgba(0,0,0,0.8)', 
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
              }}>
                  {/* MARCO VERDE NEÓN */}
                  <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      border: '3.5px solid #00ff88', 
                      borderRadius: '35px',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 0 25px rgba(0,255,136,0.4)'
                  }}>
                      <div className="scanner-laser-line" style={{ height: '3.5px', background: '#00ff88', boxShadow: '0 0 25px #00ff88' }} />
                  </div>
              </div>

              {/* Botones de Zoom (Superpuestos sobre el visor pero debajo de botones de cierre) */}
              {canZoom && (
                  <div style={{ position: 'absolute', bottom: '22%', display: 'flex', gap: '8px', zIndex: 110, pointerEvents: 'auto' }}>
                      {[1.0, 1.5, 2.0].map(lvl => (
                          <button 
                            key={lvl}
                            onClick={() => applyZoom(lvl)}
                            style={{ 
                                width: '44px', height: '44px', borderRadius: '50%', 
                                background: zoom === lvl ? '#00ff88' : 'rgba(255,255,255,0.1)',
                                color: zoom === lvl ? 'black' : 'white',
                                border: 'none', fontWeight: 900, fontSize: '0.75rem', 
                                cursor: 'pointer', backdropFilter: 'blur(10px)',
                                transition: 'all 0.2s',
                                boxShadow: zoom === lvl ? '0 0 15px rgba(0,255,136,0.3)' : 'none'
                            }}>
                              {lvl}x
                          </button>
                      ))}
                  </div>
              )}
          </div>

          {/* Footer: Selector Rejilla 2x2 (Diseño Premium) */}
          <div style={{ padding: '40px 20px 60px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 110 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', width: '100%', maxWidth: '360px' }}>
                {cameras.map((cam, i) => (
                    <button
                        key={cam.id}
                        onClick={() => setSelectedCameraId(cam.id)}
                        disabled={isStarting}
                        style={{
                            padding: '18px 10px',
                            borderRadius: '24px',
                            border: 'none',
                            background: selectedCameraId === cam.id ? '#00ff88' : 'rgba(255,255,255,0.1)',
                            color: selectedCameraId === cam.id ? 'black' : 'white',
                            cursor: 'pointer',
                            opacity: isStarting ? 0.6 : 1,
                            transition: 'all 0.25s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: selectedCameraId === cam.id ? '0 0 30px rgba(0,255,136,0.5)' : 'none',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <span style={{ fontSize: '0.95rem', fontWeight: 900, marginBottom: '2px' }}>LENTE {i + 1}</span>
                        <span style={{ fontSize: '0.65rem', opacity: selectedCameraId === cam.id ? 1 : 0.6, fontWeight: 700 }}>
                            {cam.label.toLowerCase().includes('ultra') ? 'Cámara ultra' : 
                             cam.label.toLowerCase().includes('front') ? 'Cámara front' : 
                             cam.label.toLowerCase().includes('wide') ? 'Cámara ampli' : 'Cámara trase'}
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
