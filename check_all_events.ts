import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: events } = await supabase.from('events').select('*, acts(*, bands(name))').eq('is_published', true);
  console.log('Published events:', JSON.stringify(events, null, 2));
}

check();
