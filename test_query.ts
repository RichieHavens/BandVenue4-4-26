import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase
    .from('events')
    .select('*, venues(name, address_line1, address_line2, city, state, postal_code, country), acts(*, bands:bands_ordered(name)), event_genres(genres(name))')
    .eq('is_published', true);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('EVENTS QUERY RESULT COUNT:', data?.length);
    if (data?.length === 0) {
      const { data: allEvents } = await supabase.from('events').select('id, is_published');
      console.log('ALL EVENTS COUNT:', allEvents?.length);
      console.log('PUBLISHED EVENTS COUNT:', allEvents?.filter(e => e.is_published).length);
    }
  }
}
run();
