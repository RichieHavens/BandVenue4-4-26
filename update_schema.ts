import { supabase } from './src/lib/supabase';

async function updateSchema() {
  console.log('Updating favorites table constraint...');
  const { error } = await supabase.rpc('exec_sql', { 
    sql: `
      ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_target_type_check;
      ALTER TABLE favorites ADD CONSTRAINT favorites_target_type_check CHECK (target_type IN ('venue', 'band', 'musician', 'event'));
    `
  });

  if (error) {
    console.error('Error updating schema:', error);
  } else {
    console.log('Schema updated successfully!');
  }
}

updateSchema();
