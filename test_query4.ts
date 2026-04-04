import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
  const { data, error } = await supabase
    .rpc('get_schema_info'); // doesn't exist probably
  const { data: d2 } = await supabase.from('events').select('*').limit(1);
  console.log(Object.keys(d2?.[0] || {}));
}
test();
