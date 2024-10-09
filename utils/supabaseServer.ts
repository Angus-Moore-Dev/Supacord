import { createServerClient as createClient } from '@supabase/ssr';

import { cookies } from 'next/headers';
import { Database } from '../lib/database.types';
import { createClient as createClientBase } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';


// Had major issues with the cookies parameters, so I had to import it from next/headers instead. Feel free to change back if you can get it working.

/**
 * For use in page.tsx files.
 */
export const createServerClient = () => 
{
    const cookieStore = cookies();
    noStore();
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() 
                {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) 
                {
                    try 
                    {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    }
                    catch 
                    {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
};

export const createAdminApiClient = () => 
{
    return createClientBase<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
};