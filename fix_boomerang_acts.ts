import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const bandId = '7fafb71f-957b-4159-ab8c-c2cc73f6f42a';
  
  const actsToInsert = [
    {
      event_id: '020ecf02-4138-49d8-9168-59a3b7854c85',
      band_id: bandId,
      start_time: '2026-04-10T12:00:00Z'
    },
    {
      event_id: '4a55f9a4-5485-46d6-9a58-b7825977df57',
      band_id: bandId,
      start_time: '2026-06-07T12:00:00Z'
    }
  ];

  const { data, error } = await supabase.from('acts').insert(actsToInsert);
  console.log('Inserted acts:', data);
  console.log('Error:', error);
}

fix();
