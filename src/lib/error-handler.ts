import { supabase } from './supabase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | undefined;
    emailVerified: boolean | undefined;
  }
}

/**
 * Handles Supabase errors by enriching them with context and throwing a JSON-stringified error.
 * This follows the diagnostic pattern required for bulletproof applications.
 */
export async function handleSupabaseError(error: any, operationType: OperationType, path: string | null) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const errInfo: SupabaseErrorInfo = {
    error: error?.message || String(error),
    operationType,
    path,
    authInfo: {
      userId: user?.id,
      email: user?.email,
      emailVerified: !!user?.email_confirmed_at,
    }
  };

  const errorString = JSON.stringify(errInfo);
  console.error('Supabase Error Context:', errorString);
  
  // Throw a standard Error with the JSON string as the message
  throw new Error(errorString);
}

/**
 * Helper to check if an error is a "Missing or insufficient permissions" error.
 */
export function isPermissionError(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  return message.includes('permission denied') || 
         message.includes('insufficient permissions') || 
         message.includes('missing or insufficient permissions');
}
