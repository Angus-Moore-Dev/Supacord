'use client';

import { Project } from '@/lib/global.types';
import { Button, Tabs, Textarea } from '@mantine/core';
import { Plus, Search } from 'lucide-react';
import { useRef, useState } from 'react';

interface VisualiserUIProps
{
    project: Project;
}

export default function VisualiserUI({ project }: VisualiserUIProps)
{
    console.log(project.id);
    const sideBarRef = useRef<HTMLDivElement>(null);

    const [isHovering, setIsHovering] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [messages, setMessages] = useState<string[]>([]);


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
                    Previous Conversation that goes on forever and forever and forever and ever and ever and ever.
                </h4>
            </div>
        </section>
        <section className='flex-grow max-w-[calc(100vw-250px)] ml-[250px] border-l-[1px] border-neutral-700'>
            <Tabs defaultValue={'Visualisation'} className='h-[calc(100vh-50px-46px)]'>
                <Tabs.List className='bg-[#0e0e0e]'>
                    <Tabs.Tab value='Visualisation'>
                        Visualisation
                    </Tabs.Tab>
                    <Tabs.Tab value='Relationships'>
                        Relationships
                    </Tabs.Tab>
                    <Tabs.Tab value='Preferences'>
                        Preferences
                    </Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value='Visualisation' className='flex-grow h-full'>
                    <div className='h-full flex-grow flex flex-col'>
                        <section className='flex-grow h-full overflow-y-auto max-h-full p-4'>
                            {
                                messages.map((message, index) => <div key={index} className='bg-[#2a2a2a] p-4 px-8 rounded-md mb-2'>
                                    {message}
                                </div>)
                            }
                        </section>
                        <div className='flex flex-row gap-3 bg-[#0e0e0e] p-2 sticky bottom-0'>
                            <Textarea
                                value={userSearch}
                                onChange={(event) => setUserSearch(event.currentTarget.value)}
                                placeholder='What do you want to visualise?'
                                className='w-full'
                                minRows={5}
                                maxRows={20}
                                resize='vertical'
                                onKeyDown={e => 
                                {
                                    if (e.key === 'Enter')
                                    {
                                        setMessages([...messages, userSearch]);
                                        setUserSearch('');
                                    }
                                }}
                            />
                            <Button onClick={() => 
                            {
                                setMessages([...messages, userSearch]);
                                setUserSearch('');
                            }}>
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
    </div>;
}