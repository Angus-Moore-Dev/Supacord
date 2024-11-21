import VisualiserUI from '@/components/visualiser/VisualiserUI';
import { NotebookEntry } from '@/lib/global.types';
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


export default async function VisualiserPage({ params, searchParams }: { params: { id: string }, searchParams: { notebookId: string } })
{
    const supabase = createServerClient();
    const { data: project, error } = await supabase
        .from('projects')
        .select('*, user_macros(*)')
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

    const { data: notebooks, error: notebookError } = await supabase
        .from('notebooks')
        .select('*')
        .eq('projectId', project.id)
        .order('createdAt', { ascending: true });

    if (notebookError)
    {
        console.error(notebookError);
        return <div>
            <h1>Error</h1>
            <p>Failed to load notebooks</p>
        </div>;
    }

    let preSelectedNotebookEntries: NotebookEntry[] = [];
    if (searchParams.notebookId)
    {
        const { data: entries, error: entryError } = await supabase
            .from('notebook_entries')
            .select('*')
            .eq('notebookId', searchParams.notebookId)
            .order('createdAt', { ascending: true });

        if (entryError)
        {
            console.error(entryError);
            return <div>
                <h1>Error</h1>
                <p>Failed to load notebook entries</p>
            </div>;
        }

        preSelectedNotebookEntries = entries as NotebookEntry[];
    }

    return <VisualiserUI
        project={project}
        notebooks={notebooks}
        macros={project.user_macros}
        preSelectedNotebookId={searchParams.notebookId || ''}
        preSelectedNotebookEntries={preSelectedNotebookEntries}
    />;
}