'use client';

import { Macro, NotebookEntry, OutputType, Profile, Project } from '@/lib/global.types';
import { Divider, Loader, Alert, Menu } from '@mantine/core';
import { CodeHighlightTabs } from '@mantine/code-highlight';
import { User2, SaveAll, MoreHorizontal, Trash, SquareKanban, Code2 } from 'lucide-react';
import { BarChartVisual, PieChartVisual, LineChartVisual } from './ChartVisuals';
import { TableVisual } from './TableVisual';
import { useState } from 'react';
import Image from 'next/image';
import CreateNewMacro from '@/components/macros/CreateNewMacro';
import { createBrowserClient } from '@/utils/supabaseBrowser';


interface NotebookEntryUIProps
{
    profile: Profile;
    disabled: boolean;
    project: Project;
    notebookEntry: NotebookEntry;
    onDeleteEntry: () => void;
    onMacroCreated: (macro: Macro) => void;
}


/**
 * NotebookEntryUI Component
 * 
 * A component that displays a single notebook entry in a SQL analysis project. It shows
 * user prompts, SQL queries, and their corresponding outputs in various visual formats.
 * 
 * @component
 * 
 * Props:
 * @param {Profile} profile - The user profile information including optional profile picture
 * @param {boolean} disabled - Whether the entry's interactive elements should be disabled
 * @param {Project} project - The current project information including database name
 * @param {NotebookEntry} notebookEntry - The notebook entry data containing prompts, queries, and outputs
 * @param {Function} onMacroSaving - Callback function when a new macro is saved (currently commented out)
 * 
 * Features:
 * - Displays user profile picture (or default icon) and prompt
 * - Shows SQL queries with syntax highlighting and expandable view
 * - Supports multiple output types:
 *   - Text
 *   - Data Tables
 *   - Bar Charts
 *   - Line Charts
 *   - Pie Charts
 *   - Error Messages
 * - Interactive menu with options to:
 *   - Create new macros
 *   - Edit prompts
 *   - Delete entries
 *   - Change output types
 * - Loading states for queries and outputs
 * 
 * Visual Elements:
 * - Sticky header with user info and actions
 * - Dark theme with green accent colors
 * - Rounded containers with proper spacing
 * - Expandable code blocks for long queries
 */
export default function NotebookEntryUI({
    profile,
    disabled,
    project, 
    notebookEntry: entry,
    onDeleteEntry,
    onMacroCreated
}: NotebookEntryUIProps)
{
    const supabase = createBrowserClient();
    const [openMacroModal, setOpenMacroModal] = useState(false);

    async function deleteEntry()
    {
        if (confirm('Are you sure you want to delete this entry?'))
        {
            await supabase.from('notebook_entries').delete().eq('id', entry.id);
            onDeleteEntry();
        }
    }

    return <div className={'bg-[#2a2a2a] p-4 px-8 rounded-md mb-2 whitespace-pre-line flex flex-col gap-5 relative'}>
        <div className='flex gap-2 items-start sticky top-0 z-30 bg-[#2a2a2a] p-4 px-8 rounded-lg'>
            {
                !profile.profilePictureURL && <User2 size={32} className='text-transparent fill-green min-w-[32px]' />
            }
            {
                profile.profilePictureURL &&
                <Image src={profile.profilePictureURL} alt={'Profile Picture'} width={48} height={48} className='rounded-full object-cover max-w-[48px] max-h-[48px] h-[48px] w-[48px]' />
            }
            <h3 className='font-bold text-green mr-auto'>
                {entry.userPrompt}
            </h3>
            <Menu width={250} shadow={'md'} position={'bottom-end'} disabled={disabled}>
                <Menu.Target>
                    <MoreHorizontal size={20} className='transition hover:text-green min-w-[20px] hover:cursor-pointer' />
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item rightSection={<SaveAll size={16} />} onClick={() => setOpenMacroModal(true)} color='blue'>
                        Create New Macro
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item color='red' rightSection={<Trash size={16} />} onClick={deleteEntry}>
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
                return <div key={index} className='flex flex-col gap-3 p-4 bg-[#1a1a1a] rounded-lg z-10'>
                    <section className='flex items-start justify-between'>
                        <h4 className='text-neutral-500 font-medium'>
                            <span className='text-green'>#{index + 1}</span> SQL Query Run on <b>{project.databaseName}</b>
                        </h4>
                        <Menu width={250} shadow={'md'} position={'bottom-end'} disabled={disabled}>
                            <Menu.Target>
                                <MoreHorizontal size={20} className='transition hover:text-green min-w-[20px] hover:cursor-pointer' />
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Item  rightSection={<SquareKanban size={16} />}>
                                    Change Output Type
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item  color='red' rightSection={<Trash size={16} />}>
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
        <CreateNewMacro
            opened={openMacroModal}
            onClose={() => setOpenMacroModal(false)}
            project={project}
            notebookEntry={entry}
            onCreated={onMacroCreated}
        />
    </div>;
}