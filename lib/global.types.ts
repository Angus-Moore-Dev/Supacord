import { Database } from './database.types';

export type SupabaseToken = Database['public']['Tables']['supabase_access_tokens']['Row'];

export type Project = Database['public']['Tables']['projects']['Row'];

export type ProjectNode = Database['public']['Tables']['project_nodes']['Row'];
export type ProjectLink = Database['public']['Tables']['project_links']['Row'];