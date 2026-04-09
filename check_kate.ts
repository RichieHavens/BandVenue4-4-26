
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function checkPerson() {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .ilike('first_name', 'Kate')
    .ilike('last_name', 'Clark');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Found:', data);
  }
}

checkPerson();
