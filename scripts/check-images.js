import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = "https://xywqjfcxvzpwiwteirai.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5d3FqZmN4dnpwd2l3dGVpcmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NDAyOTQsImV4cCI6MjA5NDIxNjI5NH0.uUvcdaGZdMUg2jA4xo2lLbnFTx8cnf4zARMTNoHsg04";

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('banners').select('*');
  if (error) {
    console.error("Error:", error);
    return;
  }
  data.forEach((b, i) => {
    if (b.image && b.image.startsWith('data:image')) {
      const base64Data = b.image.split(',')[1];
      fs.writeFileSync(`banner_${i + 1}.jpg`, base64Data, 'base64');
      console.log(`Saved banner_${i + 1}.jpg`);
    } else {
      console.log(`Banner ${i + 1} has no data URL:`, b.image);
    }
  });
}

check();
