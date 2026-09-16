const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function simularCompraRipley() {
  const { data: accounts } = await supabase.from('accounts').select('*').ilike('name', '%Ripley%').limit(1);
  
  if (!accounts || accounts.length === 0) {
    console.error("❌ No se encontró la tarjeta Ripley");
    return;
  }

  const accountId = accounts[0].id;

  const correoRipley = {
    from: "alerta-autorizaciones@bancoripley.com.pe",
    subject: "Notificaciones consumos Banco Ripley",
    text: `BANCO RIPLEY - Te informamos que el día 13/05/2026 a las 17:25:51 has realizado un consumo con tu tarjeta Ripley MASTERCARD SILVER (Titular) número 525435******0709 por S/ 149.94, en PORTA FREEDOM SANTA AN. El número de la operación es 558767.`,
    account_id: accountId
  };

  console.log(`\n📩 Simulando llegada de correo REAL de Ripley por S/ 149.94 en PORTA FREEDOM SANTA AN...`);

  const response = await fetch('http://localhost:3000/api/webhook/gmail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(correoRipley)
  });

  const result = await response.json();
  if (result.success) {
    console.log("\n✅ ¡ÉXITO! La IA interpretó el formato real de Ripley.");
    console.log(result.detected);
  } else {
    console.error("❌ Error:", result);
  }
}

simularCompraRipley();
