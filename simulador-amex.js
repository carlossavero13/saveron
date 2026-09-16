const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function simularCompraAMEX() {
  const { data: accounts } = await supabase.from('accounts').select('*').ilike('name', '%American%').limit(1);
  
  if (!accounts || accounts.length === 0) {
    console.error("❌ No se encontró la tarjeta AMEX");
    return;
  }

  const accountId = accounts[0].id;

  const correoAMEX = {
    from: "notificaciones@notificacionesbcp.com.pe",
    subject: "Realizaste una operación con tu Tarjeta de Crédito BCP",
    text: `Hola Carlos German, Realizaste una operación de S/ 53.60 con tu Tarjeta de Crédito BCP. Por tu seguridad, te enviamos los datos de tu operación. Monto Total de la operación S/ 53.60 Datos de la operación Operación realizada Operación con Tarjeta de Crédito Fecha y hora 07 de setiembre de 2026 - 11:34 AM Número de Tarjeta de Crédito ***********9824 Banco de destino Empresa SEDA000006000039 Canal de atención Banca Móvil BM22`,
    account_id: accountId
  };

  console.log(`\n📩 Simulando llegada de correo REAL de AMEX por S/ 53.60 en SEDA000006000039...`);

  const response = await fetch('http://localhost:3000/api/webhook/gmail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(correoAMEX)
  });

  const result = await response.json();
  if (result.success) {
    console.log("\n✅ ¡ÉXITO! La IA interpretó el formato especial de AMEX/Operaciones.");
    console.log(result.detected);
  } else {
    console.error("❌ Error:", result);
  }
}

simularCompraAMEX();
