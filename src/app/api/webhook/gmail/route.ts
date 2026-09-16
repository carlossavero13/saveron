import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseBankEmail } from '@/lib/parsers';

// Este endpoint es el Webhook que Google Cloud Pub/Sub llamará cuando llegue un correo
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Extraer los datos enviados por la simulación o por Google
    const { from, subject, text, account_id } = body;

    if (!text || !account_id) {
      return NextResponse.json({ error: 'Faltan datos del correo o account_id' }, { status: 400 });
    }

    // 2. Usar nuestra "Inteligencia" (Regex) para entender el correo
    const transactionData = parseBankEmail(from || '', subject || '', text);

    if (!transactionData) {
      return NextResponse.json({ error: 'No se reconoció el formato del correo' }, { status: 400 });
    }

    // 3. Guardar en Supabase (Esto activará el Realtime en la pantalla del usuario al instante)
    const { error: insertError } = await supabase
      .from('transactions')
      .insert([
        {
          account_id: account_id, // El ID de la cuenta (ej. Débito BCP)
          amount: transactionData.type === 'out' ? -transactionData.amount : transactionData.amount,
          type: transactionData.type,
          description: transactionData.description,
          category: 'Autodetectado'
        }
      ]);

    // 4. Actualizar el saldo de la tarjeta afectada
    if (!insertError) {
      // Obtenemos saldo actual
      const { data: acc } = await supabase.from('accounts').select('balance').eq('id', account_id).single();
      if (acc) {
        const newBalance = Number(acc.balance) + (transactionData.type === 'out' ? -transactionData.amount : transactionData.amount);
        await supabase.from('accounts').update({ balance: newBalance }).eq('id', account_id);
      }
    }

    return NextResponse.json({ success: true, detected: transactionData });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
