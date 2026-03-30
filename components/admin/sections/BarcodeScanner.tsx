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
  const [zoomLevel, setZoomLevel] = useState(1.0);

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

  // 2. Lógica del motor con Soporte de Zoom
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
            fps: 20,
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
        
        // Reset zoom al iniciar nueva cámara
        setZoomLevel(1.0);
        setIsStarting(false);
    } catch (err) {
        console.error("Switch error", err);
        setError("Error al iniciar lente.");
        setIsStarting(false);
    }
  }, [onScan]);

  // 3. Aplicar Zoom dinámicamente
  useEffect(() => {
    const applyZoom = async () => {
        if (!scannerInstanceRef.current?.isScanning) return;
        try {
            const video = document.querySelector("#reader-mobile video") as HTMLVideoElement;
            if (video && video.srcObject) {
                const stream = video.srcObject as MediaStream;
                const track = stream.getVideoTracks()[0];
                if (track) {
                    const capabilities = track.getCapabilities() as any;
                    if (capabilities.zoom) {
                        await track.applyConstraints({
                            advanced: [{ zoom: zoomLevel }]
                        } as any);
                    }
                }
            }
        } catch (e) {
            console.warn("Zoom por hardware no soportado o error:", e);
        }
    };
    applyZoom();
  }, [zoomLevel]);

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
        #reader-mobile > div { opacity: 0.01 !important; pointer-events: none; }
        #reader-mobile video { 
            width: 100% !important; height: 100% !important; object-fit: cover !important;
            transition: transform 0.3s ease;
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
            <p style={{ margin: 0, fontSize: '0.65rem', opacity: 0.6 }}>ZOOM MANUAL ACTIVO</p>
          </div>
          <button onClick={onClose} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '1.4rem', fontWeight: 900, cursor: 'pointer' }}>✕</button>
      </div>

      {/* Visor Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'calc(50% - 110px)', background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 'calc(50% - 110px)', background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'absolute', top: 'calc(50% - 110px)', left: 0, width: 'calc(50% - 165px)', height: '220px', background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'absolute', top: 'calc(50% - 110px)', right: 0, width: 'calc(50% - 165px)', height: '220px', background: 'rgba(0,0,0,0.6)' }} />

          <div style={{ width: '330px', height: '220px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(0, 255, 136, 0.4)', borderRadius: '25px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '25px', height: '25px', borderTop: '5px solid #00ff88', borderLeft: '5px solid #00ff88', borderTopLeftRadius: '25px' }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: '25px', height: '25px', borderTop: '5px solid #00ff88', borderRight: '5px solid #00ff88', borderTopRightRadius: '25px' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '25px', height: '25px', borderBottom: '5px solid #00ff88', borderLeft: '5px solid #00ff88', borderBottomLeftRadius: '25px' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '25px', height: '25px', borderBottom: '5px solid #00ff88', borderRight: '5px solid #00ff88', borderBottomRightRadius: '25px' }} />
              <div className="scanner-laser-line" style={{ height: '3px', filter: 'blur(1px)' }} />
          </div>

          {/* ZOOM CONTROLS - FLOTANTES SOBRE EL VISOR */}
          <div style={{ position: 'absolute', bottom: 'calc(50% - 180px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', pointerEvents: 'auto', width: '100%' }}>
            
            {/* Range Slider */}
            <input 
                type="range" 
                min="1.0" 
                max="3.0" 
                step="0.1" 
                value={zoomLevel} 
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                style={{ width: '200px', accentColor: '#00ff88', cursor: 'pointer' }}
            />

            {/* Quick Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
                {[1.0, 1.5, 2.0, 3.0].map(v => (
                    <button
                        key={v}
                        onClick={() => setZoomLevel(v)}
                        style={{
                            padding: '8px 15px', borderRadius: '12px', border: 'none',
                            background: zoomLevel === v ? '#00ff88' : 'rgba(255,255,255,0.2)',
                            color: zoomLevel === v ? 'black' : 'white',
                            fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', transition: '0.2s'
                        }}
                    >
                        {v}x
                    </button>
                ))}
            </div>
          </div>

          {isStarting && <div style={{ position: 'absolute', bottom: 'calc(50% - 150px)', color: '#00ff88', fontWeight: 900, fontSize: '0.8rem', textShadow: '0 0 10px #000' }}>ENCENDIENDO...</div>}
      </div>

      {/* Selector de Lentes en el Bottom */}
      <div style={{ padding: '40px 20px 60px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', pointerEvents: 'auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {cameras.map((cam: CameraDevice, i: number) => (
                <button
                    key={cam.id}
                    onClick={() => setSelectedCameraId(cam.id)}
                    disabled={isStarting}
                    style={{
                        padding: '12px 18px', borderRadius: '20px', border: '1.5px solid',
                        borderColor: selectedCameraId === cam.id ? '#00ff88' : 'rgba(255,255,255,0.1)',
                        background: selectedCameraId === cam.id ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.1)',
                        color: selectedCameraId === cam.id ? '#00ff88' : 'white',
                        fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer', backdropFilter: 'blur(15px)',
                    }}
                >
                    {i === 0 ? "PRINCIPAL" : i === 1 ? "ZOOM/WIFI" : "LENTE " + (i + 1)}
                </button>
            ))}
          </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
