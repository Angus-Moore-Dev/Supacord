import AnalyticsContainer from '@/components/analytics/AnalyticsContainer';
import { createServerClient } from '@/utils/supabaseServer';
import { Metadata } from 'next';


export async function generateMetadata(): Promise<Metadata>
{
    return {
        title: 'Realtime Analytics | Supacord',
        description: 'Realtime analytics and observation of your data, across all of your projects'
    };
}


export default async function AnalyticsPage({ searchParams }: { searchParams: { projectId: string } })
{
    const supabase = createServerClient();
    const projectId = searchParams.projectId;

    const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, databaseName, projectId')
        .order('createdAt', { ascending: true });

    if (projectsError)
    {
        console.error(projectsError);
        return <div>
            <h1>Error</h1>
            <p>Failed to load projects</p>
        </div>;
    }

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


    return <div className='w-full flex flex-col gap-5 flex-grow'>
        <AnalyticsContainer
            profile={profile}
            projects={projects}
            selectedProjectId={projectId}
        />
    </div>;
}