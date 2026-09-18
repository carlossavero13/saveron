
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: sueldo } = await supabase.from('accounts').select('*').ilike('name', '%Sueldo%').single();
  if (sueldo) {
    await supabase.from('accounts').update({ balance: 106.00 }).eq('id', sueldo.id);
    console.log('Restaurado saldo BCP a 106.00');
    
    // Solo borramos las transacciones de salida de la cuenta sueldo que digan 'Pago de Tarjeta'
    const { data: outTxs } = await supabase.from('transactions')
      .select('*')
      .eq('account_id', sueldo.id)
      .eq('type', 'out')
      .ilike('description', 'Pago de Tarjeta%');
      
    if (outTxs && outTxs.length > 0) {
       for (let tx of outTxs) {
         await supabase.from('transactions').delete().eq('id', tx.id);
       }
       console.log('Borradas ' + outTxs.length + ' transacciones de salida de la cuenta sueldo');
    }
  }
}
run();

