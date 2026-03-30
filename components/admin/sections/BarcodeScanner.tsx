'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Obtener cámaras disponibles
  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Priorizar cámara trasera (back/environment)
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera'));
        setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
      }
    }).catch(err => {
      console.error("Error obteniendo cámaras", err);
      setError("No se detectaron cámaras.");
    });
  }, []);

  // 2. Iniciar / Reiniciar escáner cuando cambia la cámara seleccionada
  useEffect(() => {
    if (!selectedCameraId) return;

    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    const start = async () => {
        try {
            setIsScanning(false);
            setError(null);
            
            // Configuración optimizada para iPhone/Móvil
            const config = {
                fps: 20,
                qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                    // Calculamos un recuadro rectangular centrado (proporción 3:2)
                    const width = Math.min(viewfinderWidth * 0.8, 320);
                    const height = width * 0.6;
                    return { width, height };
                },
                aspectRatio: window.innerWidth / window.innerHeight,
                // Pedimos alta resolución para evitar desenfoque
                videoConstraints: {
                    focusMode: "continuous",
                    whiteBalanceMode: "continuous",
                    exposureMode: "continuous",
                    width: { min: 640, ideal: 1920, max: 1920 },
                    height: { min: 480, ideal: 1080, max: 1080 }
                }
            };

            await scanner.start(
                selectedCameraId,
                config,
                (decodedText) => {
                    // Éxito: Detener y avisar
                    scanner.stop().then(() => {
                        onScan(decodedText);
                    }).catch(() => onScan(decodedText));
                },
                () => {} // Ignorar errores de frame
            );
            setIsScanning(true);
        } catch (err) {
            console.error("Error al iniciar cámara", err);
            setError("No se pudo iniciar la cámara seleccionada.");
        }
    };

    start();

    return () => {
        if (scannerRef.current?.isScanning) {
            scannerRef.current.stop().catch(e => console.log("Cleanup error", e));
        }
    };
  }, [selectedCameraId, onScan]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'black',
      zIndex: 10000,
      color: 'white',
      fontFamily: 'var(--font-main)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* CÁMARA (Fondo) */}
      <div id="reader" style={{ 
          width: '100%', 
          height: '100%', 
          background: 'black',
          position: 'absolute',
          top: 0,
          left: 0
      }}></div>

      {/* OVERLAY NATIVO (iPhone Style) */}
      <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
          pointerEvents: 'none'
      }}>
          {/* Top Bar */}
          <div style={{ 
              padding: '20px', 
              background: 'linear-gradient(rgba(0,0,0,0.7), transparent)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pointerEvents: 'auto'
          }}>
              <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#00ff88' }}>Escáner Delva</h3>
                  <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.8 }}>EAN-13 / QR / BARCODE</p>
              </div>
              <button 
                  onClick={onClose}
                  style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: 'rgba(255,255,255,0.2)', 
                      border: 'none', 
                      color: 'white', 
                      fontSize: '1.2rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)'
                  }}
              >✕</button>
          </div>

          {/* Viewfinder Area (Middle Spacer) */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {/* Oscuridad lateral y vertical */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'calc(50% - 90px)', background: 'rgba(0,0,0,0.5)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 'calc(50% - 90px)', background: 'rgba(0,0,0,0.5)' }} />
              <div style={{ position: 'absolute', top: 'calc(50% - 90px)', left: 0, width: 'calc(50% - 160px)', height: '180px', background: 'rgba(0,0,0,0.5)' }} />
              <div style={{ position: 'absolute', top: 'calc(50% - 90px)', right: 0, width: 'calc(50% - 160px)', height: '180px', background: 'rgba(0,0,0,0.5)' }} />

              {/* El Marco de Enfoque */}
              <div className="scanner-viewfinder-frame" style={{ 
                  width: '320px', 
                  height: '180px', 
                  position: 'relative',
                  overflow: 'hidden'
              }}>
                  <div className="scanner-laser-line" />
              </div>

              {error && (
                <div style={{ 
                    position: 'absolute', 
                    bottom: '20px', 
                    background: 'rgba(217, 83, 79, 0.9)', 
                    padding: '10px 20px', 
                    borderRadius: '15px', 
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    maxWidth: '80%'
                }}>{error}</div>
              )}
          </div>

          {/* Bottom Bar Controls */}
          <div style={{ 
              padding: '40px 20px', 
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              pointerEvents: 'auto'
          }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, textAlign: 'center', maxWidth: '300px' }}>
                  Posiciona el código dentro del recuadro verde para escanear automáticamente.
              </p>

              {cameras.length > 1 && (
                  <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '5px', borderRadius: '15px', backdropFilter: 'blur(10px)' }}>
                      {cameras.slice(0, 3).map((cam, i) => (
                          <button
                            key={cam.id}
                            onClick={() => setSelectedCameraId(cam.id)}
                            style={{
                                padding: '8px 15px',
                                borderRadius: '10px',
                                border: 'none',
                                background: selectedCameraId === cam.id ? 'white' : 'transparent',
                                color: selectedCameraId === cam.id ? 'black' : 'white',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                            }}
                          >
                            CÁMARA {i + 1}
                          </button>
                      ))}
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
