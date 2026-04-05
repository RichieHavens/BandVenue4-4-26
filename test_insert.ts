import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('acts').insert([{ id: '49fcee52-5d65-4e30-9e45-1efa666d5a03', event_id: '020ecf02-4138-49d8-9168-59a3b7854c85', band_id: '7fafb71f-957b-4159-ab8c-c2cc73f6f42a', start_time: '2026-04-10T12:00:00Z' }]);
  console.log('Error:', error);
}

check();
