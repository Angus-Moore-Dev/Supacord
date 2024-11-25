import VisualiserUI from '@/components/visualiser/VisualiserUI';
import { Macro, NotebookEntry } from '@/lib/global.types';
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

/**
 * Visualiser Page Component
 * 
 * Server component that renders the data visualization interface for a specific project.
 * Handles data fetching and initial state setup for the VisualiserUI client component.
 *
 * @param {Object} props
 * @param {Object} props.params - URL parameters
 * @param {string} props.params.id - Project ID from URL
 * @param {Object} props.searchParams - URL search parameters 
 * @param {string} props.searchParams.notebookId - Optional notebook ID to pre-select
 *
 * Features:
 * - Fetches project details including:
 *   - Database name and configuration
 *   - Associated user macros
 *   - Project owner profile
 * - Loads all notebooks for the project
 * - Pre-fetches entries for selected notebook if notebookId provided
 * - Handles error states for failed data fetches
 * - Generates dynamic page metadata based on project
 *
 * Data Flow:
 * 1. Fetches project, profile and macro data
 * 2. Loads all notebooks for project
 * 3. If notebook ID provided, fetches associated entries
 * 4. Passes all data to VisualiserUI client component
 *
 * Error Handling:
 * - Displays error UI if project fetch fails
 * - Handles notebook and entry fetch failures
 * - Preserves type safety through database types
 */

export default async function VisualiserPage({ params, searchParams }: { params: { id: string }, searchParams: { notebookId: string } })
{
    const supabase = createServerClient();
    const { data: project, error } = await supabase
        .from('projects')
        .select('*, user_macros(*), profiles!inner(*)')
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
        profile={project.profiles}
        macros={project.user_macros as Macro[]}
        preSelectedNotebookId={searchParams.notebookId || ''}
        preSelectedNotebookEntries={preSelectedNotebookEntries}
    />;
}