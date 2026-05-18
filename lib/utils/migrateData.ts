import { db } from '../firebase';
import { createClient } from '@supabase/supabase-js';
import { collection, getDocs } from 'firebase/firestore';

export async function migrateDataToSupabase() {
  // Instanciar dentro de la función para que solo se ejecute en runtime,
  // no durante el build (donde las env vars no están disponibles)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const log: string[] = [];
  try {
    log.push("Iniciando migración de Firebase a Supabase...");

    // 1. Migrar Productos
    log.push("1/7 Migrando Productos...");
    const prodSnap = await getDocs(collection(db, 'products'));
    const firebaseProds = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    log.push(`Obtenidos ${firebaseProds.length} productos de Firebase.`);

    for (const p of firebaseProds) {
      const dataToSave = {
        id: p.id,
        name: p.title || '',
        store: 'delva', // IMPORTANTE: asociar a la tienda 'delva' compartida en Boga Market
        price: Number(p.price) || 0,
        category: p.category || '',
        subcategory: p.subCategoryId || '',
        stock: Number(p.stock) || 0,
        status: p.published !== false ? 'Activo' : 'Inactivo',
        image: p.image || '',
        description: p.description || '',
        // campos enriquecidos de Delva
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
        approvalRate: p.approvalRate || 0
      };

      const { error } = await supabase.from('products').upsert(dataToSave);
      if (error) {
        log.push(`❌ Error migrando producto ${p.id}: ${error.message}`);
      }
    }
    log.push("✅ Productos migrados con éxito.");

    // 2. Migrar Usuarios
    log.push("2/7 Migrando Usuarios...");
    const userSnap = await getDocs(collection(db, 'users'));
    const firebaseUsers = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    log.push(`Obtenidos ${firebaseUsers.length} usuarios de Firebase.`);
    
    for (const u of firebaseUsers) {
      const dataToSave = {
        id: u.id,
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
        status: u.status || 'active'
      };

      const { error } = await supabase.from('users').upsert(dataToSave);
      if (error) {
        log.push(`❌ Error migrando usuario ${u.id}: ${error.message}`);
      }
    }
    log.push("✅ Usuarios migrados con éxito.");

    // 3. Migrar Ventas (Sales)
    log.push("3/7 Migrando Ventas...");
    const salesSnap = await getDocs(collection(db, 'sales'));
    const firebaseSales = salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    log.push(`Obtenidas ${firebaseSales.length} ventas de Firebase.`);

    for (const s of firebaseSales) {
      const dataToSave = {
        id: s.id,
        items: s.items || [],
        total: Number(s.total) || 0,
        subtotal: Number(s.subtotal) || 0,
        discount: Number(s.discount) || 0,
        discountAmount: Number(s.discountAmount) || 0,
        paymentMethod: s.paymentMethod || '',
        createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
        sellerId: s.sellerId || ''
      };

      const { error } = await supabase.from('sales').upsert(dataToSave);
      if (error) {
        log.push(`❌ Error migrando venta ${s.id}: ${error.message}`);
      }
    }
    log.push("✅ Ventas migradas con éxito.");

    // 4. Migrar Gastos (Expenses)
    log.push("4/7 Migrando Gastos...");
    const expSnap = await getDocs(collection(db, 'expenses'));
    const firebaseExpenses = expSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    log.push(`Obtenidos ${firebaseExpenses.length} gastos de Firebase.`);

    for (const e of firebaseExpenses) {
      const dataToSave = {
        id: e.id,
        label: e.label || '',
        amount: Number(e.amount) || 0,
        category: e.category || '',
        createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
        storeId: e.storeId || ''
      };

      const { error } = await supabase.from('expenses').upsert(dataToSave);
      if (error) {
        log.push(`❌ Error migrando gasto ${e.id}: ${error.message}`);
      }
    }
    log.push("✅ Gastos migrados con éxito.");

    // 5. Migrar Gastos Fijos (Fixed Expenses)
    log.push("5/7 Migrando Gastos Fijos...");
    const fixedSnap = await getDocs(collection(db, 'fixedExpenses'));
    const firebaseFixed = fixedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    log.push(`Obtenidos ${firebaseFixed.length} gastos fijos de Firebase.`);

    for (const f of firebaseFixed) {
      const dataToSave = {
        id: f.id,
        label: f.label || '',
        amount: Number(f.amount) || 0,
        period: f.period || 'monthly',
        storeId: f.storeId || ''
      };

      const { error } = await supabase.from('fixedExpenses').upsert(dataToSave);
      if (error) {
        log.push(`❌ Error migrando gasto fijo ${f.id}: ${error.message}`);
      }
    }
    log.push("✅ Gastos fijos migrados con éxito.");

    // 6. Migrar Ajustes (Settings)
    log.push("6/7 Migrando Ajustes Globales...");
    const settingsSnap = await getDocs(collection(db, 'settings'));
    const firebaseSettings = settingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    log.push(`Obtenidos ${firebaseSettings.length} registros de settings de Firebase.`);

    for (const set of firebaseSettings) {
      const dataToSave = {
        id: set.id,
        waNumber: set.waNumber || '',
        brandName: set.brandName || '',
        primaryColor: set.primaryColor || '',
        logo: set.logo || '',
        font: set.font || '',
        socialLinks: set.socialLinks || null,
        categories: set.categories || null,
        colors: set.colors || null
      };

      const { error } = await supabase.from('settings').upsert(dataToSave);
      if (error) {
        log.push(`❌ Error migrando ajuste ${set.id}: ${error.message}`);
      }
    }
    log.push("✅ Ajustes migrados con éxito.");

    // 7. Migrar Banners
    log.push("7/7 Migrando Banners...");
    const bannerSnap = await getDocs(collection(db, 'banners'));
    const firebaseBanners = bannerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    log.push(`Obtenidos ${firebaseBanners.length} banners de Firebase.`);

    for (const b of firebaseBanners) {
      const dataToSave = {
        id: b.id,
        image: b.image || '',
        title: b.title || ''
      };

      const { error } = await supabase.from('banners').upsert(dataToSave);
      if (error) {
        log.push(`❌ Error migrando banner ${b.id}: ${error.message}`);
      }
    }
    log.push("✅ Banners migrados con éxito.");

    log.push("🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO A SUPABASE!");
  } catch (error: any) {
    log.push(`🚨 ERROR CRÍTICO EN MIGRACIÓN: ${error.message}`);
    console.error("Migration critical failure:", error);
  }
  return log;
}
