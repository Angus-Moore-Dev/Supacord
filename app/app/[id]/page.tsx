import Visualiser from '@/components/Visualiser';
import { createServerClient } from '@/utils/supabaseServer';


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
        return <div className="flex flex-col gap-1">
            <h1>
                Error Fetching Project :(
            </h1>
            <p>
                Check the developer console for more information.
            </p>
            <small className='text-neutral-500'>
                {error.message}
            </small>
        </div>;
    }

    const { data: projectNodes, error: projectNodesError } = await supabase
        .from('project_nodes')
        .select('*')
        .eq('projectId', params.id);

    const { data: projectEdges, error: projectEdgesError } = await supabase
        .from('project_links')
        .select('*')
        .eq('projectId', params.id);

    if (projectNodesError || projectEdgesError)
    {
        console.error(projectNodesError || projectEdgesError);
        return <div className="flex flex-col gap-1">
            <h1>
                Error Fetching Project Data :(
            </h1>
            <p>
                Check the developer console for more information.
            </p>
            <small className='text-neutral-500'>
                {projectNodesError?.message || projectEdgesError?.message}
            </small>
        </div>;
    }

    return <Visualiser
        project={project}
        projectNodes={projectNodes}
        projectLinks={projectEdges}
    />;
}