'use client';

import { useState } from 'react';
import { Macro } from '@/lib/global.types';
import { useEffect } from 'react';
import { createBrowserClient } from '@/utils/supabaseBrowser';
import { MacroUIContainer } from './MacroUIContainer';

interface AnalyticsContainerProps
{
    projects: { id: string, databaseName: string }[];
}

export default function AnalyticsContainer({ projects }: AnalyticsContainerProps)
{
    const supabase = createBrowserClient();
    const [selectedProject, setSelectedProject] = useState(projects[0].id ?? '');
    const [macros, setMacros] = useState<Macro[]>([]);


    useEffect(() => 
    {
        supabase.from('user_macros')
            .select('*')
            .eq('projectId', selectedProject)
            .then(({ data, error }) => 
            {
                if (error) console.error(error);
                setMacros((data ? data as Macro[] : []));
            });
    }, [selectedProject]);


    return <section className='flex-grow flex bg-neutral-900' defaultValue={projects[0].id ?? ''}>
        <div className='flex-grow flex flex-col gap-1 min-w-[300px] max-w-[300px] bg-[#0e0e0e] border-r-[1px] border-neutral-700'>
            <div className={'w-full p-2 rounded-md bg-[#0e0e0e] flex flex-col gap-1 max-h-[calc(100vh-60px)] overflow-y-auto'}>
                {
                    projects.map(project => <button
                        key={project.id}
                        className={`w-full p-2 rounded-md transition ${selectedProject === project.id ? 'bg-darker-green' : 'hover:bg-[#1a1a1a]'}`}
                        onClick={() => setSelectedProject(project.id)}
                    >
                        <p className='text-sm font-medium'>{project.databaseName}</p>
                    </button>)
                }
            </div>
        </div>
        <div className='w-full grid grid-cols-2 gap-3 max-h-[calc(100vh-60px)] overflow-y-auto p-4'>
            <section className='flex flex-col gap-3'>
                {/* Even numbered macros go here */}
                {
                    // macros.filter((macro, index) => index % 2 === 0).map(macro => <MacroUIContainer key={macro.id} macro={macro} />)
                    macros.filter((_, index) => index % 2 === 0).map(macro => <MacroUIContainer key={macro.id} macro={macro} />)
                }
            </section>
            <section className='flex flex-col gap-3'>
                {/* Odd numbered macros go here */}
                {
                    macros.filter((macro, index) => index % 2 === 1).map(macro => <MacroUIContainer key={macro.id} macro={macro} />)
                }
            </section>
        </div>
        {/* <div className='flex-grow grid grid-cols-2 gap-3 max-h-[calc(100vh-60px)] overflow-y-auto p-4'>
            {
                macros.map(macro => <MacroUIContainer key={macro.id} macro={macro} />)
            }
        </div> */}
    </section>;
}