const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function simularCompra() {
  console.log("🔍 Buscando tu cuenta de Débito BCP en la base de datos...");
  const { data: accounts } = await supabase.from('accounts').select('*').ilike('name', '%BCP%').eq('type', 'debito').limit(1);
  
  if (!accounts || accounts.length === 0) {
    console.error("❌ No se encontró la cuenta 'BCP Débito'. Asegúrate de haber corrido el código SQL en Supabase.");
    return;
  }

  const accountId = accounts[0].id;
  const precio = (Math.random() * 150).toFixed(2); // Precio aleatorio entre 0 y 150

  const correoFalso = {
    from: "alertas@bcp.com.pe",
    subject: "Aviso de Consumo BCP",
    text: `Estimado cliente, se ha realizado un consumo por S/ ${precio} en STARBUCKS con su Tarjeta. Si no reconoce esta operación, comuníquese con nosotros.`,
    account_id: accountId
  };

  console.log(`\n📩 Simulando llegada de correo de BCP por S/ ${precio} en Starbucks...`);

  const response = await fetch('http://localhost:3000/api/webhook/gmail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(correoFalso)
  });

  const result = await response.json();
  if (result.success) {
    console.log("\n✅ ¡ÉXITO! El servidor Next.js interceptó el correo, lo leyó, y guardó el gasto en Supabase.");
    console.log("👀 ¡Mira tu página web (http://localhost:3000)! Tu saldo y el historial deberían haberse actualizado mágicamente solos.");
  } else {
    console.error("❌ Error en el Webhook:", result);
  }
}

simularCompra();
