const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function resetBalances() {
  console.log("Limpiando deudas antiguas...");
  await supabase.from('accounts').update({ balance: 0.00 }).eq('type', 'credito');
  console.log("Deudas puestas a cero.");
}

resetBalances();
