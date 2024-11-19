'use client';

import { NotebookEntry, OutputType } from '@/lib/global.types';
import { Divider, Button, Loader, Code, Alert, Tooltip } from '@mantine/core';
import { User2, Pencil, RotateCw, SaveAll } from 'lucide-react';
import { BarChartVisual, PieChartVisual, LineChartVisual } from './ChartVisuals';
import { TableVisual } from './TableVisual';
// sha256 from crypto
// import bcrypt from 'bcrypt';
import sha256 from 'crypto-js/sha256';
import { useEffect } from 'react';
import { createBrowserClient } from '@/utils/supabaseBrowser';
import { notifications } from '@mantine/notifications';


interface NotebookEntryUIProps
{
    notebookEntry: NotebookEntry;
}

export default function NotebookEntryUI({ notebookEntry: entry }: NotebookEntryUIProps)
{
    const supabase = createBrowserClient();

    useEffect(() => 
    {
        if (!entry.sha256Hash) return;

        // if the hash doesn't match, update the hash and store it in the database.
        // the value to hash is a string concatenation of the prompt, the queries, and the outputs
        const hashResult = sha256(entry.userPrompt + entry.sqlQueries.join('') + entry.outputs.join('')).toString();
        console.log(hashResult, entry.sha256Hash);
        if (hashResult !== entry.sha256Hash)
        {
            supabase.from('notebook_entries').upsert({
                ...entry,
                sha256Hash: hashResult
            }).eq('id', entry.id)
                .then(({ error }) => 
                {
                    if (error)
                    {
                        console.error(error);
                        notifications.show({ title: 'Error', message: 'Failed to update entry hash', color: 'red' });
                    }

                    console.log('Updated hash');
                });
        }
    }, [entry]);


    return <div className={'bg-[#2a2a2a] p-4 px-8 rounded-md mb-2 whitespace-pre-line flex flex-col gap-3'}>
        <div className='flex gap-2 items-start'>
            <User2 size={32} className='text-transparent fill-green' />
            <h3 className='font-bold text-green'>
                {entry.userPrompt}
            </h3>
        </div>
        <Divider />
        {
            // if the latest message is a user, we temporarily mimic a fake message with just a loader
            entry.sqlQueries.length === 0 && entry.outputs.length === 0 &&
            <div className='bg-[#2a2a2a] p-4 px-8 rounded-md mb-2 whitespace-pre-line flex flex-col gap-3'>
                <Loader size={32} />
                <h4>
                    Loading response...
                </h4>
            </div>
        }
        {
            entry.sqlQueries.length > 0 && <h4 className='text-neutral-500 font-medium'>
                SQL Queries Run on Database
            </h4>
        }
        {
            // we want to map out the SQL queries, followed by the results
            entry.sqlQueries.map((query, index) => <div key={index} className='flex flex-col gap-1'>
                <Code lang='sql' p={'md'}>
                    {query}
                </Code>
            </div>)
        }
        {
            entry.outputs.map((output, index) =>
            {
                return <div key={index} className='flex flex-col gap-1'>
                    {
                        output.chunks.map((chunk, index) =>
                        {
                            switch (chunk.type.toLowerCase())
                            {
                            case OutputType.SQL:
                                return <div key={index} className='flex flex-col gap-1'>
                                    <section className='flex items-end justify-between'>
                                        <h4 className='text-neutral-500 font-medium'>
                                            SQL Query Run on Database
                                        </h4>
                                        <div className='flex gap-1'>
                                            <Tooltip position={'bottom'} label='Edit Macro/Query/Prompt'>
                                                <Button size='xs' variant='outline'>
                                                    <Pencil size={20} />
                                                </Button>
                                            </Tooltip>
                                            <Tooltip position={'bottom'} label='Re-run Query'>
                                                <Button size='xs' variant='outline'>
                                                    <RotateCw size={20} />
                                                </Button>
                                            </Tooltip>
                                            <Tooltip position={'bottom'} label='Save As New Macro'>
                                                <Button size='xs' variant='outline'>
                                                    <SaveAll size={20} />
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    </section>
                                    <Code lang='sql' p={'md'}>
                                        {chunk.content}
                                    </Code>
                                </div>;
                            case OutputType.Text:
                                return <p key={index} className='font-medium whitespace-pre-wrap'>
                                    {chunk.content}
                                </p>;
                            case OutputType.Table:
                                return <TableVisual key={index} data={JSON.parse(chunk.content)} />;
                            case OutputType.BarChart:
                                return <BarChartVisual
                                    key={index}
                                    content={JSON.parse(chunk.content)}
                                />;
                            case OutputType.LineChart:
                                return <LineChartVisual
                                    key={index}
                                    content={JSON.parse(chunk.content)}
                                />;
                            case OutputType.PieChart:
                                return <PieChartVisual
                                    key={index}
                                    content={JSON.parse(chunk.content)}
                                />;
                            case OutputType.Error:
                                return <Alert key={index} color='red' variant='filled'>
                                    {chunk.content}
                                </Alert>;
                            default:
                                return `TO BE ADDED: ${chunk.type}`;
                            }
                        }
                        )
                    }
                </div>;
            })
        }
    </div>;
}