'use client';

import { Button, Select, Skeleton } from '@mantine/core';
import { useEffect, useState } from 'react';
import ConnectWithSupabase from '../ConnectWithSupabase';
import { Plus } from 'lucide-react';
import { notifications } from '@mantine/notifications';


export default function NewProjectImport()
{
    const [isLoading, setIsLoading] = useState(true);

    const [organisations, setOrganisations] = useState<{ id: string, name: string }[]>([]);
    const [projects, setProjects] = useState<{ id: string, organisationId: string, name: string }[]>([]);

    const [selectedOrganisation, setSelectedOrganisation] = useState<string>('');
    const [selectedProject, setSelectedProject] = useState<string>('');
    
    const [isCreating, setIsCreating] = useState(false);


    async function commenceVisualising()
    {
        setIsCreating(true);
        const response = await fetch('/supabase/database/transformer', {
            method: 'POST',
            body: JSON.stringify({
                organisationId: selectedOrganisation,
                projectId: selectedProject,
                organisationName: organisations.find(org => org.id === selectedOrganisation)!.name,
                projectName: projects.find(project => project.id === selectedProject)!.name,
            })
        });
        if (response.ok)
        {
            const { id } = await response.json();
            window.location.href = `/app/${id}`;
        }
        else
        {
            notifications.show({ title: 'Error', message: 'An error occurred while creating the project', color: 'red' });
            console.error(await response.json());
            return;
        }
        setIsCreating(false);
    }


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
            console.log(projectsForOrganisation);
        }
    }, [selectedOrganisation]);


    return <div className="flex flex-col gap-5">
        <section className='flex gap-5 items-center justify-between'>
            <h1>
                Begin Visualising A New Project
            </h1>
        </section>
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
                        disabled={isCreating}
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
                    disabled={!selectedOrganisation || isCreating}
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
        <Button variant='white' disabled={!selectedOrganisation || !selectedProject} rightSection={<Plus />}
            loading={isCreating}
            fullWidth={false}
            className='max-w-fit'
            onClick={commenceVisualising}
        >
            Commence Visualising
        </Button>
    </div>;
}