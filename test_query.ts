import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
  const { data, error } = await supabase
    .from('events')
    .select('*, profiles!updated_by(first_name, last_name, email), venues(name), acts(start_time)')
    .order('start_time', { ascending: false, nullsFirst: false });
  console.log('Error:', error);
  console.log('Data length:', data?.length);
}
test();
