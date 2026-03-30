'use client';

import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // ID dinámico según plataforma para evitar conflictos
    const scannerId = isMobile ? "reader-mobile" : "reader-pc";
    
    const scanner = new Html5QrcodeScanner(
      scannerId,
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 }, // Cuadrado estándar que nunca falla
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        rememberLastUsedCamera: true
      },
      /* verbose= */ false
    );

    scanner.render((decodedText) => {
        // Al leer, detenemos y enviamos el resultado
        scanner.clear().then(() => {
            onScan(decodedText);
        }).catch(() => {
            onScan(decodedText);
        });
    }, (error) => {
        // Errores silenciosos de escaneo (normalmente no hay código en el frame)
    });

    return () => {
      scanner.clear().catch(err => console.warn("Scanner cleanup failed", err));
    };
  }, [isMobile, onScan]);

  // VISTA PARA PC (Modal centrado pequeño)
  if (!isMobile) {
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'white', borderRadius: '35px', width: '100%', maxWidth: '500px', padding: '30px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ margin: 0, fontWeight: 900, color: 'var(--primary)', fontSize: '1.4rem' }}>Inventario Delva PC 🌿</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#888' }}>Escaneo robusto y estable</p>
              </div>
              <button 
                onClick={onClose} 
                style={{ background: '#f0f0f0', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontWeight: 900, fontSize: '1.1rem', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>
            
            <div id="reader-pc" style={{ width: '100%', overflow: 'hidden', borderRadius: '25px', border: '2px solid #eee' }}></div>
            
            <div style={{ marginTop: '20px' }}>
                <button onClick={onClose} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '15px', fontWeight: 800, cursor: 'pointer' }}>CANCELAR</button>
            </div>
          </div>
        </div>
    );
  }

  // VISTA PARA MÓVIL (Versión 100% Estable y Segura)
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 10000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Header Limpio */}
      <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
          <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>Cámaras Delva</h3>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#666', fontWeight: 700 }}>VERSIÓN 100% ESTABLE</p>
          </div>
          <button 
            onClick={onClose} 
            style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#f5f5f5', border: 'none', color: 'black', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
      </div>

      {/* Contenedor del Escáner Estándar */}
      <div style={{ flex: 1, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
          <div id="reader-mobile" style={{ width: '100%', maxWidth: '400px', borderRadius: '25px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '4px solid white' }}></div>
      </div>

      {/* Footer Informativo */}
      <div style={{ padding: '30px 20px', textAlign: 'center', background: 'white', borderTop: '1px solid #eee' }}>
          <p style={{ margin: '0 0 15px', fontSize: '0.85rem', color: '#666', fontWeight: 600 }}>Si tienes problemas, selecciona otra cámara en el menú superior del visor.</p>
          <button 
            onClick={onClose} 
            style={{ width: '100%', padding: '18px', borderRadius: '20px', background: '#000', color: '#fff', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}
          >CERRAR ESCÁNER</button>
      </div>

      {/* CSS para pulir la UI por defecto de la librería */}
      <style>{`
        #reader-mobile__dashboard_section_csr button {
            background: #000 !important;
            color: white !important;
            border-radius: 12px !important;
            padding: 8px 15px !important;
            font-weight: 700 !important;
            border: none !important;
            margin: 5px !important;
        }
        #reader-mobile__dashboard_section_csr select {
            padding: 8px !important;
            border-radius: 10px !important;
            border: 1px solid #ddd !important;
            margin: 5px !important;
        }
        #reader-mobile video {
            border-radius: 20px !important;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
