import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: bands } = await supabase.from('bands').select('*').ilike('name', '%Boomerang%');
  console.log('Bands:', bands?.length);
  if (bands && bands.length > 0) {
    const bandId = bands[0].id;
    const { data: actData } = await supabase.from('acts').select('event_id').eq('band_id', bandId);
    console.log('Acts:', actData?.length);
    if (actData && actData.length > 0) {
      const eventIds = actData.map(a => a.event_id);
      const { data: events } = await supabase.from('events').select('*, acts(*)').in('id', eventIds);
      console.log('Events:', JSON.stringify(events, null, 2));
    }
  }
}

check();
