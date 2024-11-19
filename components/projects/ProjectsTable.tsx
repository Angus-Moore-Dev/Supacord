'use client';

import { Project } from '@/lib/global.types';
import { TZDate } from '@date-fns/tz';
import { Button, Table } from '@mantine/core';
import { ExternalLink, Trash } from 'lucide-react';
import Link from 'next/link';


interface ProjectsTableProps
{
    projects: Project[];
}

export default function ProjectsTable({ projects }: ProjectsTableProps)
{
    return <Table withColumnBorders withTableBorder withRowBorders stickyHeader striped>
        <Table.Thead bg={'green'} className='font-semibold text-lg'>
            <Table.Tr>
                <Table.Td>
                    Database Name
                </Table.Td>
                <Table.Td>
                    Organisation ID
                </Table.Td>
                <Table.Td>
                    Project ID
                </Table.Td>
                <Table.Td>
                    Created On
                </Table.Td>
                <Table.Td>
                    Actions
                </Table.Td>
            </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
            {
                projects.map(project => <Table.Tr key={project.id}>
                    <Table.Td className='font-bold'>
                        {project.databaseName}
                    </Table.Td>
                    <Table.Td>
                        {project.organisationId}
                    </Table.Td>
                    <Table.Td>
                        {project.projectId}
                    </Table.Td>
                    <Table.Td>
                        {new TZDate(project.createdAt, undefined).toLocaleDateString()}
                    </Table.Td>
                    <Table.Td align='right' className='flex gap-3 justify-end'>
                        <Link href={`https://supabase.com/dashboard/project/${project.projectId}`} target='_blank'>
                            <Button size='xs' rightSection={<ExternalLink size={20} />} variant='outline'>
                                View On Supabase
                            </Button>
                        </Link>
                        <Link href={`/app/${project.id}`}>
                            <Button size='xs'>
                                Go To Project &rarr;
                            </Button>
                        </Link>
                        <Button size='xs' color='red' rightSection={<Trash size={20} />}>
                            Delete
                        </Button>
                    </Table.Td>
                </Table.Tr>)
            }
        </Table.Tbody>
    </Table>;
}