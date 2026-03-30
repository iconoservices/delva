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
            fps: 20, // 20 FPS es ideal para enfoque estable en iPhone
            qrbox: { width: 450, height: 220 },
            aspectRatio: window.innerWidth / window.innerHeight,
            videoConstraints: {
                deviceId: { exact: cameraId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                facingMode: "environment",
                focusMode: "continuous",
                brightness: { ideal: 100 },
                contrast: { ideal: 100 }
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

  // 3. APLICAR ZOOM VISUAL & RE-ENFOQUE (TAP TO FOCUS)
  const handleTapToFocus = useCallback(async () => {
    try {
        const video = document.querySelector("#reader-mobile video") as HTMLVideoElement;
        if (video && video.srcObject) {
            const stream = video.srcObject as MediaStream;
            const track = stream.getVideoTracks()[0];
            if (track) {
                // Forzar re-enfoque continuo
                await track.applyConstraints({
                    advanced: [{ focusMode: "continuous" } as any]
                });
                console.log("Re-enfocando...");
            }
        }
    } catch (e) {
        console.warn("Tap to focus no soportado:", e);
    }
  }, []);

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
            // Filtro de nitidez CSS
            video.style.filter = "contrast(1.15) brightness(1.05) saturate(1.1)";
        }
    };

    forceZoom();

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
      <style>{`
        #reader-mobile { overflow: hidden !important; position: relative !important; }
        #reader-mobile > div { opacity: 0.01 !important; pointer-events: none !important; } 
        #reader-mobile video { display: block !important; cursor: crosshair; }
        
        .scanner-shroud { position: absolute; background: rgba(0,0,0,0.7); z-index: 1; pointer-events: none; }
        .shroud-top { top: 0; left: 0; width: 100%; height: calc(50% - 110px); }
        .shroud-bottom { bottom: 0; left: 0; width: 100%; height: calc(50% - 110px); }
        .shroud-left { top: calc(50% - 110px); left: 0; width: calc(50% - 165px); height: 220px; }
        .shroud-right { top: calc(50% - 110px); right: 0; width: calc(50% - 165px); height: 220px; }

        .scanner-laser-line {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1.5px;
          background: #00ff88;
          box-shadow: 0 0 20px #00ff88;
          animation: scan 2.5s linear infinite;
        }

        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .camera-selector-container {
            display: flex; gap: 12px; overflow-x: auto; padding: 15px 20px;
            scrollbar-width: none; -ms-overflow-style: none;
            mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
        }
        .camera-selector-container::-webkit-scrollbar { display: none; }
        
        .camera-btn {
            white-space: nowrap; flex-shrink: 0; padding: 7px 16px; border-radius: 20px;
            border: 1.2px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.3);
            color: rgba(255,255,255,0.7); font-size: 0.62rem; font-weight: 800;
            backdrop-filter: blur(20px); transition: 0.3s; text-transform: uppercase;
        }
        .camera-btn.active { border-color: #00ff88; background: rgba(0,255,136,0.2); color: #00ff88; transform: scale(1.08); }

        .zoom-controls-container {
            position: absolute; bottom: 130px; left: 0; right: 0; z-index: 20; 
            display: flex; flexDirection: column; align-items: center; gap: 15px;
            pointer-events: auto; background: linear-gradient(transparent, rgba(0,0,0,0.5));
            padding-bottom: 20px;
        }
      `}</style>
      
      {/* AREA DE CAPTURA - PULSAR PARA ENFOCAR */}
      <div 
        id="reader-mobile" 
        onClick={handleTapToFocus}
        style={{ width: '100%', height: '100%', position: 'absolute', zIndex: 0 }}
      ></div>

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
      <div style={{ padding: '25px 20px', zIndex: 30, background: 'linear-gradient(rgba(0,0,0,0.8), transparent)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#00ff88' }}>Delva Scan</h3>
            <p style={{ margin: 0, fontSize: '0.62rem', opacity: 0.8, letterSpacing: '0.5px' }}>
                {zoomLevel === 1 ? 'LENTE 1X' : `MODO ZOOM ${zoomLevel.toFixed(1)}X`}
            </p>
          </div>
          <button onClick={onClose} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '1.4rem', fontWeight: 900, cursor: 'pointer' }}>✕</button>
      </div>

      {/* Visor Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div className="scanner-shroud shroud-top" />
          <div className="scanner-shroud shroud-bottom" />
          <div className="scanner-shroud shroud-left" />
          <div className="scanner-shroud shroud-right" />

          <div style={{ width: '330px', height: '220px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(0, 255, 136, 0.4)', borderRadius: '30px', boxShadow: '0 0 40px rgba(0,0,0,0.6)', zIndex: 5 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '25px', height: '25px', borderTop: '5.5px solid #00ff88', borderLeft: '5.5px solid #00ff88', borderTopLeftRadius: '30px' }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: '25px', height: '25px', borderTop: '5.5px solid #00ff88', borderRight: '5.5px solid #00ff88', borderTopRightRadius: '30px' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '25px', height: '25px', borderBottom: '5.5px solid #00ff88', borderLeft: '5.5px solid #00ff88', borderBottomLeftRadius: '30px' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '25px', height: '25px', borderBottom: '5.5px solid #00ff88', borderRight: '5.5px solid #00ff88', borderBottomRightRadius: '30px' }} />
              <div className="scanner-laser-line" />
          </div>

          {/* CONTROLES DE ZOOM - CAPA SUPERIOR */}
          <div className="zoom-controls-container">
            <input 
                type="range" min="1.0" max="4.0" step="0.1" 
                value={zoomLevel} 
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                style={{ width: '220px', accentColor: '#00ff88', cursor: 'pointer', height: '26px' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
                {[1.0, 1.5, 2.0, 3.0, 4.0].map(v => (
                    <button
                        key={v}
                        onClick={() => setZoomLevel(v)}
                        style={{
                            padding: '8px 14px', borderRadius: '14px', border: 'none',
                            background: zoomLevel === v ? '#00ff88' : 'rgba(255,255,255,0.15)',
                            color: zoomLevel === v ? 'black' : 'white',
                            fontSize: '0.72rem', fontWeight: 900, backdropFilter: 'blur(20px)', transition: '0.2s'
                        }}
                    >
                        {v}x
                    </button>
                ))}
            </div>
            {isStarting && <div style={{ color: '#00ff88', fontWeight: 900, fontSize: '0.7rem', textShadow: '0 0 10px #000' }}>RECONECTANDO LENTE...</div>}
          </div>
      </div>

      {/* Selector de Cámaras - CAPA INFERIOR */}
      <div style={{ padding: '0 0 50px', background: 'rgba(0,0,0,0.8)', pointerEvents: 'auto', textAlign: 'center', zIndex: 10 }}>
          <div className="camera-selector-container">
            {cameras.map((cam: CameraDevice, i: number) => {
                const cleanLabel = cam.label.replace(/camera/gi, '').replace(/facing back/gi, '').replace(/back/gi, '').replace(/[()]/g, '').replace(/,/g, '').trim();
                return (
                    <button key={cam.id} onClick={() => setSelectedCameraId(cam.id)} disabled={isStarting} className={`camera-btn ${selectedCameraId === cam.id ? 'active' : ''}`}>
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
