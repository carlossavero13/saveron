const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function cleanDuplicates() {
  console.log("Limpiando tarjetas duplicadas en la base de datos...");
  
  const { data: accounts } = await supabase.from('accounts').select('*');
  
  if (!accounts) return;

  const seen = new Set();
  const idsToDelete = [];

  for (const acc of accounts) {
    if (seen.has(acc.name)) {
      idsToDelete.push(acc.id);
    } else {
      seen.add(acc.name);
    }
  }

  if (idsToDelete.length > 0) {
    console.log(`Borrando ${idsToDelete.length} tarjetas duplicadas...`);
    for (const id of idsToDelete) {
      await supabase.from('accounts').delete().eq('id', id);
    }
    console.log("¡Listo! Tu base de datos quedó con las 5 tarjetas exactas.");
  } else {
    console.log("No se encontraron tarjetas duplicadas.");
  }
}

cleanDuplicates();
