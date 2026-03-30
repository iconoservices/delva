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
 * Gestiona el motor y la selección de cámaras.
 */
const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // Estado para el zoom digital

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
      console.error("Cámaras no detectadas", err);
      setError("No se detectaron cámaras.");
    });
  }, [isMobile]);

  // Función para aplicar zoom en caliente (sin detener el escáner)
  const applyZoom = useCallback(async (level: number) => {
    if (!scannerInstanceRef.current || !scannerInstanceRef.current.isScanning) return;
    try {
        const track = (scannerInstanceRef.current as any).getRunningTrack();
        const capabilities = track.getCapabilities() as any;
        if (capabilities.zoom) {
            const targetZoom = Math.min(level, capabilities.zoom.max || 1);
            await track.applyConstraints({
                advanced: [{ zoom: targetZoom }]
            } as any);
            setZoomLevel(targetZoom);
        }
    } catch (err) {
        console.warn("No se pudo aplicar el zoom manual", err);
    }
  }, []);

  // 2. Lógica del motor (Móvil)
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
        
        // Al iniciar, intentar aplicar un zoom por defecto moderado (1.5x)
        try {
            const track = (scanner as any).getRunningTrack();
            const capabilities = track.getCapabilities() as any;
            if (capabilities.zoom) {
                await track.applyConstraints({
                    advanced: [{ zoom: 1.5 }]
                } as any);
                setZoomLevel(1.5);
            }
        } catch(e) {}
        
        setIsStarting(false);
    } catch (err) {
        console.error("Switch error", err);
        setError("Error al iniciar lente.");
        setIsStarting(false);
    }
  }, [onScan]);

  useEffect(() => {
    if (isMobile && selectedCameraId) {
        const timer = setTimeout(() => startScanningOnCamera(selectedCameraId), 300);
        return () => clearTimeout(timer);
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
        #reader-mobile video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
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
        applyZoom={applyZoom}
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
      <div style={{
        background: 'white', borderRadius: '35px', width: '100%', maxWidth: '500px',
        padding: '30px', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem' }}>Escáner PC 🌿</h2>
          <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontWeight: 900 }}>✕</button>
        </div>
        <div id="reader-pc" style={{ width: '100%', overflow: 'hidden', borderRadius: '25px', border: '2px solid #eee' }}></div>
      </div>
    </div>
  );
};

/**
 * UI DE MÓVIL (CON ZOOM MANUAL)
 */
interface MobileScannerUIProps {
  cameras: CameraDevice[];
  onClose: () => void;
  selectedCameraId: string | null;
  setSelectedCameraId: (id: string) => void;
  isStarting: boolean;
  error: string | null;
  zoomLevel: number;
  applyZoom: (level: number) => void;
}

const MobileScannerUI: React.FC<MobileScannerUIProps> = ({ cameras, onClose, selectedCameraId, setSelectedCameraId, isStarting, error, zoomLevel, applyZoom }) => {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 1, pointerEvents: 'none' }}>
      {/* Top Bar */}
      <div style={{ padding: '25px 20px', background: 'linear-gradient(rgba(0,0,0,0.8), transparent)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#00ff88' }}>Delva Scan</h3>
            <p style={{ margin: 0, fontSize: '0.65rem', opacity: 0.6 }}>PREMIUM EXPERIENCE</p>
          </div>
          <button onClick={onClose} style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '1.4rem', fontWeight: 900, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>✕</button>
      </div>

      {/* Visor Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 'calc(50% - 110px)', background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 'calc(50% - 110px)', background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'absolute', top: 'calc(50% - 110px)', left: 0, width: 'calc(50% - 165px)', height: '220px', background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'absolute', top: 'calc(50% - 110px)', right: 0, width: 'calc(50% - 165px)', height: '220px', background: 'rgba(0,0,0,0.6)' }} />

          <div style={{ width: '330px', height: '220px', position: 'relative', overflow: 'hidden', border: '2px solid rgba(0, 255, 136, 0.4)', borderRadius: '25px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '25px', height: '25px', borderTop: '5px solid #00ff88', borderLeft: '5px solid #00ff88', borderTopLeftRadius: '25px' }} />
              <div style={{ position: 'absolute', top: 0, right: 0, width: '25px', height: '25px', borderTop: '5px solid #00ff88', borderRight: '5px solid #00ff88', borderTopRightRadius: '25px' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '25px', height: '25px', borderBottom: '5px solid #00ff88', borderLeft: '5px solid #00ff88', borderBottomLeftRadius: '25px' }} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '25px', height: '25px', borderBottom: '5px solid #00ff88', borderRight: '5px solid #00ff88', borderBottomRightRadius: '25px' }} />
              <div className="scanner-laser-line" style={{ height: '3px', filter: 'blur(1px)' }} />
          </div>

          {isStarting && <div style={{ position: 'absolute', bottom: 'calc(50% - 150px)', color: '#00ff88', fontWeight: 900, fontSize: '0.8rem', textShadow: '0 0 10px #000' }}>ENCENDIENDO LENTE...</div>}
      </div>

      {/* Manual Zoom Controls - Flotantes */}
      <div style={{ padding: '20px', textAlign: 'center', pointerEvents: 'auto' }}>
          <div style={{ display: 'inline-flex', gap: '15px', background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '30px', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {[1.0, 1.5, 2.0, 3.0].map((level) => (
                  <button
                    key={level}
                    onClick={() => applyZoom(level)}
                    style={{
                        width: '44px', height: '44px', borderRadius: '50%', border: 'none',
                        background: zoomLevel === level ? '#00ff88' : 'rgba(255,255,255,0.1)',
                        color: zoomLevel === level ? 'black' : 'white',
                        fontWeight: 900, cursor: 'pointer', transition: 'all 0.3s',
                        fontSize: '0.75rem'
                    }}
                  >
                      {level}x
                  </button>
              ))}
          </div>
      </div>

      {/* Selector de Cámaras en el Bottom */}
      <div style={{ padding: '0px 20px 60px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))', pointerEvents: 'auto', textAlign: 'center' }}>
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
                        transition: 'all 0.3s'
                    }}
                >
                    {i === 0 ? "PRINCIPAL" : i === 1 ? "WIFI/ZOOM" : "LENTE " + (i + 1)}
                </button>
            ))}
          </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
