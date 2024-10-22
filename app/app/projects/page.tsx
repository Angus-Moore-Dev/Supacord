import { createServerClient } from '@/utils/supabaseServer';
import Link from 'next/link';



export default async function ProjectsPage()
{
    const supabase = createServerClient();

    const { data, error } = await supabase.from('projects').select('*');

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
        <section className='w-full grid grid-cols-5 gap-5'>
            {
                data.map(project => <Link 
                    key={project.id}
                    href={`/app/${project.id}`}
                    className='p-4 px-8 bg-primary rounded-xl border-[1px] border-neutral-700 transition hover:bg-[#2a2a2a]'
                >
                    <h2>
                        {project.databaseName}
                    </h2>
                </Link>)
            }
        </section>
    </div>;
}