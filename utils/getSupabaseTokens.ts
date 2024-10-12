import { createServerClient } from './supabaseServer';


export default async function getSupabaseTokens()
{
    const supabase = createServerClient();
    const { data: tokens, error } = await supabase
        .from('supabase_access_tokens')
        .select('*');

    if (error)
    {
        console.error(error);
        return null;
    }

    if (tokens.length === 0)
        return null;

    return tokens;
}