'use client';

import { Macro, MacroInvocationResults } from '@/lib/global.types';
import { createBrowserClient } from '@/utils/supabaseBrowser';
import { useEffect, useState } from 'react';
import LargeMacroUILoader from '../macros/MacroUILoaders';
import { LargeMacroUI } from '../macros/MacroUIs';
import RainbowTimer from '../_common/RainbowTimer';


interface MacroUIContainerProps
{
    macro: Macro;
}

export function MacroUIContainer({ macro }: MacroUIContainerProps)
{
    const supabase = createBrowserClient();
    const [isFetching, setIsFetching] = useState(true);
    const [results, setResults] = useState<MacroInvocationResults>();

    useEffect(() => 
    {
        const fetchResults = async () => 
        {
            setIsFetching(true);
            // fetch the latest results from the database
            const { data, error } = await supabase
                .from('user_macro_invocation_results')
                .select('*')
                .eq('macroId', macro.id)
                .order('createdAt', { ascending: false })
                .limit(1);
                
            if (error)
            {
                console.error(error);
                return;
            }

            if (data.length > 0)
            {
                setResults(data[0] as MacroInvocationResults);
            }
            else
            {
                setResults(undefined);
            }

            setIsFetching(false);
        };

        fetchResults();
    }, []);

    return <div className="flex flex-col gap-1 p-4 bg-[#0e0e0e] rounded-lg border-[1px] border-neutral-700">
        <section className='flex gap-3 items-center justify-between bg-[#161616] p-2 rounded-lg'>
            <small className='text-center text-neutral-500'>
                {JSON.stringify(macro.pollingRate)}
            </small>
            {
                results &&
                <section className='flex gap-3 items-center'>
                    <RainbowTimer
                        latestTime={Math.floor(new Date(results.createdAt).getTime() / 1000)}
                        pollingRate={macro.pollingRate}
                    />
                </section>
            }
        </section>
        {
            (!results || isFetching) && 
            <LargeMacroUILoader />
        }
        {
            !results && !isFetching && 
            <p className='text-center mx-auto text-neutral-500'>
                No results found
            </p>
        }
        {
            results && 
            <LargeMacroUI macro={macro} results={results} />
        }
    </div>;
}