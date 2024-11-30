'use client';

import { Macro, MacroInvocationResults } from '@/lib/global.types';
import { createBrowserClient } from '@/utils/supabaseBrowser';
import { Divider } from '@mantine/core';
import { useEffect, useState } from 'react';


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
            // fetch the latest results from the database
            const { data, error } = await supabase.from('user_macro_invocation_results').select('*').eq('macroId', macro.id).order('createdAt', { ascending: false }).limit(1);
            if (error)
            {
                console.error(error);
                return;
            }

            setResults(data.length > 0 ? data[0] as MacroInvocationResults : undefined);
            setIsFetching(false);
        };

        fetchResults();
    }, []);

    return <div className="flex flex-col gap-3 p-4 bg-[#0e0e0e] rounded-lg">
        {
            JSON.stringify(macro)
        }
        <Divider />
        {
            isFetching && <p>Fetching results...</p>
        }
        {
            !isFetching && results && JSON.stringify(results)
        }
    </div>;
}