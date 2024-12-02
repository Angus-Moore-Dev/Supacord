'use client';

import { Macro, MacroInvocationResults } from '@/lib/global.types';
import { createBrowserClient } from '@/utils/supabaseBrowser';
import { useEffect, useState } from 'react';
import LargeMacroUILoader from '../macros/MacroUILoaders';
import { LargeMacroUI } from '../macros/MacroUIs';
import RainbowTimer from '../_common/RainbowTimer';
import Link from 'next/link';
import { Button, Pill } from '@mantine/core';
import { TZDate } from '@date-fns/tz';

interface MacroUIContainerProps
{
    macro: Macro;
    // update our local state with the new results
    results: MacroInvocationResults | undefined;
}

export function MacroUIContainer({ macro, results: r }: MacroUIContainerProps)
{
    const supabase = createBrowserClient();
    const [isFetching, setIsFetching] = useState(r === undefined);
    const [results, setResults] = useState<MacroInvocationResults | undefined>(r ?? undefined);


    useEffect(() => 
    {
        setResults(r);
    }, [r]);


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
                setResults(data[0] as MacroInvocationResults);
            else
                setResults(undefined);

            setIsFetching(false);
        };

        fetchResults();
    }, []);

    return <div className="flex flex-col gap-3 p-4 bg-[#0e0e0e] rounded-lg border-[1px] border-neutral-700">
        <section className='flex items-start justify-between gap-3 w-full'>
            <h3 className='text-center font-semibold mx-auto'>
                {macro.title}
            </h3>
        </section>
        <section className='flex flex-wrap gap-3 items-center justify-between bg-[#161616] p-2 rounded-lg'>
            <Link href={`/app/analytics/${macro.id}`}>
                <Button variant='subtle' size='xs'>
                    View Full History
                </Button>
            </Link>
            {
                results &&
                <section className='flex gap-3 items-center'>
                    <Pill>
                        Last Updated: {new TZDate(results.createdAt, undefined).toLocaleString()}
                    </Pill> 
                    <RainbowTimer
                        latestTime={Math.floor(new TZDate(results.createdAt, undefined).getTime() / 1000)}
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