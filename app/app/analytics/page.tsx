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


export default async function AnalyticsPage()
{
    const supabase = createServerClient();

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


    return <div className='w-full flex flex-col gap-5 flex-grow'>
        <AnalyticsContainer
            projects={projects}
        />
    </div>;
}