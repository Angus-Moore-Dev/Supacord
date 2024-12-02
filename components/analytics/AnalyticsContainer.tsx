'use client';

import { useState } from 'react';
import { Macro, MacroInvocationResults, Profile } from '@/lib/global.types';
import { useEffect } from 'react';
import { createBrowserClient } from '@/utils/supabaseBrowser';
import { MacroUIContainer } from './MacroUIContainer';
import { useRouter } from 'next/navigation';

interface AnalyticsContainerProps
{
    profile: Profile;
    projects: { id: string, databaseName: string }[];
    selectedProjectId: string;
}

export default function AnalyticsContainer({ profile, projects, selectedProjectId: spId }: AnalyticsContainerProps)
{
    const router = useRouter();
    const supabase = createBrowserClient();
    const [selectedProject, setSelectedProject] = useState(spId ?? '');
    const [macros, setMacros] = useState<Macro[]>([]);
    const [macroResults, setMacroResults] = useState<Record<string, MacroInvocationResults | undefined>>({});

    useEffect(() => 
    {
        if (macros.length > 0)
        {
            // Realtime listener for new results that come in for the macros we have
            const channel = supabase
                .channel(`${profile.id}_user_macros`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'user_macro_invocation_results',
                    filter: `macroId=in.(${macros.map(macro => macro.id).join(',')})`
                }, (payload) => 
                {
                    const newResult = payload.new as MacroInvocationResults;
                    setMacroResults(prev => ({ ...prev, [newResult.macroId]: newResult }));
                })
                .subscribe(status => console.log(status));

            return () => 
            {
                channel.unsubscribe();
            };
        }
    }, [macros]);


    useEffect(() => 
    {
        supabase.from('user_macros')
            .select('*')
            .eq('projectId', selectedProject)
            .then(({ data, error }) => 
            {
                if (error) console.error(error);
                setMacros((data ? data as Macro[] : []));

                // we want to grab the latest results for each macro (only 1 per macro though)
                const promiseChain = macros.map(macro => supabase
                    .from('user_macro_invocation_results')
                    .select('*')
                    .eq('macroId', macro.id)
                    .order('createdAt', { ascending: false })
                    .limit(1));
                Promise.all(promiseChain).then((results) => 
                {
                    setMacroResults(macros.reduce((acc, macro, index) => ({ ...acc, [macro.id]: results[index].data?.[0] ?? undefined }), {}));
                });
            });

        if (selectedProject)
            router.replace(`/app/analytics/?projectId=${selectedProject}`);
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
        {
            macros.length === 0 && selectedProject &&
            <div className='w-full flex-grow flex flex-col gap-3 items-center justify-center'>
                <h2 className='text-neutral-500 max-w-xl text-center'>
                    No Macros exist for <b>{projects.find(project => project.id === selectedProject)?.databaseName}</b> yet.
                </h2>
            </div>
        }
        {
            macros.length > 0 &&
            <div className='w-full grid grid-cols-2 gap-3 max-h-[calc(100vh-60px)] overflow-y-auto p-4'>
                <section className='flex flex-col gap-3'>
                    {/* Even numbered macros go here */}
                    {
                        // macros.filter((macro, index) => index % 2 === 0).map(macro => <MacroUIContainer key={macro.id} macro={macro} />)
                        macros.filter((_, index) => index % 2 === 0).map(macro => 
                            <MacroUIContainer
                                key={macro.id}
                                macro={macro}
                                results={macroResults[macro.id]}
                            />
                        )
                    }
                </section>
                <section className='flex flex-col gap-3'>
                    {/* Odd numbered macros go here */}
                    {
                        macros.filter((_, index) => index % 2 === 1).map(macro => 
                            <MacroUIContainer
                                key={macro.id}
                                macro={macro}
                                results={macroResults[macro.id]}
                            />
                        )
                    }
                </section>
            </div>
        }
    </section>;
}