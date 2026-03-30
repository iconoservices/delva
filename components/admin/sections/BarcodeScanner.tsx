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

  // --- LÓGICA VISTA PC (ORIGINAL) ---
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
    const handleScanSuccess = (decodedText: string) => {
        scanner.clear().then(() => onScan(decodedText)).catch(() => onScan(decodedText));
    };
    scanner.render(handleScanSuccess, () => {});
    return () => {
      scanner.clear().catch(err => console.warn("Scanner cleanup failed", err));
    };
  }, [isMobile, onScan]);

  // --- LÓGICA VISTA MÓVIL (FUNCIONALIDAD PRESERVADA) ---
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
            qrbox: (viewWidth: number, viewHeight: number) => {
                const width = Math.min(viewWidth * 0.85, 300);
                const height = width * 0.5;
                return { width, height };
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
        setIsStarting(false);
    } catch (err) {
        console.error("Camera Switch Error:", err);
        setError("Error al iniciar este lente. Prueba otro.");
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

  // RENDER PC
  if (!isMobile) {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: 'white', borderRadius: '35px', width: '100%', maxWidth: '500px',
            padding: '30px', position: 'relative', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ margin: 0, fontWeight: 900, color: 'var(--primary)', fontSize: '1.4rem', letterSpacing: '-0.5px' }}>Escáner Delva PC 🌿</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Versión clásica del lector</p>
              </div>
              <button 
                onClick={onClose}
                style={{ background: '#f0f0f0', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontWeight: 900, fontSize: '1.2rem', color: '#666', transition: '0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f0f0f0'}
              >✕</button>
            </div>
            <div id="reader-pc" style={{ width: '100%', overflow: 'hidden', borderRadius: '25px', border: '1px solid #eee' }}></div>
            <p style={{ marginTop: '20px', fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>Alinea el código dentro del recuadro para escanear.</p>
          </div>
        </div>
    );
  }

  // RENDER MÓVIL (VISTA PREMIUM POLISHED)
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#000', zIndex: 10000, color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      <div id="reader-mobile" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}></div>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 1, pointerEvents: 'none' }}>
          {/* Top Bar - Glassmorphism */}
          <div style={{ 
            padding: '25px 20px', 
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)', 
            backdropFilter: 'blur(5px)',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            pointerEvents: 'auto' 
          }}>
              <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#00ff88', letterSpacing: '-0.5px' }}>Escáner Delva</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.8 }}>
                    <div style={{ width: '6px', height: '6px', background: '#00ff88', borderRadius: '50%', animation: 'pulse-green 1.5s infinite' }} />
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700 }}>Resolución HD Activa</p>
                  </div>
              </div>
              <button 
                onClick={onClose} 
                style={{ 
                  width: '44px', height: '44px', borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'white', fontSize: '1.4rem', fontWeight: 900, cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto',
                  backdropFilter: 'blur(10px)'
                }}
              >×</button>
          </div>

          {/* Viewfinder Area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {/* Oscuridad con degradado suave */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'calc(50% - 90px)', background: 'rgba(0,0,0,0.6)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 'calc(50% - 90px)', background: 'rgba(0,0,0,0.6)' }} />
              <div style={{ position: 'absolute', top: 'calc(50% - 90px)', left: 0, width: 'calc(50% - 160px)', height: '180px', background: 'rgba(0,0,0,0.6)' }} />
              <div style={{ position: 'absolute', top: 'calc(50% - 90px)', right: 0, width: 'calc(50% - 160px)', height: '180px', background: 'rgba(0,0,0,0.6)' }} />

              {/* Marco de Enfoque Stylizado */}
              <div className="scanner-viewfinder-frame" style={{ 
                width: '320px', 
                height: '180px', 
                position: 'relative', 
                overflow: 'hidden', 
                border: '2px solid rgba(0, 255, 136, 0.4)', 
                borderRadius: '24px',
                boxShadow: '0 0 40px rgba(0,0,0,0.5)'
              }}>
                  {/* Esquinas del marco */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '20px', height: '20px', borderTop: '4px solid #00ff88', borderLeft: '4px solid #00ff88', borderTopLeftRadius: '20px' }} />
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '20px', height: '20px', borderTop: '4px solid #00ff88', borderRight: '4px solid #00ff88', borderTopRightRadius: '20px' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '20px', height: '20px', borderBottom: '4px solid #00ff88', borderLeft: '4px solid #00ff88', borderBottomLeftRadius: '20px' }} />
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '20px', height: '20px', borderBottom: '4px solid #00ff88', borderRight: '4px solid #00ff88', borderBottomRightRadius: '20px' }} />
                  
                  <div className="scanner-laser-line" style={{ height: '4px', background: 'linear-gradient(to right, transparent, rgba(0,255,136,1), transparent)', boxShadow: '0 0 20px #00ff88' }} />
              </div>

              {isStarting && (
                <div style={{ 
                  position: 'absolute', bottom: 'calc(50% - 140px)', 
                  background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.5)',
                  color: '#00ff88', fontWeight: 900, fontSize: '0.85rem', padding: '10px 20px',
                  borderRadius: '20px', backdropFilter: 'blur(10px)', letterSpacing: '1px'
                }}>SINTONIZANDO LENTE...</div>
              )}
              {error && <div style={{ position: 'absolute', bottom: '-60px', background: 'rgba(255,0,0,0.8)', padding: '12px 25px', borderRadius: '18px', fontSize: '0.85rem', fontWeight: 800, border: '1px solid rgba(255,255,255,0.2)' }}>{error}</div>}
          </div>

          {/* Bottom Bar - Glassmorphism UI */}
          <div style={{ 
            padding: '40px 20px 60px', 
            background: 'linear-gradient(to top, rgba(0,0,0,0.95), transparent)', 
            backdropFilter: 'blur(10px)',
            pointerEvents: 'auto', 
            textAlign: 'center' 
          }}>
              <p style={{ margin: '0 0 25px', fontSize: '0.9rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.5px' }}>TOCA PARA CAMBIAR DE LENTE:</p>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {cameras.map((cam, i) => (
                    <button
                        key={cam.id}
                        onClick={() => setSelectedCameraId(cam.id)}
                        disabled={isStarting}
                        style={{
                            padding: '14px 20px',
                            borderRadius: '22px',
                            border: '1.5px solid',
                            borderColor: selectedCameraId === cam.id ? '#00ff88' : 'rgba(255,255,255,0.1)',
                            background: selectedCameraId === cam.id ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.08)',
                            color: selectedCameraId === cam.id ? '#00ff88' : 'white',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            opacity: isStarting ? 0.5 : 1,
                            minWidth: '105px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            backdropFilter: 'blur(15px)',
                            boxShadow: selectedCameraId === cam.id ? '0 0 25px rgba(0,255,136,0.25)' : 'none',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                    >
                        <span>CÁMARA {i + 1}</span>
                        <span style={{ fontSize: '0.6rem', opacity: 0.6, fontWeight: 500, letterSpacing: '0.2px' }}>
                            {cam.label.replace('Camera ', '').split('(')[0].slice(0, 15) || 'Estándar'}
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
