const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function updateBalances() {
  console.log("Sincronizando deudas reales...");

  // AMEX LATAM Pass: 6700 - 2672.60 = 4027.40 de deuda
  await supabase.from('accounts').update({ balance: -4027.40 }).ilike('name', '%American%');
  
  // Ripley Mastercard: 1000 - 238.20 = 761.80 de deuda
  await supabase.from('accounts').update({ balance: -761.80 }).ilike('name', '%Ripley%');

  // Sip!: 3000 - 2749.77 = 250.23 de deuda
  await supabase.from('accounts').update({ balance: -250.23 }).ilike('name', '%Sip%');

  // VISA LATAM Pass: 2920 - 2746.37 = 173.63 de deuda
  await supabase.from('accounts').update({ balance: -173.63 }).ilike('name', '%VISA%');

  console.log("¡Sincronización completada!");
}

updateBalances();
