'use client';

import { Button, Tabs } from '@mantine/core';
import LargeMacroUILoader from '../macros/MacroUILoaders';
import { useState } from 'react';

interface AnalyticsContainerProps
{
    projects: { id: string, databaseName: string }[];
}

export default function AnalyticsContainer({ projects }: AnalyticsContainerProps)
{
    const [selectedProject, setSelectedProject] = useState(projects[0].id ?? '');

    return <section className='flex-grow flex bg-neutral-900' defaultValue={projects[0].id ?? ''}>
        <div className='flex-grow flex flex-col gap-1 max-w-[300px] bg-[#0e0e0e] border-r-[1px] border-neutral-700'>
            <div className={'w-full p-2 rounded-md bg-[#0e0e0e]'}>
                {
                    projects.map(project => <button
                        key={project.id}
                        className={`w-full p-2 rounded-md transition ${selectedProject === project.id ? 'bg-darker-green' : 'hover:bg-[#1a1a1a]'}`}
                        onClick={() => setSelectedProject(project.id)}
                    >
                        <p className='text-sm font-medium'>{project.databaseName}</p>
                    </button>)
                }
            </div>
        </div>
        <div className='flex-grow grid grid-cols-2 gap-3 max-h-[calc(100vh-60px)] overflow-y-auto'>
            {/* <LargeMacroUILoader />
            <LargeMacroUILoader />
            <LargeMacroUILoader />
            <LargeMacroUILoader /> */}
        </div>
        {/* <Tabs orientation='vertical' variant='pills' className='h-full flex-grow overflow-y-auto'>
            <Tabs.List className='bg-[#0e0e0e] max-h-[calc(100vh-60px)]'>
                {
                    projects.map((project) => <Tabs.Tab key={project.id} value={project.id}>{project.databaseName}</Tabs.Tab>)
                }
            </Tabs.List>
            {
                projects.map((project) => <Tabs.Panel key={project.id} value={project.id} className='p-4 max-h-[calc(100vh-120px)] overflow-y-auto'>
                    <section className='grid grid-cols-2 gap-3'>
                        <LargeMacroUILoader />
                        <LargeMacroUILoader />
                        <LargeMacroUILoader />
                        <LargeMacroUILoader />
                    </section>
                </Tabs.Panel>)
            }
        </Tabs> */}
    </section>;
}