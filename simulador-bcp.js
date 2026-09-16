const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function simularCompraBCP() {
  const { data: accounts } = await supabase.from('accounts').select('*').ilike('name', '%BCP%').eq('type', 'credito').limit(1);
  
  if (!accounts || accounts.length === 0) {
    console.error("❌ No se encontró la tarjeta BCP Crédito");
    return;
  }

  const accountId = accounts[0].id;

  const correoBCP = {
    from: "notificaciones@notificacionesbcp.com.pe",
    subject: "Realizaste un consumo con tu Tarjeta de Crédito BCP",
    text: `Hola Carlos German, Realizaste un consumo de S/ 45.78 con tu Tarjeta de Crédito BCP en ARUMA LA PLANICIE. Por tu seguridad, te enviamos los datos de tu operación.`,
    account_id: accountId
  };

  console.log(`\n📩 Simulando llegada de correo REAL de BCP por S/ 45.78 en ARUMA LA PLANICIE...`);

  const response = await fetch('http://localhost:3000/api/webhook/gmail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(correoBCP)
  });

  const result = await response.json();
  if (result.success) {
    console.log("\n✅ ¡ÉXITO! La IA interpretó el formato real de BCP y extrajo la tienda y el monto.");
    console.log(result.detected);
  } else {
    console.error("❌ Error:", result);
  }
}

simularCompraBCP();
