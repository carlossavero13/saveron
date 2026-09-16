import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseBankEmail } from '@/lib/parsers';

// Este endpoint es el Webhook que Google Cloud Pub/Sub o Make.com llamará cuando llegue un correo
export async function POST(req: Request) {
  try {
    let body;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      body = {
        from: formData.get('from') as string,
        subject: formData.get('subject') as string,
        text: formData.get('text') as string,
      };
    } else {
      body = await req.json();
    }

    const { from, subject, text, account_id: provided_account_id } = body;

    if (!text) {
      return NextResponse.json({ error: 'Faltan datos del correo' }, { status: 400 });
    }

    // 2. Usar nuestra "Inteligencia" (Regex) para entender el correo
    const transactionData = parseBankEmail(from || '', subject || '', text);

    if (!transactionData) {
      return NextResponse.json({ error: 'No se reconoció el formato del correo' }, { status: 400 });
    }

    let account_id = provided_account_id;

    // Si Make.com no mandó el account_id, lo adivinamos basándonos en el correo
    if (!account_id) {
      const textLower = text.toLowerCase();
      let searchName = '';
      
      if (transactionData.bank === 'BCP AMEX') searchName = '%American%';
      else if (transactionData.bank === 'Ripley') searchName = '%Ripley%';
      else if (transactionData.bank === 'Sip!') searchName = '%Sip%';
      else if (transactionData.bank === 'BCP') {
        if (textLower.includes('débito')) searchName = '%Sueldo%';
        else searchName = '%VISA%'; // Asumimos VISA si es crédito y no fue AMEX
      }

      const { data: accounts } = await supabase.from('accounts').select('id').ilike('name', searchName).limit(1);
      if (accounts && accounts.length > 0) {
        account_id = accounts[0].id;
      }
    }

    if (!account_id) {
        return NextResponse.json({ error: 'No se pudo vincular a una tarjeta' }, { status: 400 });
    }

    // 3. Guardar en Supabase (Esto activará el Realtime en la pantalla del usuario al instante)
    const { error: insertError } = await supabase
      .from('transactions')
      .insert([
        {
          account_id: account_id,
          amount: transactionData.type === 'out' ? -transactionData.amount : transactionData.amount,
          type: transactionData.type,
          description: transactionData.description,
          category: 'Autodetectado'
        }
      ]);

    // 4. Actualizar el saldo de la tarjeta afectada
    if (!insertError) {
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
