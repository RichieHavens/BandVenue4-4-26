import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
  const { data, error } = await supabase
    .from('events')
    .update({ hero_url: 'test' })
    .eq('id', '8e654e90-9bd0-4586-9ee1-de6913bf1b3f');
  console.log('Error:', error);
}
test();
