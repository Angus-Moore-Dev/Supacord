import { Database } from './database.types';

export type SupabaseToken = Database['public']['Tables']['supabase_access_tokens']['Row'];