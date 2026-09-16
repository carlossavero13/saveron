const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkDb() {
  const { data, error } = await supabase.from('accounts').select('*');
  console.log("Error:", error);
  console.log("Data:", data);
}

checkDb();
