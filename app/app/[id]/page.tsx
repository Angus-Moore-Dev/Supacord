import VisualiserUI from '@/components/visualiser/VisualiserUI';
import { createAdminClient, createServerClient } from '@/utils/supabaseServer';
import { Metadata } from 'next';


export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata>
{
    const supabase = createAdminClient();
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


export default async function VisualiserPage({ params }: { params: { id: string } })
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
        return <div>
            <h1>Error</h1>
            <p>Failed to load project</p>
        </div>;
    }

    return <VisualiserUI project={project} />;
}