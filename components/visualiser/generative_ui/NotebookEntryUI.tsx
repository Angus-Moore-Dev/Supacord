'use client';

import { Macro, NotebookEntry, OutputType, Profile, Project } from '@/lib/global.types';
import { Divider, Loader, Alert, Menu } from '@mantine/core';
import { CodeHighlightTabs } from '@mantine/code-highlight';
import { User2, Pencil, SaveAll, MoreHorizontal, Trash, SquareKanban, Code2 } from 'lucide-react';
import { BarChartVisual, PieChartVisual, LineChartVisual } from './ChartVisuals';
import { TableVisual } from './TableVisual';
import { useState } from 'react';
import Image from 'next/image';
import CreateNewMacro from '@/components/macros/CreateNewMacro';


interface NotebookEntryUIProps
{
    profile: Profile;
    disabled: boolean;
    project: Project;
    notebookEntry: NotebookEntry;
    onMacroSaving: (macro: Macro) => void;
}

export default function NotebookEntryUI({
    profile,
    disabled,
    project, 
    notebookEntry: entry,
    // onMacroSaving
}: NotebookEntryUIProps)
{
    const [openMacroModal, setOpenMacroModal] = useState(false);

    return <div className={'bg-[#2a2a2a] p-4 px-8 rounded-md mb-2 whitespace-pre-line flex flex-col gap-5 relative'}>
        <div className='flex gap-2 items-start sticky top-0 z-50 bg-[#2a2a2a] p-4 px-8 rounded-lg'>
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
                    <Menu.Item rightSection={<Pencil size={16} />}>
                        Edit User Prompt
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item color='red' rightSection={<Trash size={16} />}>
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
        />
    </div>;
}