'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MigratePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const runMigration = async () => {
    setRunning(true);
    setDone(false);
    setLogs([]);

    try {
      // ── 1. PRODUCTOS ──────────────────────────────────────────
      addLog('📦 [1/7] Leyendo productos de Firebase...');
      const prodSnap = await getDocs(collection(db, 'products'));
      addLog(`  → Encontrados ${prodSnap.docs.length} productos.`);

      for (const d of prodSnap.docs) {
        const p = d.data() as any;
        // Check if product already exists by firebase_id
        const { data: existing } = await supabaseAdmin
          .from('products')
          .select('id')
          .eq('firebase_id', d.id)
          .maybeSingle();

        const row: any = {
          firebase_id: d.id,  // Store Firebase ID in dedicated column
          name: p.title || '',
          store: 'delva',
          price: Number(p.price) || 0,
          category: p.category || '',
          subcategory: p.subCategoryId || '',
          stock: Number(p.stock) || 0,
          status: p.published !== false ? 'Activo' : 'Inactivo',
          image: p.image || '',
          description: p.description || '',
          sku: p.sku || '',
          slug: p.slug || '',
          waNumber: p.waNumber || '',
          gallery: p.gallery || [],
          colors: p.colors || [],
          tags: p.tags || [],
          details: p.details || [],
          subCategoryId: p.subCategoryId || '',
          subSubCategoryId: p.subSubCategoryId || '',
          userId: p.userId || '',
          hasOffer: p.hasOffer || false,
          originalPrice: p.originalPrice || null,
          costPrice: p.costPrice || null,
          viewCount: p.viewCount || 0,
          approvalRate: p.approvalRate || 0,
        };

        let error;
        if (existing?.id) {
          // Update existing record
          ({ error } = await supabaseAdmin.from('products').update(row).eq('id', existing.id));
        } else {
          // Insert new record (auto UUID)
          ({ error } = await supabaseAdmin.from('products').insert(row));
        }
        if (error) addLog(`  ❌ Producto ${d.id}: ${error.message}`);
        else addLog(`  ✅ Producto "${row.name}" migrado.`);
      }

      // ── 2. USUARIOS ───────────────────────────────────────────
      addLog('👤 [2/7] Leyendo usuarios de Firebase...');
      const userSnap = await getDocs(collection(db, 'users'));
      addLog(`  → Encontrados ${userSnap.docs.length} usuarios.`);

      for (const d of userSnap.docs) {
        const u = d.data() as any;
        const row = {
          id: d.id,
          name: u.name || '',
          role: u.role || 'customer',
          password: u.password || '',
          initials: u.initials || '',
          heardFrom: u.heardFrom || '',
          email: u.email || '',
          phone: u.phone || '',
          photoURL: u.photoURL || '',
          storeName: u.storeName || '',
          storeBio: u.storeBio || '',
          storeLogo: u.storeLogo || '',
          storeBanner: u.storeBanner || '',
          themeId: u.themeId || '',
          customPrimary: u.customPrimary || '',
          customBg: u.customBg || '',
          customSurface: u.customSurface || '',
          storeCategories: u.storeCategories || null,
          storeTags: u.storeTags || [],
          disabledDefaultCategories: u.disabledDefaultCategories || [],
          isPremium: u.isPremium || false,
          parentStoreId: u.parentStoreId || '',
          status: u.status || 'active',
        };
        const { error } = await supabaseAdmin.from('users').upsert(row);
        if (error) addLog(`  ❌ Usuario ${d.id}: ${error.message}`);
        else addLog(`  ✅ Usuario "${row.name}" migrado.`);
      }

      // ── 3. VENTAS ─────────────────────────────────────────────
      addLog('💰 [3/7] Leyendo ventas de Firebase...');
      const salesSnap = await getDocs(collection(db, 'sales'));
      addLog(`  → Encontradas ${salesSnap.docs.length} ventas.`);

      for (const d of salesSnap.docs) {
        const s = d.data() as any;
        const row = {
          id: d.id,
          items: s.items || [],
          total: Number(s.total) || 0,
          subtotal: Number(s.subtotal) || 0,
          discount: Number(s.discount) || 0,
          discountAmount: Number(s.discountAmount) || 0,
          paymentMethod: s.paymentMethod || 'efectivo',
          createdAt: s.createdAt ? new Date(s.createdAt?.seconds ? s.createdAt.seconds * 1000 : s.createdAt).toISOString() : new Date().toISOString(),
          sellerId: s.sellerId || '',
        };
        const { error } = await supabaseAdmin.from('sales').upsert(row);
        if (error) addLog(`  ❌ Venta ${d.id}: ${error.message}`);
        else addLog(`  ✅ Venta ${d.id} migrada.`);
      }

      // ── 4. GASTOS ─────────────────────────────────────────────
      addLog('🧾 [4/7] Leyendo gastos de Firebase...');
      const expSnap = await getDocs(collection(db, 'expenses'));
      addLog(`  → Encontrados ${expSnap.docs.length} gastos.`);

      for (const d of expSnap.docs) {
        const e = d.data() as any;
        const row = {
          id: d.id,
          label: e.label || '',
          amount: Number(e.amount) || 0,
          category: e.category || '',
          createdAt: e.createdAt ? new Date(e.createdAt?.seconds ? e.createdAt.seconds * 1000 : e.createdAt).toISOString() : new Date().toISOString(),
          storeId: e.storeId || '',
        };
        const { error } = await supabaseAdmin.from('expenses').upsert(row);
        if (error) addLog(`  ❌ Gasto ${d.id}: ${error.message}`);
        else addLog(`  ✅ Gasto "${row.label}" migrado.`);
      }

      // ── 5. GASTOS FIJOS ───────────────────────────────────────
      addLog('📋 [5/7] Leyendo gastos fijos de Firebase...');
      const fixedSnap = await getDocs(collection(db, 'fixedExpenses'));
      addLog(`  → Encontrados ${fixedSnap.docs.length} gastos fijos.`);

      for (const d of fixedSnap.docs) {
        const f = d.data() as any;
        const row = {
          id: d.id,
          label: f.label || '',
          amount: Number(f.amount) || 0,
          period: f.period || 'monthly',
          storeId: f.storeId || '',
        };
        const { error } = await supabaseAdmin.from('fixedExpenses').upsert(row);
        if (error) addLog(`  ❌ Gasto fijo ${d.id}: ${error.message}`);
        else addLog(`  ✅ Gasto fijo "${row.label}" migrado.`);
      }

      // ── 6. SETTINGS ───────────────────────────────────────────
      addLog('⚙️ [6/7] Leyendo ajustes de Firebase...');
      const settSnap = await getDocs(collection(db, 'settings'));
      addLog(`  → Encontrados ${settSnap.docs.length} ajustes.`);

      for (const d of settSnap.docs) {
        const s = d.data() as any;
        const row = {
          id: d.id,
          waNumber: s.waNumber || '',
          brandName: s.brandName || '',
          primaryColor: s.primaryColor || '',
          logo: s.logo || '',
          font: s.font || '',
          socialLinks: s.socialLinks || null,
          categories: s.categories || null,
          colors: s.colors || null,
        };
        const { error } = await supabaseAdmin.from('settings').upsert(row);
        if (error) addLog(`  ❌ Setting ${d.id}: ${error.message}`);
        else addLog(`  ✅ Setting "${d.id}" migrado.`);
      }

      // ── 7. BANNERS ────────────────────────────────────────────
      addLog('🖼️ [7/7] Leyendo banners de Firebase...');
      const bannSnap = await getDocs(collection(db, 'banners'));
      addLog(`  → Encontrados ${bannSnap.docs.length} banners.`);

      for (const d of bannSnap.docs) {
        const b = d.data() as any;
        const row = {
          id: d.id,
          image: b.image || '',
          title: b.title || '',
        };
        const { error } = await supabaseAdmin.from('banners').upsert(row);
        if (error) addLog(`  ❌ Banner ${d.id}: ${error.message}`);
        else addLog(`  ✅ Banner migrado.`);
      }

      addLog('');
      addLog('🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO A SUPABASE!');
      setDone(true);
    } catch (err: any) {
      addLog(`🚨 ERROR CRÍTICO: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e2e8f0', fontFamily: "'Outfit', monospace", padding: '40px 32px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '2rem' }}>🚀</span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Migración Firebase → Supabase
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
            Transfiere todos los datos de Delva (productos, usuarios, ventas, gastos, settings, banners) a la base de datos compartida de Supabase.
          </p>
        </div>

        {/* Warning */}
        <div style={{ background: '#1e1b4b', border: '1px solid #4338ca', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#c7d2fe', fontSize: '0.9rem' }}>Requisito: debes estar logueado como Master</p>
            <p style={{ margin: 0, color: '#818cf8', fontSize: '0.8rem' }}>La migración usa tu sesión activa de Firebase para leer los datos. Si no estás logueado, tendrás errores de permisos.</p>
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={runMigration}
          disabled={running}
          style={{
            background: running ? '#374151' : 'linear-gradient(135deg, #7c3aed, #2563eb)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 32px',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: running ? 'not-allowed' : 'pointer',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            opacity: running ? 0.7 : 1,
          }}
        >
          {running ? (
            <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Migrando…</>
          ) : done ? (
            <><span>✅</span> Migración Completada — ¡Correr de Nuevo!</>
          ) : (
            <><span>▶️</span> Iniciar Migración</>
          )}
        </button>

        {/* Log Terminal */}
        {logs.length > 0 && (
          <div style={{
            background: '#0d1117', border: '1px solid #30363d', borderRadius: '12px',
            padding: '20px', fontFamily: "'Courier New', monospace", fontSize: '0.82rem',
            lineHeight: 1.7, maxHeight: '600px', overflowY: 'auto',
          }}>
            {logs.map((log, i) => (
              <div key={i} style={{
                color: log.startsWith('  ❌') ? '#f87171'
                  : log.startsWith('  ✅') ? '#4ade80'
                    : log.startsWith('🎉') ? '#facc15'
                      : log.startsWith('🚨') ? '#f87171'
                        : log.startsWith('  →') ? '#94a3b8'
                          : '#e2e8f0',
              }}>
                {log || <>&nbsp;</>}
              </div>
            ))}
          </div>
        )}

        {done && (
          <div style={{ marginTop: '24px', background: '#052e16', border: '1px solid #166534', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '1.3rem', fontWeight: 900, color: '#4ade80', margin: '0 0 8px' }}>🎉 ¡Todo listo!</p>
            <p style={{ color: '#86efac', margin: 0, fontSize: '0.9rem' }}>
              Todos tus datos están ahora en Supabase. El próximo paso es actualizar el <code>AppContext.tsx</code> para leer desde Supabase.
            </p>
            <a href="/admin" style={{ display: 'inline-block', marginTop: '16px', background: '#16a34a', color: 'white', padding: '10px 24px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none' }}>
              ← Volver al Admin
            </a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
