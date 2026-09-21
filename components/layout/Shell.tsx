'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context/AppContext';
import LoginModal from '@/components/modals/LoginModal';
import CartDrawer from '@/components/modals/CartDrawer';
import EditProductModal from '@/components/modals/EditProductModal';
import PWAInstallPrompt from '@/components/common/PWAInstallPrompt';
import { matchesQuery } from '@/lib/utils/search';

const FONT_STACKS: Record<string, string> = {
  Outfit: 'var(--f-outfit), sans-serif',
  Montserrat: 'var(--f-montserrat), sans-serif',
};

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    currentUser, globalBrandName, globalLogo, setIsCartOpen, 
    showLogin, setShowLogin, cart, globalPrimaryColor,
    globalFont, users, setCurrentUser, setSelectedProfileForLogin,
    loginPassword, setLoginPassword, activeLoginTab, setActiveLoginTab,
    regName, setRegName, regPhone, setRegPhone, regHeardFrom, setRegHeardFrom,
    regPass, setRegPass, loginIdentifier, setLoginIdentifier, isLoggingIn,
    handleGoogleLogin, attemptLogin, isCartOpen, updateCartQty, referralCode,
    setReferralCode, globalWaNumber, editingProduct, setEditingProduct,
    globalCategories, globalTags, handleImageUpload, handleGalleryUpload,
    removeGalleryImage, isSaving, saveProduct, fileInputRef, galleryInputRef,
    products, generateSuggestedSKU, deleteProduct, confirmAction, globalColors,
    searchTerm, setSearchTerm
  } = useApp();
  const [showSearch, setShowSearch] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  const suggestions = React.useMemo(() => {
    if (!searchTerm.trim()) return [];
    return products.filter((p: any) => p.published !== false && matchesQuery([p.title, p.category, p.sku, p.description], searchTerm));
  }, [products, searchTerm]);

  const closeSearch = () => setShowSearch(false);
  const openProduct = (p: any) => { setShowSearch(false); router.push(`/producto/${p.slug || p.id}`); };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearch(false);
    if (pathname !== '/' && !pathname.startsWith('/tienda')) router.push('/tienda');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isProductPage = pathname.startsWith('/producto');
  const isAdminPage = pathname.startsWith('/admin');

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
      '--font-main': FONT_STACKS[activeTheme.font] || `"${activeTheme.font}", var(--f-outfit), sans-serif`,
      background: 'var(--bg)',
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    } as any}>
      {!isProductPage && !isAdminPage && (
        <nav className="navbar">
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
            <div className="logo" onClick={() => router.push('/')} style={{ cursor: 'pointer', display: 'flex', flexShrink: 0, marginRight: '15px' }}>
              {globalLogo ? (
                <img src={globalLogo} className="nav-logo-img" alt="logo" />
              ) : (
                <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{globalBrandName[0]}</span>
              )}
              <span className="nav-wordmark">{globalBrandName}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              
              <PWAInstallPrompt />

              <button className="nav-icon-btn" aria-label="Buscar" onClick={() => setShowSearch(v => !v)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              </button>

              <button className="nav-icon-btn nav-cart-btn" onClick={() => setIsCartOpen(true)} style={{ position: 'relative' }}>
                <span style={{ fontSize: '1.4rem' }}>🛒</span>
                {cart.length > 0 && <span className="nav-badge">{cart.length}</span>}
              </button>

              {/* Botón de WhatsApp Oficial - Movido a la derecha */}
              {globalWaNumber && (
                <a aria-label="WhatsApp" href={`https://wa.me/${globalWaNumber}?text=Hola,%20me%20gustar%C3%ADa%20hacer%20una%20consulta.`} target="_blank" rel="noopener noreferrer" className="nav-wa-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                  </svg>
                  <span className="nav-wa-label">WhatsApp</span>
                </a>
              )}

            </div>
          </div>
        </nav>
      )}

      {showSearch && !isProductPage && !isAdminPage && (
        <>
          <div className="nav-search-backdrop" onClick={closeSearch} />
          <form className="nav-search" onSubmit={submitSearch} onKeyDown={e => { if (e.key === 'Escape') closeSearch(); }}>
            <div className="search-bar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input ref={searchRef} className="search-input" placeholder="Buscar en Delva..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <button type="button" className="nav-search-close" aria-label="Cerrar" onClick={() => { setSearchTerm(''); closeSearch(); }}>✕</button>
            </div>

            {searchTerm.trim() && (
              <div className="nav-search-results">
                {suggestions.length === 0 ? (
                  <p className="nsr-empty">Sin resultados para “{searchTerm}”</p>
                ) : (
                  <>
                    {suggestions.slice(0, 6).map((p: any) => (
                      <button type="button" key={p.id} className="nsr-item" onClick={() => openProduct(p)}>
                        <img src={p.image} alt="" />
                        <span className="nsr-title">{p.title}</span>
                        <span className="nsr-price">S/ {Number(p.price || 0).toFixed(2)}</span>
                      </button>
                    ))}
                    <button type="submit" className="nsr-all">Ver los {suggestions.length} resultado{suggestions.length === 1 ? '' : 's'} →</button>
                  </>
                )}
              </div>
            )}
          </form>
        </>
      )}

      <main style={{ marginTop: (isProductPage || isAdminPage) ? '0' : '58px', paddingBottom: (isProductPage || isAdminPage) ? '0' : '84px', flex: 1 }}>
        {children}
      </main>

      {!isProductPage && !isAdminPage && (
        <nav className="bottom-nav" aria-label="Navegación principal">
          <button className={`bn-item ${pathname === '/' ? 'active' : ''}`} onClick={() => router.push('/')}>
            <span className="bn-icon">🏠</span><span>Inicio</span>
          </button>
          <button className={`bn-item ${pathname === '/tienda' ? 'active' : ''}`} onClick={() => router.push('/tienda')}>
            <span className="bn-icon">🛍️</span><span>Tienda</span>
          </button>
          <button className={`bn-item ${pathname.startsWith('/reservar') ? 'active' : ''}`} onClick={() => router.push('/reservar')}>
            <span className="bn-icon">🗓️</span><span>Reservar</span>
          </button>
          <button className="bn-item" onClick={() => setIsCartOpen(true)}>
            <span className="bn-icon" style={{ position: 'relative' }}>
              🛒{cart.length > 0 && <span className="nav-badge">{cart.length}</span>}
            </span><span>Carrito</span>
          </button>
        </nav>
      )}

      {/* MODALS */}
      <LoginModal 
        showLogin={showLogin} 
        setShowLogin={setShowLogin}
        users={users}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        setSelectedProfileForLogin={setSelectedProfileForLogin}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        activeLoginTab={activeLoginTab}
        setActiveLoginTab={setActiveLoginTab}
        regName={regName}
        setRegName={setRegName}
        regPhone={regPhone}
        setRegPhone={setRegPhone}
        regHeardFrom={regHeardFrom}
        setRegHeardFrom={setRegHeardFrom}
        regPass={regPass}
        setRegPass={setRegPass}
        loginIdentifier={loginIdentifier}
        setLoginIdentifier={setLoginIdentifier}
        isLoggingIn={isLoggingIn}
        handleGoogleLogin={handleGoogleLogin}
        attemptLogin={attemptLogin}
      />
      <CartDrawer 
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        cart={cart}
        updateCartQty={updateCartQty}
        referralCode={referralCode}
        setReferralCode={setReferralCode}
        globalWaNumber={globalWaNumber}
      />
      <EditProductModal 
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        globalCategories={globalCategories}
        globalTags={globalTags}
        handleImageUpload={handleImageUpload}
        handleGalleryUpload={handleGalleryUpload}
        removeGalleryImage={removeGalleryImage}
        isSaving={isSaving}
        saveProduct={saveProduct}
        fileInputRef={fileInputRef}
        galleryInputRef={galleryInputRef}
        products={products}
        generateSuggestedSKU={generateSuggestedSKU}
        deleteProduct={deleteProduct}
        confirmAction={confirmAction}
        globalColors={globalColors || []}
        currentUser={currentUser}
      />
    </div>
  );
}
