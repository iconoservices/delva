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

  // Referencia persistente para el motor
  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 1. Cargar cámaras (Solo para móvil)
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
      setError("No se detectaron cámaras.");
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
      /* verbose= */ false
    );

    const handleScanSuccess = (decodedText: string) => {
        scanner.clear().then(() => {
            onScan(decodedText);
        }).catch(() => {
            onScan(decodedText);
        });
    };

    scanner.render(handleScanSuccess, () => {});

    return () => {
      scanner.clear().catch(err => console.warn("Scanner cleanup failed", err));
    };
  }, [isMobile, onScan]);

  // --- LÓGICA VISTA MÓVIL (SISTEMA DE CAMBIO DE CÁMARA ROBUSTO) ---
  const startScanningOnCamera = useCallback(async (cameraId: string) => {
    if (!scannerInstanceRef.current) {
        scannerInstanceRef.current = new Html5Qrcode("reader-mobile");
    }

    const scanner = scannerInstanceRef.current;

    try {
        setIsStarting(true);
        setError(null);

        if (scanner.isScanning) {
            await scanner.stop();
        }

        const config = {
            fps: 25,
            // NOTA: No pasamos qrbox para evitar que el motor dibuje su propio cuadro (el blanco que se montaba)
            // En su lugar, el motor analiza todo el frame y nosotros dibujamos el cuadro verde visualmente.
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
        setIsStarting(false);
    } catch (err) {
        console.error("Camera Switch Error:", err);
        setError("Error al iniciar lente. Intenta con otro.");
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

  // --- UI SUB-COMPONENTS (LIMPITOS) ---

  const PCView = () => (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', zIndex: 3000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: 'white', borderRadius: '35px', width: '100%', maxWidth: '500px',
        padding: '24px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ margin: 0, fontWeight: 900, color: 'var(--primary)', fontSize: '1.2rem' }}>Escáner PC 🌿</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Versión clásica</p>
          </div>
          <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontWeight: 900, color: '#999' }}>✕</button>
        </div>
        <div id="reader-pc" style={{ width: '100%', overflow: 'hidden', borderRadius: '25px', border: '2px solid #f0f0f0' }}></div>
      </div>
    </div>
  );

  const MobileView = () => (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'black', zIndex: 10000, color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      {/* CAPA 0: CÁMARA */}
      <div id="reader-mobile" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}></div>

      {/* CAPA 1: INTERFAZ MÓVIL (Limpia y Premium) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 1, pointerEvents: 'none' }}>
          {/* Header Bar */}
          <div style={{ padding: '25px 20px', background: 'linear-gradient(rgba(0,0,0,0.9), transparent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
              <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#00ff88', letterSpacing: '-0.5px' }}>Escáner Delva</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>ALTA PRECISIÓN</p>
              </div>
              <button onClick={onClose} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '1.4rem', fontWeight: 900, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>✕</button>
          </div>

          {/* Viewfinder Area (Limpiado de cuadros montados) */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {/* Oscuridad lateral suave */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'calc(50% - 90px)', background: 'rgba(0,0,0,0.5)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 'calc(50% - 90px)', background: 'rgba(0,0,0,0.5)' }} />
              <div style={{ position: 'absolute', top: 'calc(50% - 90px)', left: 0, width: 'calc(50% - 150px)', height: '180px', background: 'rgba(0,0,0,0.5)' }} />
              <div style={{ position: 'absolute', top: 'calc(50% - 90px)', right: 0, width: 'calc(50% - 150px)', height: '180px', background: 'rgba(0,0,0,0.5)' }} />

              {/* El ÚNICO cuadro visible (Verde Premium) */}
              <div className="scanner-viewfinder-frame" style={{ 
                  width: '300px', 
                  height: '180px', 
                  position: 'relative', 
                  overflow: 'hidden', 
                  border: '2px solid rgba(0, 255, 136, 0.4)', 
                  borderRadius: '24px',
                  boxShadow: '0 0 40px rgba(0,0,0,0.5)'
              }}>
                  {/* Esquinas del marco */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '25px', height: '25px', borderTop: '5px solid #00ff88', borderLeft: '5px solid #00ff88', borderTopLeftRadius: '24px' }} />
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '25px', height: '25px', borderTop: '5px solid #00ff88', borderRight: '5px solid #00ff88', borderTopRightRadius: '24px' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '25px', height: '25px', borderBottom: '5px solid #00ff88', borderLeft: '5px solid #00ff88', borderBottomLeftRadius: '24px' }} />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '25px', height: '25px', borderBottom: '5px solid #00ff88', borderRight: '5px solid #00ff88', borderBottomRightRadius: '24px' }} />
                  
                  <div className="scanner-laser-line" />
              </div>
              
              {isStarting && <div style={{ position: 'absolute', bottom: '-40px', color: '#00ff88', fontWeight: 950, letterSpacing: '1px', textShadow: '0 2px 10px rgba(0,0,0,1)' }}>CAMBIANDO CÁMARA...</div>}
              {error && <div style={{ position: 'absolute', bottom: '-40px', background: 'red', padding: '10px 20px', borderRadius: '15px' }}>{error}</div>}
          </div>

          {/* Bottom Bar - Cámara Selector (Limpiado) */}
          <div style={{ padding: '40px 20px 60px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', backdropFilter: 'blur(10px)', pointerEvents: 'auto', textAlign: 'center' }}>
              <p style={{ margin: '0 0 25px', fontSize: '0.85rem', fontWeight: 900, color: 'white', letterSpacing: '1px' }}>TOCA PARA CAMBIAR DE LENTE:</p>
              
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'nowrap', overflowX: 'auto', padding: '10px' }}>
                {cameras.map((cam, i) => (
                    <button
                        key={cam.id}
                        onClick={() => setSelectedCameraId(cam.id)}
                        disabled={isStarting}
                        style={{
                            padding: '15px 20px',
                            borderRadius: '22px',
                            border: '1.5px solid',
                            borderColor: selectedCameraId === cam.id ? '#00ff88' : 'rgba(255,255,255,0.2)',
                            background: selectedCameraId === cam.id ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.05)',
                            color: selectedCameraId === cam.id ? '#00ff88' : 'white',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            opacity: isStarting ? 0.5 : 1,
                            minWidth: '100px',
                            boxShadow: selectedCameraId === cam.id ? '0 0 15px rgba(0,255,136,0.3)' : 'none',
                            transition: 'all 0.3s'
                        }}
                    >
                        CÁMARA {i + 1}
                        <br/>
                        <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>{cam.label.split('(')[0] || 'Lente'}</span>
                    </button>
                ))}
              </div>
          </div>
      </div>
    </div>
  );

  return isMobile ? <MobileView /> : <PCView />;
};

export default BarcodeScanner;
