import { createServerClient } from '@/utils/supabaseServer';
import CreateNewProject from '@/components/projects/CreateNewProject';
import { Button, Card } from '@mantine/core';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import SupabaseLogo from '@/public/supabase_logo_transparent.png';
import Image from 'next/image';

export default async function ProjectsPage()
{
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from('projects')
        .select(`
            id, 
            databaseName, 
            organisationId, 
            projectId, 
            createdAt,
            notebooks(id, projectId),
            saved_user_macros(id, projectId)
        `)
        .order('createdAt', { ascending: true });

    if (error)
    {
        return <div className="flex flex-col gap-5">
            <h1>Error fetching projects</h1>
            <p>{error.message}</p>
        </div>;
    }


    return <div className='w-full flex flex-col gap-5 px-16 py-8'>
        <section className='w-full flex gap-3 justify-between'>
            <h1>
                Projects
            </h1>
            <CreateNewProject />
        </section>
        <div className='grid grid-cols-3 gap-5'>
            {
                data.map(project => <Card key={project.id} padding={'lg'} radius={'lg'} withBorder bg={'#2a2a2a'} className='flex flex-col gap-3    '>
                    <section className='flex gap-3 items-start justify-between'>
                        <h3>
                            {project.databaseName}
                        </h3>
                        <Link target='_blank' href={`https://www.supabase.com/dashboard/project/${project.projectId}`}>
                            <Button variant='subtle' rightSection={<ExternalLink size={16} />}>
                                <Image src={SupabaseLogo} alt='Supabase Logo' width={16} height={16} />
                            </Button>
                        </Link>
                    </section>
                    <small className='text-neutral-500 font-medium'>
                        <b>{project.projectId}</b> | {project.notebooks.length} Notebooks | {project.saved_user_macros.length} Macros
                    </small>
                    <section className='flex gap-3'>
                        <Link href={`/app/${project.id}`}>
                            <Button>
                                Enter Notebook
                            </Button>
                        </Link>
                    </section>
                </Card>)
            }
        </div>
    </div>;
}