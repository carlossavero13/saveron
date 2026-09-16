const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function simularCompraSip() {
  const { data: accounts } = await supabase.from('accounts').select('*').ilike('name', '%Sip%').limit(1);
  
  if (!accounts || accounts.length === 0) {
    console.error("❌ No se encontró la tarjeta Sip!");
    return;
  }

  const accountId = accounts[0].id;

  const correoSip = {
    from: "no-reply@servicioalcliente.sip.pe",
    subject: "Sip, realizaste un consumo con tu Tarjeta de Crédito Sip",
    text: `Hola, CARLOS. Has realizado una transacción con tu Tarjeta de Crédito Sip. Tarjeta Titular: XXXXXXXXXXXX6601 Establecimiento: TOULON Monto: S/. 3.40 Fecha de operación: 14/09/2026 a las 20:48`,
    account_id: accountId
  };

  console.log(`\n📩 Simulando llegada de correo REAL de Sip! por S/. 3.40 en TOULON...`);

  const response = await fetch('http://localhost:3000/api/webhook/gmail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(correoSip)
  });

  const result = await response.json();
  if (result.success) {
    console.log("\n✅ ¡ÉXITO! La IA interpretó el formato real de Sip! y extrajo la tienda y el monto.");
    console.log(result.detected);
  } else {
    console.error("❌ Error:", result);
  }
}

simularCompraSip();
