import { supabase } from './supabase';

/**
 * System-wide email update process with logging.
 */
export async function updateUserEmail(newEmail: string, oldEmail: string, userId: string) {
  // 1. Log the start of the process
  const { data: log, error: logError } = await supabase
    .from('email_change_logs')
    .insert([{
      user_id: userId,
      old_email: oldEmail,
      new_email: newEmail,
      status: 'started'
    }])
    .select()
    .single();

  if (logError) throw logError;

  try {
    // 2. Update Auth Email
    const { error: authError } = await supabase.auth.updateUser({ email: newEmail });
    if (authError) throw authError;

    // 3. Update DB records via RPC
    const { error: rpcError } = await supabase.rpc('update_user_email_data', { new_email: newEmail });
    if (rpcError) throw rpcError;

    // 4. Log success
    await supabase
      .from('email_change_logs')
      .update({ status: 'success' })
      .eq('id', log.id);

  } catch (error: any) {
    // 5. Log failure/interruption
    await supabase
      .from('email_change_logs')
      .update({ 
        status: 'failed', 
        error_message: error.message 
      })
      .eq('id', log.id);
    
    throw error;
  }
}
