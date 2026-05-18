'use client';

import React from 'react';
import { useApp } from '@/lib/context/AppContext';
import { useRouter } from 'next/navigation';
import AdminDashboardView from '@/components/views/AdminDashboardView';

export default function AdminPage() {
  const {
    products, users, globalCategories, setEditingProduct, currentUser,
    globalBrandName, globalWaNumber, globalPrimaryColor,
    globalLogo, globalFont, globalSocialLinks, banners,
    onRecordSale, alertAction, confirmAction, globalTags,
    setActiveCategory, setCurrentUser, setShowLogin, isLoading,
    updateProductStock, assignSKUToProduct, generateSuggestedSKU, 
    deleteProduct, logout, isSynced, authEmail,
    globalColors, saveGlobalColors
  } = useApp();

  const router = useRouter();

  // Not logged in → show login prompt
  if (!currentUser) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '16px' }}>
        {isLoading ? (
          <p style={{ opacity: 0.4, fontSize: '0.9rem' }}>Cargando…</p>
        ) : (
          <>
            <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>Debes iniciar sesión para acceder al admin.</p>
            <button
              onClick={() => setShowLogin(true)}
              style={{ padding: '12px 28px', background: '#1A3C34', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Iniciar Sesión
            </button>
          </>
        )}
      </div>
    );
  }

  // Stub functions for settings — they need to be wired to AppContext or Firestore
  const saveSettings = async () => {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    
    // As per user's "everyone is admin" and "master handles everything" logic:
    // We save directly to the global settings to avoid permission issues and simplify the flow.
    await setDoc(doc(db, 'settings', 'global'), {
      brandName: globalBrandName,
      waNumber: globalWaNumber,
      primaryColor: globalPrimaryColor,
      logo: globalLogo,
      font: globalFont,
      socialLinks: globalSocialLinks,
    }, { merge: true });
  };

  const saveGlobalCategories = async (newCats: any[]) => {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');

    // Restore to global-only target as per backups 0.001 & 0.1
    // This allows the Admin/Master to manage the entire marketplace categories from Inventory Manager.
    await setDoc(doc(db, 'settings', 'global'), { categories: newCats }, { merge: true });
  };

  const compressImage = async (file: File): Promise<string> => {
    const { default: imageCompression } = await import('browser-image-compression');
    const options = { maxSizeMB: 0.6, maxWidthOrHeight: 1200, useWebWorker: true };
    const compressed = await imageCompression(file, options);
    return URL.createObjectURL(compressed);
  };

  const noop = () => {};

  return (
    <AdminDashboardView
      currentUser={currentUser}
      products={products}
      users={users}
      exportDB={noop}
      globalBrandName={globalBrandName || ''}
      setGlobalBrandName={noop}
      globalPrimaryColor={globalPrimaryColor || '#0f3025'}
      setGlobalPrimaryColor={noop}
      globalFont={globalFont || 'Outfit'}
      setGlobalFont={noop}
      globalWaNumber={globalWaNumber || ''}
      setGlobalWaNumber={noop}
      globalGridCols={3}
      setGlobalGridCols={noop}
      globalLogo={globalLogo || ''}
      setGlobalLogo={noop}
      globalFavicon={''}
      setGlobalFavicon={noop}
      globalMetaDesc={''}
      setGlobalMetaDesc={noop}
      globalKeywords={''}
      setGlobalKeywords={noop}
      globalSocialLinks={globalSocialLinks || {}}
      setGlobalSocialLinks={noop}
      globalTags={globalTags || []}
      setGlobalTags={noop}
      globalCategories={globalCategories || []}
      setGlobalCategories={noop}
      handleLogoUpload={noop}
      handleFaviconUpload={noop}
      saveSettings={saveSettings}
      saveGlobalCategories={saveGlobalCategories}
      compressImage={compressImage}
      setEditingProduct={setEditingProduct}
      updateProductStock={updateProductStock}
      assignSKUToProduct={assignSKUToProduct}
      generateSuggestedSKU={generateSuggestedSKU}
      deleteProduct={deleteProduct}
      logout={() => {
        logout();
        router.push('/');
      }}
      isSynced={isSynced}
      authEmail={authEmail}
      SOCIAL_ICONS={{}}
      confirmAction={confirmAction}
      alertAction={alertAction}
      onRecordSale={onRecordSale}
      banners={banners || []}
      globalColors={globalColors || []}
      saveGlobalColors={saveGlobalColors}
    />
  );
}
