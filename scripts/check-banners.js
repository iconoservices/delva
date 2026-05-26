import { createClient } from '@supabase/supabase-js';

const url = "https://xywqjfcxvzpwiwteirai.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5d3FqZmN4dnpwd2l3dGVpcmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NDAyOTQsImV4cCI6MjA5NDIxNjI5NH0.uUvcdaGZdMUg2jA4xo2lLbnFTx8cnf4zARMTNoHsg04";

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('banners').select('*');
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Found", data.length, "banners:");
  data.forEach((b, i) => {
    console.log(`Banner ${i + 1}:`);
    console.log(`  id: ${b.id}`);
    console.log(`  title: ${b.title}`);
    console.log(`  image length: ${b.image?.length || 0}`);
    console.log(`  image preview: ${b.image ? b.image.substring(0, 100) : 'none'}`);
  });
}

check();
