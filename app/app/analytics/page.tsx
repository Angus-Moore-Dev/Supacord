import { createServerClient } from '@/utils/supabaseServer';
import { Metadata } from 'next';


export async function generateMetadata(): Promise<Metadata>
{
    return {
        title: 'Realtime Analytics | Supacord',
        description: 'Realtime analytics and observation of your data, across all of your projects'
    };
}

export default async function AnalyticsPage()
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user!;

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError)
    {
        console.error(profileError);
        return <div>
            <h1>Error</h1>
            <p>Failed to load profile</p>
        </div>;
    }

    const { data: projectsAndMacros, error: projectsAndMacrosError } = await supabase
        .from('projects')
        .select('*, user_macros(*)');

    if (projectsAndMacrosError)
    {
        console.error(projectsAndMacrosError);
        return <div>
            <h1>Error</h1>
            <p>Failed to load projects and macros</p>
        </div>;
    }


    return <div className='w-full flex flex-col gap-5 px-16 py-8'>
        <h1>
            Analytics & Observation Page - TODO!!!!
        </h1>
    </div>;
}