'use client';

import { OutputType, Project } from '@/lib/global.types';
import { Button, Code, Divider, Loader, Tabs, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Database, Plus, Search, User2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { TableVisual } from './generative_ui/TableVisual';
import LineChartVisual, { BarChartVisual, PieChartVisual } from './generative_ui/ChartVisuals';


interface Section {
    type: OutputType;
    content: string;
}

interface VisualiserUIProps
{
    project: Project;
}

export default function VisualiserUI({ project }: VisualiserUIProps)
{
    const sideBarRef = useRef<HTMLDivElement>(null);
    const savedMacroRef = useRef<HTMLDivElement>(null);

    const [isHovering, setIsHovering] = useState(false);
    const [isMacroHovering, setIsMacroHovering] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    // TODO: rewrite this over to a notebookentry list.
    const [messages, setMessages] = useState<{
        type: 'ai' | 'user';
        content: string;
        chunks: string[]
    }[]>([]);

    const [isSendingMessage, setIsSendingMessage] = useState(false);


    async function sendMessage()
    {
        if (isSendingMessage)
            return;

        setIsSendingMessage(true);

        const localMessages = messages;
        setMessages([...localMessages, {
            type: 'user',
            content: userSearch,
            chunks: []
        }]);
        setUserSearch('');
        localMessages.push({
            type: 'user',
            content: userSearch,
            chunks: []
        });


        const response = await fetch(`/app/${project.id}/visualiser-search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                projectId: project.id,
                // the last 5 messages
                chatHistory: localMessages.slice(-5),
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

            if (messages.length === 0)
            {
                const message = new TextDecoder().decode(value);
                console.log('New message:', message);
                localMessages.push({
                    type: 'ai',
                    content: message,
                    chunks: [message]
                });
                setMessages(localMessages);
                continue;
            }

            const message = new TextDecoder().decode(value);
            if (messages[messages.length - 1].type === 'ai')
            {
                console.log('New message:', message);
                localMessages[localMessages.length - 1].content += message;
                localMessages[localMessages.length - 1].chunks.push(message);
                setMessages(localMessages);
            }
            else
            {
                console.log('New message:', message);
                localMessages.push({
                    type: 'ai',
                    content: message,
                    chunks: [message]
                });
                setMessages(localMessages);
            }
        }

        reader.releaseLock();
        setIsSendingMessage(false);
    }
    
    const extractSection = (text: string): Section | null => 
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
    };

    return <div className="flex-grow flex w-full relative">
        <section
            ref={sideBarRef}
            className={`
                flex flex-col h-full max-h-full overflow-y-auto bg-[#0e0e0e] border-r-[1px] border-r-neutral-700 p-4 py-8 transition-all duration-300 z-50 absolute
                ${isHovering ? 'w-[500px] bg-opacity-75 backdrop-blur-sm' : 'w-[250px]'}`}
            onMouseOver={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <Button fullWidth={false} className='max-w-fit' variant='outline' size='xs' rightSection={<Plus size={16} />}>
                Start New Session
            </Button>
            <div className='mt-3 flex flex-col gap-1'>
                <h4 className='line-clamp-1'>
                    Notebooks go here
                </h4>
            </div>
        </section>
        <section className='flex-grow max-w-[calc(100vw-500px)] ml-[250px] border-x-[1px] border-neutral-700'>
            <Tabs defaultValue={'Visualisation'} variant='pills' className='h-[calc(100vh-50px-46px)]'>
                <Tabs.List className='bg-[#0e0e0e]' grow>
                    <Tabs.Tab value='Visualisation'>
                        Visualisation & Queries
                    </Tabs.Tab>
                    <Tabs.Tab value='Relationships'>
                        Relationships Explorer
                    </Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value='Visualisation' className='flex-grow h-full'>
                    <div className='h-full flex-grow flex flex-col'>
                        <section className='flex-grow h-full overflow-y-auto max-h-full flex flex-col gap-3 p-4'>
                            {
                                messages.length === 0 && <div className='text-center text-neutral-500 font-medium flex-grow flex flex-col gap-3 items-center justify-center h-full'>
                                    <Database size={64} />
                                    Start a new notebook by entering a search query below.
                                </div>
                            }
                            {
                                messages.map((message, index) => <div key={index} className={'bg-[#2a2a2a] p-4 px-8 rounded-md mb-2 whitespace-pre-line flex flex-col gap-3'}>
                                    {
                                        message.type === 'user' &&
                                        <div className='flex gap-2 items-start'>
                                            <User2 size={32} className='text-transparent fill-green-500' />
                                            <h3 className='font-bold text-green-500'>
                                                {message.content}
                                            </h3>
                                        </div>
                                    }
                                    <Divider />
                                    {
                                        // if the latest message is a user, we temporarily mimic a fake message with just a loader
                                        messages.length > 0 && messages[messages.length - 1].type === 'user' &&
                                        <div className='bg-[#2a2a2a] p-4 px-8 rounded-md mb-2 whitespace-pre-line flex flex-col gap-3'>
                                            <Loader size={32} />
                                            <h4>
                                                Loading response...
                                            </h4>
                                        </div>
                                    }
                                    {
                                        message.type === 'user' && messages[index + 1] && messages[index + 1].type === 'ai' &&
                                        messages[index + 1].chunks.map((chunk, index) => 
                                        {
                                            const section = extractSection(chunk);
                                            if (!section)
                                                return <p key={index} className='text-neutral-500 font-medium'>
                                                    {chunk}
                                                </p>;
    
                                            switch (section.type.toLowerCase())
                                            {
                                            case OutputType.SQL:
                                                return <div key={index} className='flex flex-col gap-1'>
                                                    <h4 className='text-neutral-500 font-medium'>
                                                        SQL Query Run on Database
                                                    </h4>
                                                    <Code lang='sql'>
                                                        {section.content}
                                                    </Code>
                                                </div>;
                                            case OutputType.Text:
                                                return <p key={index} className='font-medium whitespace-pre-wrap'>
                                                    {section.content}
                                                </p>;
                                            case OutputType.Table:
                                                return <TableVisual key={index} data={JSON.parse(section.content)} />;
                                            case OutputType.BarChart:
                                                return <BarChartVisual
                                                    key={index}
                                                    content={JSON.parse(section.content)}
                                                />;
                                            case OutputType.LineChart:
                                                return <LineChartVisual
                                                    key={index}
                                                    content={JSON.parse(section.content)}
                                                />;
                                            case OutputType.PieChart:
                                                return <PieChartVisual
                                                    key={index}
                                                    content={JSON.parse(section.content)}
                                                />;
                                            default:
                                                return `TO BE ADDED: ${section.type}`;
                                            }
                                        })
                                    }
                                </div>)
                            }
                        </section>
                        <div className='flex flex-row gap-3 bg-[#0e0e0e] p-2 sticky bottom-0'>
                            <Textarea
                                disabled={isSendingMessage}
                                value={userSearch}
                                onChange={(event) => setUserSearch(event.currentTarget.value)}
                                placeholder='What do you want to visualise?'
                                className='w-full'
                                minRows={5}
                                maxRows={20}
                                resize='vertical'
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
                </Tabs.Panel>
                <Tabs.Panel value='Relationships'className='flex-grow h-full'>
                    <div className='h-full flex-grow flex flex-col'>
                        <section className='flex-grow h-full overflow-y-auto max-h-full'>
                            Relationships Section
                        </section>
                    </div>
                </Tabs.Panel>
                <Tabs.Panel value='Preferences'>
                    Preferences Panel
                </Tabs.Panel>
            </Tabs>
        </section>
        <section
            ref={savedMacroRef}
            className={`
                flex flex-col h-full max-h-full overflow-y-auto bg-[#0e0e0e] border-l-[1px] border-neutral-700 p-4 py-8 transition-all duration-300 z-50 absolute right-0
                ${isMacroHovering ? 'w-[500px] bg-opacity-75 backdrop-blur-sm' : 'w-[250px]'}`}
            onMouseOver={() => setIsMacroHovering(true)}
            onMouseLeave={() => setIsMacroHovering(false)}
        >
            <div className='mt-3 flex flex-col gap-1'>
                <h4 className='line-clamp-1'>
                    Saved Macros go here
                </h4>
            </div>
        </section>
    </div>;
}