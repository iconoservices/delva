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
        // Intentar encontrar la cámara "back" o "trasera" por defecto
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
  
  const stopScanning = async () => {
    if (scannerInstanceRef.current && scannerInstanceRef.current.isScanning) {
        await scannerInstanceRef.current.stop();
    }
  };

  const startScanningOnCamera = useCallback(async (cameraId: string) => {
    // Asegurarse de tener una sola instancia amarrada al elemento
    if (!scannerInstanceRef.current) {
        const scanner = new Html5Qrcode("reader-mobile");
        scannerInstanceRef.current = scanner;
    }

    const scanner = scannerInstanceRef.current;

    try {
        setIsStarting(true);
        setError(null);

        // 1. Parar cualquier escaneo previo
        if (scanner.isScanning) {
            await scanner.stop();
        }

        // 2. Configuración de alta resolución (como la que funciona en PC)
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
                // Pedimos alta resolución explícitamente ya que el hardware lo soporta
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: "environment",
                focusMode: "continuous"
            }
        };

        // 3. Iniciar el nuevo stream
        await scanner.start(
            cameraId,
            config,
            (decodedText) => {
                scanner.stop().then(() => onScan(decodedText)).catch(() => onScan(decodedText));
            },
            () => {} // Errores de frame silenciosos
        );
        setIsStarting(false);
    } catch (err) {
        console.error("Camera Switch Error:", err);
        setError("Error al iniciar este lente. Prueba otra cámara.");
        setIsStarting(false);
    }
  }, [onScan]);

  useEffect(() => {
    if (!isMobile || !selectedCameraId) return;
    
    // Ejecutar el inicio de la cámara seleccionada
    startScanningOnCamera(selectedCameraId);

    return () => {
        // Al desmontar o cambiar ID, intentamos limpiar
        // Pero el stop real ocurre al inicio del próximo startScanningOnCamera
    };
  }, [isMobile, selectedCameraId, startScanningOnCamera]);

  // Limpieza total al cerrar el componente
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
                <h2 style={{ margin: 0, fontWeight: 900, color: 'var(--primary)', fontSize: '1.2rem' }}>Escáner Delva PC 🌿</h2>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Utiliza el lector estándar</p>
              </div>
              <button 
                onClick={onClose}
                style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontWeight: 900, fontSize: '1rem', color: '#999' }}
              >✕</button>
            </div>
            {/* ELEMENTO PARA PC */}
            <div id="reader-pc" style={{ width: '100%', overflow: 'hidden', borderRadius: '25px', border: '2px solid #f0f0f0' }}></div>
            <p style={{ marginTop: '15px', fontSize: '0.8rem', color: '#666' }}>Versión clásica activa.</p>
          </div>
        </div>
    );
  }

  // RENDER MÓVIL
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'black', zIndex: 10000, color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      <div id="reader-mobile" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}></div>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 1, pointerEvents: 'none' }}>
          {/* Top Bar */}
          <div style={{ padding: '20px', background: 'linear-gradient(rgba(0,0,0,0.8), transparent)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
              <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#00ff88' }}>Escáner Móvil</h3>
                  <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.8 }}>Resolución HD activada</p>
              </div>
              <button 
                onClick={onClose} 
                style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '1.4rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}
              >×</button>
          </div>

          {/* Viewfinder Area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'calc(50% - 75px)', background: 'rgba(0,0,0,0.7)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 'calc(50% - 75px)', background: 'rgba(0,0,0,0.7)' }} />
              <div style={{ position: 'absolute', top: 'calc(50% - 75px)', left: 0, width: 'calc(50% - 150px)', height: '150px', background: 'rgba(0,0,0,0.7)' }} />
              <div style={{ position: 'absolute', top: 'calc(50% - 75px)', right: 0, width: 'calc(50% - 150px)', height: '150px', background: 'rgba(0,0,0,0.7)' }} />

              <div className="scanner-viewfinder-frame" style={{ width: '300px', height: '150px', position: 'relative', overflow: 'hidden', border: '3px solid #00ff88', borderRadius: '20px' }}>
                  <div className="scanner-laser-line" />
              </div>
              {isStarting && <div style={{ position: 'absolute', color: '#00ff88', fontWeight: 900, fontSize: '0.9rem', bottom: '-40px', textShadow: '0 0 10px rgba(0,0,0,1)' }}>CAMBIANDO CÁMARA...</div>}
              {error && <div style={{ position: 'absolute', bottom: '-45px', background: 'rgba(255,0,0,0.9)', padding: '10px 20px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 700 }}>{error}</div>}
          </div>

          {/* Bottom Bar - SELECTOR DE CÁMARAS MEJORADO */}
          <div style={{ padding: '40px 20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', pointerEvents: 'auto', textAlign: 'center' }}>
              <p style={{ margin: '0 0 20px', fontSize: '0.85rem', fontWeight: 700 }}>Toca para cambiar de lente:</p>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {cameras.map((cam, i) => (
                    <button
                        key={cam.id}
                        onClick={() => setSelectedCameraId(cam.id)}
                        disabled={isStarting}
                        style={{
                            padding: '12px 18px',
                            borderRadius: '18px',
                            border: 'none',
                            background: selectedCameraId === cam.id ? '#00ff88' : 'rgba(255,255,255,0.2)',
                            color: selectedCameraId === cam.id ? 'black' : 'white',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            opacity: isStarting ? 0.5 : 1,
                            minWidth: '100px',
                            boxShadow: selectedCameraId === cam.id ? '0 0 15px rgba(0,255,136,0.5)' : 'none'
                        }}
                    >
                        LENTE {i + 1}
                        <br/>
                        <span style={{ fontSize: '0.55rem', opacity: 0.8 }}>{cam.label.replace('Camera ', '').split('(')[0].slice(0, 15) || 'Cámara'}</span>
                    </button>
                ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
