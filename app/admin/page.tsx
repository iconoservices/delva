'use client';

import React from 'react';
import { useApp } from '@/lib/context/AppContext';
import MasterPanel from '@/components/admin/sections/MasterPanel';

export default function AdminPage() {
  const { 
    products, users, globalCategories, setEditingProduct,
    globalBrandName, globalWaNumber, globalPrimaryColor,
    globalLogo, globalFont, globalSocialLinks, banners,
    onRecordSale, alertAction, confirmAction
  } = useApp();

  const [activeTab, setActiveTab] = React.useState('master');
  const [selectedStoreId, setSelectedStoreId] = React.useState('');

  return (
    <div className="admin-page-container fade-in" style={{ padding: '20px' }}>
      <MasterPanel 
        products={products}
        users={users}
        globalCategories={globalCategories}
        setActiveTab={setActiveTab}
        setSelectedStoreId={setSelectedStoreId}
        selectedStoreId={selectedStoreId}
        setEditingProduct={setEditingProduct}
      />
    </div>
  );
}
