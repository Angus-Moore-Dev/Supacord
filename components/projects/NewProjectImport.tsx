'use client';

import { Select, Skeleton } from '@mantine/core';
import { useEffect, useState } from 'react';
import ConnectWithSupabase from '../ConnectWithSupabase';


export default function NewProjectImport()
{
    const [isLoading, setIsLoading] = useState(true);

    const [organisations, setOrganisations] = useState<{ id: string, name: string }[]>([]);
    const [projects, setProjects] = useState<{ id: string, organisationId: string, name: string }[]>([]);

    const [selectedOrganisation, setSelectedOrganisation] = useState<string>('');
    const [selectedProject, setSelectedProject] = useState<string>('');


    useEffect(() => 
    {
        fetch('/supabase/projects')
            .then(res => res.json())
            .then((data: {
            organisationId: string;
            name: string;
            projects: {
                id: string;
                name: string;
            }[]
        }[]) => 
            {
                setOrganisations(data.map(org => ({ id: org.organisationId, name: org.name })));
                setProjects(data.flatMap(org => org.projects.map(project => ({ ...project, organisationId: org.organisationId }))));
                setIsLoading(false);
            });
    }, []);


    useEffect(() => 
    {
        if (selectedOrganisation)
        {
            // if there's only 1 project for this database, select it.
            const projectsForOrganisation = projects.filter(project => project.organisationId === selectedOrganisation);
            if (projectsForOrganisation.length === 1)
                setSelectedProject(projectsForOrganisation[0].id);
            else
            {
                setSelectedProject('');
            }
        }
    }, [selectedOrganisation]);


    return <div className="flex flex-col gap-5">
        <h1>
            Import A New Project
        </h1>
        {
            isLoading && <>
                <Skeleton w={300} h={65} />
                <Skeleton w={300} h={65} />
            </>
        }
        {
            !isLoading && <>
                <div className='flex flex-row gap-5 items-start'>
                    <Select
                        value={selectedOrganisation}
                        data={organisations.map(org => ({ value: org.id, label: org.name }))}
                        onOptionSubmit={setSelectedOrganisation}
                        size='md'
                        label='Select Organisation'
                        placeholder='Select Organisation'
                        className='max-w-[300px]'
                    />
                    <div className='flex flex-col'>
                        <span className='text-[15px] font-medium'>
                            Add New Organisation
                        </span>
                        <ConnectWithSupabase />
                    </div>
                </div>
                <Select
                    disabled={!selectedOrganisation}
                    value={selectedProject}
                    data={[
                        { value: '', label: 'Select Project', disabled: projects.filter(x => x.organisationId === selectedOrganisation).length === 1 },
                        ...projects.filter(project => project.organisationId === selectedOrganisation).map(project => ({ value: project.id, label: project.name }))
                    ]}
                    onOptionSubmit={setSelectedProject}
                    size='md'
                    label='Select Project'
                    placeholder='Select Project'
                    className='max-w-[300px]'
                />
            </>
        }
    </div>;
}