import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import { Database } from '../lib/database.types';


export const createBrowserClient = () => createSupabaseBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);