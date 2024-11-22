'use client';

import { Macro, NotebookEntry, OutputType, Project } from '@/lib/global.types';
import { Divider, Loader, Alert, Menu } from '@mantine/core';
import { CodeHighlightTabs } from '@mantine/code-highlight';
import { User2, Pencil, SaveAll, MoreHorizontal, Trash, FilePenLine, SquareKanban, Code2 } from 'lucide-react';
import { BarChartVisual, PieChartVisual, LineChartVisual } from './ChartVisuals';
import { TableVisual } from './TableVisual';
import { createBrowserClient } from '@/utils/supabaseBrowser';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';


interface NotebookEntryUIProps
{
    disabled: boolean;
    project: Project;
    notebookEntry: NotebookEntry;
    onMacroSaving: (macro: Macro) => void;
}

export default function NotebookEntryUI({
    disabled,
    project, 
    notebookEntry: entry,
    onMacroSaving
}: NotebookEntryUIProps)
{
    const supabase = createBrowserClient();
    const [isSaving, setIsSaving] = useState(false);


    async function createNewMacro()
    {
        setIsSaving(true);
        const user = (await supabase.auth.getUser()).data.user!;

        const { data, error } = await supabase
            .from('user_macros')
            .insert({
                profileId: user.id,
                projectId: project.id,
                textPrompt: entry.userPrompt,
                queryData: entry.sqlQueries.map<{ sqlQuery: string, outputType: OutputType }>((query, index) => ({
                    sqlQuery: query,
                    outputType: entry.outputs[index].chunks[0].type
                })),
                pollingRate: ''
            })
            .select('*')
            .single();

        if (error)
        {
            console.error(error);
            setIsSaving(false);
            return;
        }

        // now we attach this macroId to the entry
        const { error: updateError } = await supabase
            .from('notebook_entries')
            .update({
                attachedMacroId: data.id
            })
            .eq('id', entry.id);
        
        if (updateError)
        {
            console.error(updateError);
            notifications.show({ title: 'Failed to attach macro to entry', message: 'Please try again', color: 'red' });
            setIsSaving(false);
            return;
        }

        onMacroSaving(data as Macro);
        setIsSaving(false);
    }


    return <div className={'bg-[#2a2a2a] p-4 px-8 rounded-md mb-2 whitespace-pre-line flex flex-col gap-5'}>
        <div className='flex gap-2 items-start'>
            <User2 size={32} className='text-transparent fill-green min-w-[32px]' />
            <h3 className='font-bold text-green mr-auto'>
                {entry.userPrompt}
            </h3>
            <Menu width={250} shadow={'md'} position={'bottom-end'} disabled={disabled}>
                <Menu.Target>
                    <MoreHorizontal size={20} className='transition hover:text-green min-w-[20px] hover:cursor-pointer' />
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item disabled={isSaving} color='blue' className='font-bold' rightSection={isSaving ? <Loader size={20} color='blue' /> : <SaveAll size={16} />} onClick={createNewMacro}>
                        Save As New Macro
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item disabled={isSaving} rightSection={<Pencil size={16} />}>
                        Edit User Prompt
                    </Menu.Item>
                    <Menu.Item disabled={isSaving} rightSection={<FilePenLine size={16} />}>
                        Edit SQL Query
                    </Menu.Item>
                    <Menu.Item disabled={isSaving} rightSection={<SquareKanban size={16} />}>
                        Change Output Type
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item disabled={isSaving} color='red' rightSection={<Trash size={16} />}>
                        Delete Entry
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
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
            entry.sqlQueries.map((query, index) =>
            {
                return <div key={index} className='flex flex-col gap-3 p-4 bg-[#1a1a1a] rounded-lg'>
                    <section className='flex items-start justify-between'>
                        <h4 className='text-neutral-500 font-medium'>
                            <span className='text-green'>#{index + 1}</span> SQL Query Run on <b>{project.databaseName}</b>
                        </h4>
                        <Menu width={250} shadow={'md'} position={'bottom-end'} disabled={disabled}>
                            <Menu.Target>
                                <MoreHorizontal size={20} className='transition hover:text-green min-w-[20px] hover:cursor-pointer' />
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Item disabled={isSaving} rightSection={<Pencil size={16} />}>
                                    Edit SQL Query
                                </Menu.Item>
                                <Menu.Item disabled={isSaving} rightSection={<SquareKanban size={16} />}>
                                    Change Output Type
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item disabled={isSaving} color='red' rightSection={<Trash size={16} />}>
                                    Delete Query
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </section>
                    <CodeHighlightTabs
                        withExpandButton
                        defaultExpanded={query.length < 250}
                        expandCodeLabel='Show Full Query'
                        collapseCodeLabel='Hide Full Query'
                        code={[
                            { fileName: 'Query.sql', code: query, language: 'sql' }
                        ]}
                        className='rounded-lg font-bold'
                        getFileIcon={() => <Code2 size={16} />}
                    />
                    {
                        entry.outputs[index] &&
                        entry.outputs[index].chunks.map((chunk, index) =>
                        {
                            switch (chunk.type.toLowerCase())
                            {
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
                            }
                        }
                        )
                    }
                    {
                        !entry.outputs[index] &&
                        <div className='flex flex-col gap-3'>
                            <Loader size={32} />
                            <h4>
                                Loading response...
                            </h4>
                        </div>
                    }
                </div>;
            })
        }
    </div>;
}