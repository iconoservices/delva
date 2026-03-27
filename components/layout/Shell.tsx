'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import LoginModal from '@/components/modals/LoginModal';
import CartDrawer from '@/components/modals/CartDrawer';
import EditProductModal from '@/components/modals/EditProductModal';

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    currentUser, globalBrandName, globalLogo, setIsCartOpen, 
    showLogin, setShowLogin, cart, globalPrimaryColor,
    globalFont
  } = useApp();

  const isProductPage = pathname.startsWith('/producto');

  const activeTheme = {
    primary: globalPrimaryColor,
    font: globalFont || 'Montserrat',
    bg: '#ffffff',
    surface: '#F9F9F9',
    radius: '20px'
  };

  return (
    <div className="app-layout" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      '--primary': activeTheme.primary,
      '--bg': activeTheme.bg,
      '--surface': activeTheme.surface,
      '--radius-md': activeTheme.radius,
      '--radius-lg': activeTheme.radius,
      '--font-main': `"${activeTheme.font}", sans-serif`,
      background: 'var(--bg)',
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    } as any}>
      {!isProductPage && (
        <nav className="navbar fade-in">
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
            <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer', flex: 1, display: 'flex' }}>
              {globalLogo ? (
                <img src={globalLogo} style={{ height: '30px' }} alt="logo" />
              ) : (
                <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{globalBrandName[0]}</span>
              )}
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '15px', alignItems: 'center' }}>
              <button className="nav-icon-btn" onClick={() => setIsCartOpen(true)} style={{ position: 'relative' }}>
                <span style={{ fontSize: '1.4rem' }}>🛒</span>
                {cart.length > 0 && <span className="nav-badge">{cart.length}</span>}
              </button>
              <button
                className="nav-icon-btn"
                onClick={() => {
                  if (currentUser) {
                    router.push('/admin');
                  } else {
                    setShowLogin(true);
                  }
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', overflow: 'hidden', border: '2px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                  {currentUser ? (
                    currentUser.photoURL ? <img src={currentUser.photoURL} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="user" /> : currentUser.initials
                  ) : '👤'}
                </div>
              </button>
            </div>
          </div>
        </nav>
      )}

      <main style={{ marginTop: isProductPage ? '0' : '58px', paddingBottom: '100px', flex: 1 }}>
        {children}
      </main>

      {/* MODALS */}
      <LoginModal show={showLogin} onClose={() => setShowLogin(false)} />
      <CartDrawer />
      <EditProductModal />
    </div>
  );
}
