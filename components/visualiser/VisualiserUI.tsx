'use client';

import { Notebook, NotebookEntry, OutputType, Project } from '@/lib/global.types';
import { Button, Divider, Loader, Menu, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BookOpen, BookPlus, ChevronsLeft, ChevronsRight, HelpCircle, MoreHorizontal, Search, Trash } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { v4 } from 'uuid';
import { createBrowserClient } from '@/utils/supabaseBrowser';
import NotebookEntryUI from './generative_ui/NotebookEntryUI';
import { useRouter } from 'next/navigation';


interface Section {
    type: OutputType;
    content: string;
}

interface VisualiserUIProps
{
    project: Project;
    notebooks: Notebook[];
    preSelectedNotebookId: string;
}

export default function VisualiserUI({ project, notebooks: n, preSelectedNotebookId }: VisualiserUIProps)
{
    const router = useRouter();
    const supabase = createBrowserClient();
    const mainBodyRef = useRef<HTMLDivElement>(null);
    const sideBarRef = useRef<HTMLDivElement>(null);
    const savedMacroRef = useRef<HTMLDivElement>(null);

    const [isLoadingNotebook, setIsLoadingNotebook] = useState(!!preSelectedNotebookId && n.some(x => x.id === preSelectedNotebookId));
    const [isHovering, setIsHovering] = useState(false);
    const [isMacroHovering, setIsMacroHovering] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    const [notebooks, setNotebooks] = useState(n);
    const [selectedNotebookId, setSelectedNotebookId] = useState('');

    const [notebookEntries, setNotebookEntries] = useState<NotebookEntry[]>([]);

    const [isSendingMessage, setIsSendingMessage] = useState(false);


    async function sendMessage()
    {
        if (isSendingMessage)
            return;

        setIsSendingMessage(true);

        let notebookId = selectedNotebookId;

        if (!selectedNotebookId)
        {
            const { data: newNotebook, error } = await supabase
                .from('notebooks')
                .insert({
                    id: v4(),
                    title: 'Untitled Notebook',
                    projectId: project.id,
                })
                .select('*')
                .single();

            if (error)
            {
                console.error('Error creating new notebook:', error.message);
                notifications.show({ title: 'Error', message: 'Failed to create new notebook', color: 'red' });
                setIsSendingMessage(false);
                return;
            }

            setSelectedNotebookId(newNotebook.id);
            notebookId = newNotebook.id;
            setNotebooks(notebooks => [...notebooks, newNotebook]);
        }


        const localNotebookEntries = [...notebookEntries];
        localNotebookEntries.push({
            id: v4(),
            createdAt: new Date().toISOString(),
            notebookId,
            userPrompt: userSearch,
            sqlQueries: [],
            outputs: [],
            sha256Hash: '',
        });

        setNotebookEntries(localNotebookEntries);
        setUserSearch('');

        const response = await fetch(`/app/${project.id}/visualiser-search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                projectId: project.id,
                chatHistory: notebookEntries.slice(-5),
            })
        });

        if (!response.ok)
        {
            console.error('Error sending message:', response.statusText);
            notifications.show({ title: 'Error', message: 'Failed to send message', color: 'red' });
            setIsSendingMessage(false);
            return;
        }

        // get the stream
        const stream = response.body;
        if (!stream)
        {
            notifications.show({ title: 'Error', message: 'Failed to get stream from response', color: 'red' });
            setIsSendingMessage(false);
            return;
        }

        // listen for messages
        let done = false;
        const reader = stream.getReader();

        while (!done)
        {
            const { value, done: isDone } = await reader.read();
            if (isDone)
            {
                done = true;
                break;
            }

            const message = new TextDecoder().decode(value);

            // for notebook entries, we want to get the last one and then add to the latest version output.
            const lastEntry = localNotebookEntries[localNotebookEntries.length - 1];
            if (lastEntry.outputs.length === 0)
                lastEntry.outputs.push({
                    version: 1,
                    chunks: [],
                });

            const latestOutput = lastEntry.outputs[lastEntry.outputs.length - 1];

            // update the latest output with the new content
            // latest output has a version and chunks, which contains its own stuff.
            const section = extractSection(message);
            if (section)
            {
                if (section.type === OutputType.SQL)
                {
                    lastEntry.sqlQueries.push(section.content);
                }
                else
                {
                    latestOutput.chunks.push({
                        content: section?.content || message,
                        type: section.type,
                    });
                }
            }

            // update the notebook entries
            setNotebookEntries(localNotebookEntries);
        }

        reader.releaseLock();
        setIsSendingMessage(false);
    }


    function extractSection(text: string): Section | null
    {
        const allTypes = Object.values(OutputType).map(type => type.toUpperCase());
        for (const type of allTypes)
        {
            const startMarker = `=====${type.toUpperCase()}=====`;
            const endMarker = '=====END ' + type.toUpperCase() + '=====';
        
            const startIndex = text.indexOf(startMarker);
            if (startIndex === -1)
            {
                console.error('No start marker found for:', type);
                continue;
            }
        
            const contentStartIndex = startIndex + startMarker.length;
            const endIndex = text.indexOf(endMarker, contentStartIndex);
            if (endIndex === -1)
            {
                console.error('No end marker found for:', type);
                continue;
            }
            
            console.log('Extracted:', type);
            return {
                type: type as OutputType,
                content: text.substring(contentStartIndex, endIndex).trim()
            };
        }

        return null;
    }


    useEffect(() => 
    {
        // if the URL query param has a notebookId, we want to select that notebook
        if (preSelectedNotebookId)
            setSelectedNotebookId(preSelectedNotebookId);
    }, []);

    useEffect(() => 
    {
        if (selectedNotebookId)
        {
            router.replace(`/app/${project.id}?notebookId=${selectedNotebookId}`, undefined);
            supabase
                .from('notebook_entries')
                .select('*')
                .eq('notebookId', selectedNotebookId)
                .order('createdAt', { ascending: true })
                .then(({ data, error }) => 
                {
                    if (error)
                    {
                        console.error('Error fetching notebook entries:', error.message);
                        notifications.show({ title: 'Error', message: 'Failed to fetch notebook entries', color: 'red' });
                        setIsLoadingNotebook(false);
                        return;
                    }

                    setNotebookEntries(data as NotebookEntry[] || []);

                    // scroll to the bottom of the notebook entries
                    if (mainBodyRef.current)
                        mainBodyRef.current.scrollTop = mainBodyRef.current.scrollHeight;
                    setIsLoadingNotebook(false);
                });
        }
    }, [selectedNotebookId]);


    return <div className="flex-grow flex w-full relative">
        <section
            ref={sideBarRef}
            className={`overflow-x-hidden
                flex flex-col h-[calc(100vh-60px)] max-h-full overflow-y-auto bg-primary border-r-[1px] border-r-neutral-700 px-4 pb-4 transition-all duration-300 relative
                ${isHovering ? 'w-[500px] bg-opacity-75 backdrop-blur-sm' : 'w-[250px]'}`}
        >
            <h4 className='pt-2 line-clamp-2'> 
                {project.databaseName}
            </h4>
            <Divider className='mt-2 mb-4' />
            <Button fullWidth={false} variant='outline' size='xs' rightSection={<BookPlus size={20} />}>
                Start New Notebook
            </Button>
            <div className='mt-3 flex flex-col gap-1'>
                {
                    notebooks.length === 0 && <p className='text-neutral-500 font-medium text-center'>
                        No notebooks exist yet.
                    </p>
                }
                {
                    notebooks.map((notebook, index) => <Button variant={selectedNotebookId === notebook.id ? 'filled' : 'subtle'} key={index} fullWidth onClick={() => setSelectedNotebookId(notebook.id)}>
                        {notebook.title}
                    </Button>)
                }
            </div>
            {/* Make a button that goes halfway down and sits on the right border with chevrons to expand or close */}
            <button className='absolute -right-3 top-[45%] z-auto p-2 w-fit rounded-full' onClick={() => setIsHovering(!isHovering)}>
                {
                    isHovering ? <ChevronsLeft size={24} /> : <ChevronsRight size={24} />
                }
            </button>
        </section>
        <section className='flex-grow max-h-[calc(100vh-60px)] border-x-[1px] border-neutral-700 z-30 relative overflow-x-hidden'>
            <nav className='w-full sticky top-0 bg-primary border-b-[1px] border-neutral-700 p-2 grid grid-cols-10'>
                <div className='col-span-2' />
                <input
                    disabled={isSendingMessage || !selectedNotebookId}
                    value={notebooks.find(x => x.id === selectedNotebookId)?.title !== undefined ? notebooks.find(x => x.id === selectedNotebookId)?.title : 'Untitled Notebook'}
                    onChange={e => 
                    {
                        const newTitle = e.currentTarget.value;
                        setNotebooks(notebooks => notebooks.map(notebook => 
                        {
                            if (notebook.id === selectedNotebookId)
                                return { ...notebook, title: newTitle };
                            return notebook;
                        }));
                    }}
                    onBlur={async () => 
                    {
                        const notebook = notebooks.find(x => x.id === selectedNotebookId);
                        if (!notebook)
                            return;

                        const { error } = await supabase
                            .from('notebooks')
                            .update({ title: notebook.title })
                            .eq('id', selectedNotebookId);

                        if (error)
                        {
                            console.error('Error updating notebook:', error.message);
                            notifications.show({ title: 'Error', message: 'Failed to update notebook', color: 'red' });
                        }
                    }}
                    onKeyDown={async e => 
                    {
                        if (e.key === 'Enter')
                        {
                            e.preventDefault();
                            const notebook = notebooks.find(x => x.id === selectedNotebookId);
                            if (!notebook)
                                return;

                            const { error } = await supabase
                                .from('notebooks')
                                .update({ title: notebook.title })
                                .eq('id', selectedNotebookId);

                            if (error)
                            {
                                console.error('Error updating notebook:', error.message);
                                notifications.show({ title: 'Error', message: 'Failed to update notebook', color: 'red' });
                            }
                        }
                    }}
                    type='text' placeholder='Your Notebook Name' className='col-span-6 focus:outline-none text-center bg-transparent' />
                <div className='col-span-2 flex justify-end'>
                    <Menu shadow='md' width={250} position={'bottom-end'} disabled={!selectedNotebookId}>
                        <Menu.Target>
                            <MoreHorizontal size={24} className='transition hover:text-green hover:cursor-pointer' />
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Label>
                                Notebook Settings
                            </Menu.Label>
                            <Menu.Item color='red'>
                                <div className='flex items-center gap-3 justify-between'>
                                    <b>Delete Notebook</b> <Trash size={24} />
                                </div>
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </div>
            </nav>
            <div ref={mainBodyRef} className='h-full flex-grow flex flex-col max-h-[calc(100vh-60px-42px)] relative'>
                {
                    isLoadingNotebook && <div className='inset-0 absolute bg-primary bg-opacity-75 backdrop-blur-sm z-50 flex flex-col gap-3 items-center justify-center'>
                        <Loader size={64} />
                        <h4>
                            Loading Notebook...
                        </h4>
                    </div>
                }
                <section className='flex-grow overflow-y-auto flex flex-col gap-3 p-4 bg-[#0e0e0e]'>
                    {
                        notebookEntries.length === 0 && <div className='text-center text-neutral-500 font-medium flex-grow flex flex-col gap-3 items-center justify-center h-full'>
                            <BookOpen size={64} className='text-green' />
                            Start a new notebook by entering a search query below.
                            <br />
                            <br />
                            <span className='max-w-xl'>
                                Notebooks are designed to be testing grounds for creating new macros and dynamically querying <b>{project.databaseName}</b>
                            </span>
                        </div>
                    }
                    {
                        notebookEntries.length > 0 &&
                        notebookEntries.map((entry, index) => <NotebookEntryUI key={index} notebookEntry={entry} />)
                    }
                </section>
                <div className='flex flex-row gap-3 bg-[#0e0e0e] p-2 sticky bottom-0'>
                    <Textarea
                        disabled={isSendingMessage}
                        value={userSearch}
                        onChange={(event) => setUserSearch(event.currentTarget.value)}
                        placeholder='What would you like to visualise?'
                        className='w-full'
                        minRows={5}
                        maxRows={15}
                        autoFocus
                        onKeyDown={e => 
                        {
                            if (e.key === 'Enter' && !e.shiftKey)
                            {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                    />
                    <Button onClick={sendMessage} loading={isSendingMessage}>
                        <Search size={24} />
                    </Button>
                </div>
            </div>
        </section>
        <section
            ref={savedMacroRef}
            className={`overflow-x-hidden
                flex flex-col h-[calc(100vh-60px)] overflow-y-auto bg-primary border-l-[1px] border-neutral-700 px-4 pb-4 transition-all duration-300 z-50 relative
                ${isMacroHovering ? 'w-[500px] bg-opacity-75 backdrop-blur-sm' : 'w-[250px]'}`}
        >
            <section className='flex gap-3 items-center justify-between pt-2'>
                <h4 className='line-clamp-2'> 
                    Project Macros
                </h4>
                <HelpCircle size={20} className='text-green hover:text-green-400 transition hover:cursor-pointer' />
            </section>
            <Divider className='mt-2 mb-4' />
            {
                <small className='text-neutral-500 font-medium text-left'>
                    No macros exist yet. Create one by saving it from a notebook.
                </small>
            }
            <button className='absolute -left-3 top-[45%] z-auto p-2 w-fit rounded-full' onClick={() => setIsMacroHovering(!isMacroHovering)}>
                {
                    isMacroHovering ? <ChevronsRight size={24} /> : <ChevronsLeft size={24} />
                }
            </button>
        </section>
    </div>;
}