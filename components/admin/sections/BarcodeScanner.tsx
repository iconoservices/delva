'use client';

import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    const handleScanSuccess = (decodedText: string) => {
        scanner.clear().then(() => {
            onScan(decodedText);
        }).catch(err => {
            console.warn(err);
            onScan(decodedText);
        });
    };

    scanner.render(handleScanSuccess, (error) => {
      // Silently ignore scan errors
    });

    return () => {
      scanner.clear().catch(err => console.warn("Scanner cleanup failed", err));
    };
  }, [onScan]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      zIndex: 3000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '35px',
        width: '100%',
        maxWidth: '500px',
        padding: '24px',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ margin: 0, fontWeight: 900, color: 'var(--primary)' }}>Escáner Delva 🌿</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>Apunta al código de barras</p>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: '#f5f5f5', 
              border: 'none', 
              borderRadius: '50%', 
              width: '36px', 
              height: '36px', 
              cursor: 'pointer',
              fontWeight: 900,
              fontSize: '1rem',
              color: '#999'
            }}
          >✕</button>
        </div>
        
        <div id="reader" style={{ 
            width: '100%', 
            overflow: 'hidden', 
            borderRadius: '25px',
            border: '2px solid #f0f0f0'
        }}></div>
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontSize: '1.2rem' }}>📱</span>
            <p style={{ fontSize: '0.85rem', color: '#444', fontWeight: 600, margin: 0 }}>
                El escaneo es automático al detectar el código.
            </p>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
