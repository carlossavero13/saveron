const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function simularCompraBCPDebito() {
  const { data: accounts } = await supabase.from('accounts').select('*').ilike('name', '%BCP%').eq('type', 'debito').limit(1);
  
  if (!accounts || accounts.length === 0) {
    console.error("❌ No se encontró la tarjeta BCP Débito");
    return;
  }

  const accountId = accounts[0].id;

  const correoBCP = {
    from: "notificaciones@notificacionesbcp.com.pe",
    subject: "Realizaste un consumo con tu Tarjeta de Débito BCP",
    text: `Hola Carlos German, Realizaste un consumo de S/ 1.00 con tu Tarjeta de Débito BCP en PLIN-RICHARD FREDY HUAM. Por tu seguridad, te enviamos los datos de tu operación.`,
    account_id: accountId
  };

  console.log(`\n📩 Simulando llegada de correo REAL de BCP por S/ 1.00 en PLIN-RICHARD FREDY HUAM...`);

  const response = await fetch('http://localhost:3000/api/webhook/gmail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(correoBCP)
  });

  const result = await response.json();
  if (result.success) {
    console.log("\n✅ ¡ÉXITO! La IA interpretó el formato real de BCP Débito y lo mandó a la BD.");
  } else {
    console.error("❌ Error:", result);
  }
}

simularCompraBCPDebito();
