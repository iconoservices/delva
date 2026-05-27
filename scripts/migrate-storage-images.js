import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parsear .env.local de forma manual para evitar depender de la librería 'dotenv'
function loadEnvLocal() {
  const envPath = path.resolve('.env.local');
  if (!fs.existsSync(envPath)) {
    console.error("🚨 Error: No se encontró el archivo .env.local en la raíz del proyecto.");
    process.exit(1);
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEq = trimmed.indexOf('=');
    if (firstEq === -1) return;
    const key = trimmed.substring(0, firstEq).trim();
    let value = trimmed.substring(firstEq + 1).trim();
    // Remover comillas si existen
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  });
  return env;
}

const env = loadEnvLocal();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("🚨 Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  console.log("Asegúrate de que ambas estén declaradas en tu .env.local:");
  console.log("NEXT_PUBLIC_SUPABASE_URL=https://...");
  console.log("SUPABASE_SERVICE_ROLE_KEY=eyJhbG...");
  process.exit(1);
}

// Inicializar cliente de Supabase usando el SERVICE ROLE KEY para poder escribir en Storage y saltar RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function downloadImage(url) {
  try {
    const res = await fetch(url);
    if (res.status === 402) {
      throw new Error("Firebase Spark plan deshabilitado (Error 402 - Payment Required). Por favor, cambia a plan Blaze en Firebase Console.");
    }
    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType
    };
  } catch (err) {
    console.error(`   ❌ Fallo al descargar de ${url.substring(0, 80)}...`);
    console.error(`      Motivo: ${err.message}`);
    return null;
  }
}

async function uploadToSupabase(buffer, originalUrl, contentType) {
  // Obtener extensión del content-type
  let ext = "jpg";
  if (contentType.includes("png")) ext = "png";
  else if (contentType.includes("webp")) ext = "webp";
  else if (contentType.includes("gif")) ext = "gif";

  const filename = `migrated_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
  const uploadPath = `delva/migrated/${filename}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(uploadPath, buffer, {
      contentType,
      upsert: true
    });

  if (error) {
    console.error(`   ❌ Error subiendo a Supabase Storage:`, error.message);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(uploadPath);

  return publicUrlData.publicUrl;
}

async function migrate() {
  console.log("====================================================");
  console.log("🚀 INICIANDO MIGRACIÓN DE IMÁGENES FIREBASE ➔ SUPABASE");
  console.log("====================================================");
  console.log(`Supabase URL: ${supabaseUrl}`);

  // 1. Obtener todos los productos de la tienda 'delva'
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('store', 'delva');

  if (error) {
    console.error("🚨 Error al obtener productos de Supabase:", error.message);
    return;
  }

  console.log(`\n📦 Se encontraron ${products.length} productos en la tienda 'delva'.`);
  
  let migratedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const product of products) {
    console.log(`\n----------------------------------------------------`);
    console.log(`Product [${product.id}] - ${product.name}`);

    let needsUpdate = false;
    let updatedImage = product.image;
    let updatedGallery = [...(product.gallery || [])];

    // --- Procesar Imagen Principal ---
    if (product.image && product.image.includes('firebasestorage.googleapis.com')) {
      console.log(`📸 Imagen principal en Firebase detectada:`);
      console.log(`   URL: ${product.image.substring(0, 100)}...`);
      
      const fileData = await downloadImage(product.image);
      if (fileData) {
        console.log(`   ⬇️ Descargada con éxito. Subiendo a Supabase Storage...`);
        const newUrl = await uploadToSupabase(fileData.buffer, product.image, fileData.contentType);
        if (newUrl) {
          console.log(`   ✅ Subida completada. Nueva URL: ${newUrl}`);
          updatedImage = newUrl;
          needsUpdate = true;
          migratedCount++;
        } else {
          failedCount++;
        }
      } else {
        failedCount++;
      }
    } else {
      console.log(`   ⏭️ Imagen principal ya está migrada o no es de Firebase.`);
      skippedCount++;
    }

    // --- Procesar Galería ---
    if (product.gallery && Array.isArray(product.gallery)) {
      for (let i = 0; i < product.gallery.length; i++) {
        const item = product.gallery[i];
        if (item && item.includes('firebasestorage.googleapis.com')) {
          console.log(`📸 Imagen de galería [${i}] en Firebase detectada...`);
          const fileData = await downloadImage(item);
          if (fileData) {
            console.log(`   ⬇️ Descargada. Subiendo a Supabase...`);
            const newUrl = await uploadToSupabase(fileData.buffer, item, fileData.contentType);
            if (newUrl) {
              console.log(`   ✅ Nueva URL de galería [${i}]: ${newUrl}`);
              updatedGallery[i] = newUrl;
              needsUpdate = true;
              migratedCount++;
            } else {
              failedCount++;
            }
          } else {
            failedCount++;
          }
        }
      }
    }

    // --- Guardar en Base de Datos ---
    if (needsUpdate) {
      console.log(`💾 Guardando nuevas URLs de imágenes en Supabase DB...`);
      const { error: updateErr } = await supabase
        .from('products')
        .update({
          image: updatedImage,
          gallery: updatedGallery
        })
        .eq('id', product.id);

      if (updateErr) {
        console.error(`   ❌ Error al actualizar producto en DB:`, updateErr.message);
      } else {
        console.log(`   🎉 Producto actualizado con éxito en Supabase!`);
      }
    } else {
      console.log(`   ⏭️ No se requieren cambios en la base de datos.`);
    }
  }

  console.log(`\n====================================================`);
  console.log("🏁 RESUMEN DE MIGRACIÓN DE IMÁGENES");
  console.log("====================================================");
  console.log(`✅ Migradas con éxito:  ${migratedCount}`);
  console.log(`❌ Fallidas / Pendientes: ${failedCount}`);
  console.log(`⏭️ Omitidas (ya en Supabase): ${skippedCount}`);
  console.log("====================================================");
  if (failedCount > 0) {
    console.log("💡 POR QUÉ FALLÓ:");
    console.log("   Firebase ha bloqueado tu almacenamiento porque tu proyecto está en el plan gratuito 'Spark'.");
    console.log("   Google deprecó el uso de Cloud Storage en el plan Spark.");
    console.log("\n🛠️ PASOS PARA SOLUCIONARLO:");
    console.log("   1. Entra a Firebase Console: https://console.firebase.google.com/");
    console.log("   2. Selecciona tu proyecto 'delva-cb9d5'.");
    console.log("   3. Haz clic en 'Upgrade' (Mejorar) abajo a la izquierda en la barra lateral.");
    console.log("   4. Cambia del plan gratuito 'Spark' al plan 'Blaze' (pago por uso).");
    console.log("      * Nota: Blaze es completamente gratuito dentro de límites razonables; no te cobrarán nada a menos que tengas tráfico masivo.");
    console.log("   5. Una vez activado Blaze, vuelve a ejecutar este script:");
    console.log("      node scripts/migrate-storage-images.js");
    console.log("   6. ¡Listo! Tus imágenes se copiarán a Supabase y se actualizarán automáticamente en la web.");
  }
}

migrate();
