import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: bands } = await supabase.from('bands').select('*').ilike('name', '%Boomerang%');
  console.log('Bands:', bands);
  
  if (bands && bands.length > 0) {
    const bandId = bands[0].id;
    const { data: acts } = await supabase.from('acts').select('*, events(*)').eq('band_id', bandId);
    console.log('Acts with events:', JSON.stringify(acts, null, 2));
  }
}

check();
