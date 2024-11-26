'use client';

import { Tabs } from '@mantine/core';

interface AnalyticsContainerProps
{
    projects: { id: string, databaseName: string }[];
}

export default function AnalyticsContainer({ projects }: AnalyticsContainerProps)
{
    return <section className='flex-grow flex flex-col' defaultValue={projects[0].id ?? ''}>
        <Tabs orientation='vertical' variant='pills' className='h-full flex-grow'>
            <Tabs.List className='bg-[#0e0e0e]'>
                {
                    projects.map((project) => <Tabs.Tab key={project.id} value={project.id}>{project.databaseName}</Tabs.Tab>)
                }
            </Tabs.List>
        </Tabs>
    </section>;
}