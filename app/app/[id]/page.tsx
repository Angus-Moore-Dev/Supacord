import Visualiser from '@/components/Visualiser';
import { createAdminApiClient, createServerClient } from '@/utils/supabaseServer';
import { Metadata } from 'next';


export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata>
{
    const supabase = createAdminApiClient();
    const { data: project, error } = await supabase
        .from('projects')
        .select('databaseName')
        .eq('id', params.id)
        .single();

    if (error)
    {
        console.error(error);
        return {
            title: 'Supacord | Data Visualiser',
        };
    }

    return {
        title: `${project.databaseName} | Supacord`
    };
}


export default async function AppVisualisePage({ params }: { params: { id: string } })
{
    const supabase = createServerClient();

    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single();

    if (error)
    {
        console.error(error);
        return <div className="flex flex-col gap-5">
            <h1>
                {error.code} - {error.message}
            </h1>
            <p>
                {error.details}
            </p>
        </div>;
    }

    return <Visualiser project={project} />;
}