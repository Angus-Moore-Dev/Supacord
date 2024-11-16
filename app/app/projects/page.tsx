import { createServerClient } from '@/utils/supabaseServer';
import ProjectsTable from '@/components/projects/ProjectsTable';


export default async function ProjectsPage()
{
    const supabase = createServerClient();

    const { data, error } = await supabase.from('projects').select('*').order('createdAt', { ascending: true });

    if (error)
    {
        return <div className="flex flex-col gap-5">
            <h1>Error fetching projects</h1>
            <p>{error.message}</p>
        </div>;
    }

    return <div className='w-full flex flex-col gap-5 px-16 py-8'>
        <h1>
            Projects
        </h1>
        <ProjectsTable projects={data} />
    </div>;
}