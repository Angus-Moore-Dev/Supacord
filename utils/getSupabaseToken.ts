import { createServerClient } from './supabaseServer';


export default async function getSupabaseToken()
{
    const supabase = createServerClient();
    const { data: token, error } = await supabase
        .from('supabase_access_tokens')
        .select('*');

    if (error)
    {
        console.error(error);
        return null;
    }

    if (token.length === 0)
        return null;

    return token[0];
}