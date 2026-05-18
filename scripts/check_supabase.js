import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xywqjfcxvzpwiwteirai.supabase.co';
const supabaseAnonKey = 'sb_publishable_MNuI6eM7cQLEi00mJISX0A_l6ziEzzk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabase() {
  console.log("Conectando a Supabase...");
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(5);

    if (error) {
      console.error("🚨 Error consultando productos:", error.message);
    } else {
      console.log("✅ Conexión exitosa a la tabla 'products'!");
      console.log(`Número de productos encontrados (límite 5): ${data.length}`);
      console.log("Productos:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("🚨 Error inesperado:", err);
  }
}

checkSupabase();
