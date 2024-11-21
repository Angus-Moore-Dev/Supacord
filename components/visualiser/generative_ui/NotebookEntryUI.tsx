'use client';

import { NotebookEntry, OutputType, Project } from '@/lib/global.types';
import { Divider, Loader, Alert, Menu } from '@mantine/core';
import { User2, Pencil, SaveAll, MoreHorizontal, Trash, FilePenLine, SquareKanban } from 'lucide-react';
import { BarChartVisual, PieChartVisual, LineChartVisual } from './ChartVisuals';
import { TableVisual } from './TableVisual';
import Editor from '@monaco-editor/react';


interface NotebookEntryUIProps
{
    project: Project;
    notebookEntry: NotebookEntry;
}

export default function NotebookEntryUI({ project, notebookEntry: entry }: NotebookEntryUIProps)
{


    return <div className={'bg-[#2a2a2a] p-4 px-8 rounded-md mb-2 whitespace-pre-line flex flex-col gap-3'}>
        <div className='flex gap-2 items-start'>
            <User2 size={32} className='text-transparent fill-green min-w-[32px]' />
            <h3 className='font-bold text-green'>
                {entry.userPrompt}
            </h3>
            <Menu width={250} shadow={'md'} position={'bottom-end'}>
                <Menu.Target>
                    <MoreHorizontal size={20} className='transition hover:text-green min-w-[20px] hover:cursor-pointer' />
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item color='blue' className='font-bold' rightSection={<SaveAll size={16} />}>
                        Save As New Macro
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item rightSection={<Pencil size={16} />}>
                        Edit User Prompt
                    </Menu.Item>
                    <Menu.Item rightSection={<FilePenLine size={16} />}>
                        Edit SQL Query
                    </Menu.Item>
                    <Menu.Item rightSection={<SquareKanban size={16} />}>
                        Change Output Type
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
                return <div key={index} className='flex flex-col gap-3'>
                    <section className='flex items-end justify-between'>
                        <h4 className='text-neutral-500 font-medium'>
                            SQL Query Run on <b>{project.databaseName}</b>
                        </h4>
                    </section>
                    <Editor
                        defaultLanguage='sql'
                        height={150}
                        theme="vs-dark"
                        value={query}
                        options={{ 
                            readOnly: true,
                            wordWrap: 'on'
                        }}
                    />
                </div>;
            })
        }
        {
            entry.outputs.map((output, index) =>
            {
                return <div key={index} className='flex flex-col gap-5'>
                    {
                        output.chunks.map((chunk, index) =>
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
                </div>;
            })
        }
    </div>;
}