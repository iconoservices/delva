'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

interface CameraDevice {
  id: string;
  label: string;
}

/**
 * COMPONENTE PRINCIPAL: BARCODE SCANNER
 */
const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(2.0); // 2x por defecto

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
            d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera')
        );
        setSelectedCameraId(backCamera ? backCamera.id : devices[0].id);
      }
    }).catch(err => {
      console.error("Cámaras no detectadas", err);
      setError("No se detectaron cámaras.");
    });
  }, [isMobile]);

  // 2. Lógica del motor
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
            fps: 25, // Subimos a 25 para fluidez total con el zoom
            qrbox: { width: 450, height: 220 },
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
        console.error("Switch error", err);
        setError("Error al iniciar lente.");
        setIsStarting(false);
    }
  }, [onScan]);

  // 3. APLICAR ZOOM VISUAL (GARANTIZADO)
  // Usamos un intervalo corto al inicio para "forzar" el zoom en cuanto aparezca el video
  useEffect(() => {
    const forceZoom = () => {
        const video = document.querySelector("#reader-mobile video") as HTMLVideoElement;
        if (video) {
            video.style.transform = `scale(${zoomLevel})`;
            video.style.transformOrigin = "center center";
            video.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
            video.style.width = "100%";
            video.style.height = "100%";
            video.style.objectFit = "cover";
        }
    };

    forceZoom(); // Aplicar de una vez

    // Si está iniciando, re-intentamos un par de veces por si la librería recrea el video
    if (isStarting) {
        const interval = setInterval(forceZoom, 100);
        const timeout = setTimeout(() => clearInterval(interval), 2000);
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }
  }, [zoomLevel, isStarting]);

  useEffect(() => {
    if (isMobile && selectedCameraId) {
        startScanningOnCamera(selectedCameraId);
    }
  }, [isMobile, selectedCameraId, startScanningOnCamera]);

  useEffect(() => {
    return () => {
        if (scannerInstanceRef.current?.isScanning) {
            scannerInstanceRef.current.stop().catch(e => console.log("Final stop", e));
        }
    };
  }, []);

  if (!isMobile) {
    return <PCScannerUI onScan={onScan} onClose={onClose} />;
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'black', zIndex: 10000, display: 'flex', flexDirection: 'column'
    }}>
      {/* Estilos base para ocultar la basura de la librería */}
      <style>{`
        #reader-mobile { overflow: hidden !important; position: relative !important; }
        #reader-mobile > div { opacity: 0.01 !important; pointer-events: none !important; } 
        #reader-mobile video { display: block !important; }
        
        /* Shroud / Mask Styles */
        .scanner-shroud { position: absolute; background: rgba(0,0,0,0.65); z-index: 1; }
        .shroud-top { top: 0; left: 0; width: 100%; height: calc(50% - 110px); }
        .shroud-bottom { bottom: 0; left: 0; width: 100%; height: calc(50% - 110px); }
        .shroud-left { top: calc(50% - 110px); left: 0; width: calc(50% - 165px); height: 220px; }
        .shroud-right { top: calc(50% - 110px); right: 0; width: calc(50% - 165px); height: 220px; }

        .scanner-laser-line {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: #00ff88;
          box-shadow: 0 0 15px #00ff88;
          animation: scan 2s linear infinite;
        }

        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        /* Camera Selection Scroll - ESTILO iOS */
        .camera-selector-container {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding: 5px 20px 15px;
            justify-content: flex-start;
            scrollbar-width: none;
            -ms-overflow-style: none;
            scroll-behavior: smooth;
            pointer-events: auto;
            mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
        }
        .camera-selector-container::-webkit-scrollbar { display: none; }
        
        .camera-btn {
            white-space: nowrap;
            flex-shrink: 0;
            padding: 6px 16px;
            border-radius: 20px;
            border: 1.2px solid rgba(255,255,255,0.15);
            background: rgba(255,255,255,0.08);
            color: rgba(255,255,255,0.6);
            font-size: 0.6rem;
            font-weight: 800;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .camera-btn.active {
            border-color: #00ff88;
            background: rgba(0, 255, 136, 0.2);
            color: #00ff88;
            transform: scale(1.1);
            box-shadow: 0 0 15px rgba(0, 255, 136, 0.2);
        }
      `}</style>
      
      <div id="reader-mobile" style={{ width: '100%', height: '100%', position: 'absolute' }}></div>
      <MobileScannerUI 
        cameras={cameras} 
        onClose={onClose} 
        selectedCameraId={selectedCameraId}
        setSelectedCameraId={setSelectedCameraId}
        isStarting={isStarting}
        error={error}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
      />
    </div>
  );
};

/**
 * UI DE ESCRITORIO
 */
const PCScannerUI: React.FC<{ onScan: (t: string) => void, onClose: () => void }> = ({ onScan, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader-pc",
      { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 },
      false
    );
    scanner.render((t) => {
        scanner.clear().then(() => onScan(t)).catch(() => onScan(t));
    }, () => {});
    return () => { scanner.clear().catch(e => console.log(e)); };
  }, [onScan]);

  return (
    <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        backdropFilter: 'blur(10px)'
    }}>
      <div style={{ background: 'white', borderRadius: '35px', width: '100%', maxWidth: '500px', padding: '30px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem' }}>Escáner PC 🌿</h2>
          <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer' }}>✕</button>
        </div>
        <div id="reader-pc" style={{ width: '100%', overflow: 'hidden', borderRadius: '25px', border: '2px solid #eee' }}></div>
      </div>
    </div>
  );
};

/**
 * UI DE MÓVIL
 */
interface MobileScannerUIProps {
  cameras: CameraDevice[];
  onClose: () => void;
  selectedCameraId: string | null;
  setSelectedCameraId: (id: string) => void;
  isStarting: boolean;
  error: string | null;
  zoomLevel: number;
  setZoomLevel: (v: number) => void;
}

const MobileScannerUI: React.FC<MobileScannerUIProps> = ({ cameras, onClose, selectedCameraId, setSelectedCameraId, isStarting, error, zoomLevel, setZoomLevel }) => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 1, pointerEvents: 'none' }}>
      {/* Top Bar */}
      <div style={{ padding: '25px 20px', background: 'linear-gradient(rgba(0,0,0,0.8), transparent)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#00ff88' }}>Delva Scan</h3>
            <p style={{ margin: 0, fontSize: '0.65rem', opacity: 0.8, letterSpacing: '0.5px' }}>
                {zoomLevel === 1 ? 'VISTA NORMAL' : `ZOOM ${zoomLevel.toFixed(1)}X ACTIVO`}
            </p>
          </div>
          <button onClick={onClose} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '1.4rem', fontWeight: 900, cursor: 'pointer' }}>✕</button>
      </div>

      {/* Visor Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* Shroud Mask */}
          <div className="scanner-shroud shroud-top" />
          <div className="scanner-shroud shroud-bottom" />
          <div className="scanner-shroud shroud-left" />
          <div className="scanner-shroud shroud-right" />

          {/* Emerald Viewfinder Frame */}
          <div style={{ width: '330px', height: '220px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(0, 255, 136, 0.3)', borderRadius: '30px', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '25px', height: '25px', borderTop: '5px solid #00ff88', borderLeft: '5px solid #00ff88', borderTopLeftRadius: '30px' }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: '25px', height: '25px', borderTop: '5px solid #00ff88', borderRight: '5px solid #00ff88', borderTopRightRadius: '30px' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '25px', height: '25px', borderBottom: '5px solid #00ff88', borderLeft: '5px solid #00ff88', borderBottomLeftRadius: '30px' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '25px', height: '25px', borderBottom: '5px solid #00ff88', borderRight: '5px solid #00ff88', borderBottomRightRadius: '30px' }} />
              <div className="scanner-laser-line" />
          </div>

          <div style={{ position: 'absolute', bottom: 'calc(50% - 180px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', pointerEvents: 'auto', width: '100%' }}>
            <input 
                type="range" min="1.0" max="4.0" step="0.1" 
                value={zoomLevel} 
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                style={{ width: '200px', accentColor: '#00ff88', cursor: 'pointer', height: '24px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
                {[1.0, 1.5, 2.0, 3.0, 4.0].map(v => (
                    <button
                        key={v}
                        onClick={() => setZoomLevel(v)}
                        style={{
                            padding: '8px 12px', borderRadius: '12px', border: 'none',
                            background: zoomLevel === v ? '#00ff88' : 'rgba(255,255,255,0.2)',
                            color: zoomLevel === v ? 'black' : 'white',
                            fontSize: '0.75rem', fontWeight: 900, backdropFilter: 'blur(10px)'
                        }}
                    >
                        {v}x
                    </button>
                ))}
            </div>
          </div>

          {isStarting && <div style={{ position: 'absolute', bottom: 'calc(50% - 150px)', color: '#00ff88', fontWeight: 900, fontSize: '0.8rem', textShadow: '0 0 10px #000' }}>ENCENDIENDO...</div>}
      </div>

      {/* Selector de Cámaras - ESTILO iOS SCROLL */}
      <div style={{ padding: '15px 0 60px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', pointerEvents: 'auto', textAlign: 'center' }}>
          <div className="camera-selector-container">
            {cameras.map((cam: CameraDevice, i: number) => {
                // Función Ultra-Limpia para nombres premium
                const cleanLabel = cam.label
                    .replace(/camera/gi, '')
                    .replace(/facing back/gi, '')
                    .replace(/back/gi, '')
                    .replace(/[()]/g, '')
                    .replace(/,/g, '')
                    .trim();
                    
                return (
                    <button
                        key={cam.id}
                        onClick={() => setSelectedCameraId(cam.id)}
                        disabled={isStarting}
                        className={`camera-btn ${selectedCameraId === cam.id ? 'active' : ''}`}
                    >
                        {cleanLabel || `LENTE ${i + 1}`}
                    </button>
                );
            })}
          </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
