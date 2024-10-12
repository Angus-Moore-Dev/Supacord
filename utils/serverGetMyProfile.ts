import { createServerClient } from './supabaseServer';


export default async function serverGetMyProfile()
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user)
        return null;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error)
    {
        console.error(error);
        return null;
    }

    return profile;
}