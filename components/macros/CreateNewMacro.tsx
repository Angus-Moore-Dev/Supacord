'use client';

import { Macro, NotebookEntry, Project } from '@/lib/global.types';
import { CodeHighlightTabs } from '@mantine/code-highlight';
import { Button, Divider, Modal } from '@mantine/core';
import { Code2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import SmallMacroUI, { LargeMacroUI } from './MacroUIs';
import { v4 } from 'uuid';
import PollingSliders from './PollingSliders';
import MacroInput from './MacroInput';
import { createBrowserClient } from '@/utils/supabaseBrowser';
import { notifications } from '@mantine/notifications';


interface CreateNewMacroProps
{
    project: Project;
    notebookEntry: NotebookEntry;
    opened: boolean;
    onClose: () => void;
    onCreated: (macro: Macro) => void;
}

/**
 * A modal component for creating new macros from notebook entries.
 * 
 * This component provides a form interface to:
 * - Set a title for the macro (defaults to the notebook entry's user prompt)
 * - View the SQL queries that will be included in the macro
 * - Configure polling rates (seconds, minutes, hours, days)
 * - Preview how the macro will appear in both large and small formats
 * 
 * @component
 * @param {Object} props
 * @param {Project} props.project - The current project context
 * @param {NotebookEntry} props.notebookEntry - The notebook entry to create a macro from
 * @param {boolean} props.opened - Controls the visibility of the modal
 * @param {() => void} props.onClose - Callback function to handle modal closure
 * 
 * @example
 * ```tsx
 * <CreateNewMacro
 *   project={currentProject}
 *   notebookEntry={selectedEntry}
 *   opened={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onCreated={(macro) => {
 *       // Handle the newly created macro
 *   }}
 * />
 * ```
 */
export default function CreateNewMacro({ 
    project, 
    notebookEntry,
    opened: o,
    onClose,
    onCreated
}: CreateNewMacroProps)
{
    const supabase = createBrowserClient();

    const [title, setTitle] = useState(notebookEntry.userPrompt || ''); // default to user prompt
    const [secondsPolling, setSecondsPolling] = useState(5); // min 5, max 59
    const [minutesPolling, setMinutesPolling] = useState(0); // min 0, max 59
    const [hoursPolling, setHoursPolling] = useState(0); // min 0, max 23
    const [daysPolling, setDaysPolling] = useState(0); // min 0, max 30

    const [isCreating, setIsCreating] = useState(false);


    async function createMacro()
    {
        setIsCreating(true);
        
        const macro: Macro = {
            id: v4(),
            createdAt: new Date().toISOString(),
            isAutonomouslyActive: true, // TODO: Default active but eventually make this a user setting
            pollingRate: {
                seconds: secondsPolling,
                minutes: minutesPolling,
                hours: hoursPolling,
                days: daysPolling
            },
            title,
            profileId: project.profileId,
            projectId: project.id,
            textPrompt: notebookEntry.userPrompt,
            queryData: notebookEntry.sqlQueries.map((query, index) => ({
                sqlQuery: query,
                outputType: notebookEntry.outputs[index].chunks[0].type,
                chartDetails: notebookEntry.outputs[index].chunks[0].type.includes('chart') ? {
                    xLabel: (JSON.parse(notebookEntry.outputs[index].chunks[0].content) as { xLabel: string, yLabel: string, title: string }).xLabel,
                    yLabel: (JSON.parse(notebookEntry.outputs[index].chunks[0].content) as { xLabel: string, yLabel: string, title: string }).yLabel,
                    title: (JSON.parse(notebookEntry.outputs[index].chunks[0].content) as { xLabel: string, yLabel: string, title: string }).title,
                } : undefined,
            })),
        };

        const { data: newMacro, error } = await supabase.from('user_macros').insert(macro).select('*').single();

        if (error)
        {
            console.error(error);
            notifications.show({
                title: 'Error Creating Macro',
                message: 'There was an error creating your macro. Please try again later.',
                color: 'red',
            });
        }
        else
        {
            notifications.show({
                title: 'Macro Created',
                message: 'Your macro has been created successfully.',
                color: 'green',
            });
            onClose();
            onCreated(newMacro as Macro);
        }

        setIsCreating(false);
    }


    useEffect(() => 
    {
        if (o)
        {
            setSecondsPolling(5);
            setMinutesPolling(0);
            setHoursPolling(0);
            setDaysPolling(0);
            setTitle(notebookEntry.userPrompt || '');
        }
    }, [o]);


    return <Modal opened={o} onClose={onClose} size={'50%'} radius='lg' padding={'lg'} centered lockScroll withCloseButton={false}>
        <div className='flex flex-col gap-5 relative'>
            <h2 className='text-green text-center bg-[#1a1a1a] py-2.5 w-full sticky top-0 z-50'>
                Create New Macro
            </h2>
            <Divider />
            <MacroInput
                project={project}
                notebookEntry={notebookEntry}
                title={title}
                setTitle={setTitle}
                disabled={isCreating}
            />
            <Divider />
            <div className='p-4 bg-[#0e0e0e] rounded-lg flex flex-col gap-3'>
                {
                    notebookEntry.sqlQueries.map((query, index) => <div key={index} className='bg-[#1a1a1a] p-4 rounded-lg flex flex-col gap-1 z-30'>
                        <section className='flex gap-3 items-center justify-between'>
                            <p className='text-neutral-500'>
                                <b className='text-green'>#{index + 1}</b> SQL Queries Run On {project.databaseName}
                            </p>
                        </section>
                        <CodeHighlightTabs
                            key={index}
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
                    </div>)
                }
            </div>
            <h2 className='text-green text-center'>
                Polling Rates & Scheduling
            </h2>
            <Divider />
            <PollingSliders
                disabled={isCreating}
                seconds={secondsPolling}
                minutes={minutesPolling}
                hours={hoursPolling}
                days={daysPolling}
                onChange={(seconds, minutes, hours, days) => 
                {
                    setSecondsPolling(seconds);
                    setMinutesPolling(minutes);
                    setHoursPolling(hours);
                    setDaysPolling(days);
                }}
            />
            <h2 className='text-green text-center'>
                Previews
            </h2>
            <Divider />
            <div className='flex flex-col gap-5'>
                <h3 className='text-green text-center'>
                    Large Preview
                </h3>
                <LargeMacroUI
                    macro={{
                        id: v4(),
                        createdAt: new Date().toISOString(),
                        isAutonomouslyActive: false,
                        pollingRate: {
                            seconds: secondsPolling,
                            minutes: minutesPolling,
                            hours: hoursPolling,
                            days: daysPolling
                        },
                        title,
                        profileId: project.profileId,
                        projectId: project.id,
                        textPrompt: notebookEntry.userPrompt,
                        queryData: notebookEntry.sqlQueries.map((query, index) => ({
                            sqlQuery: query,
                            // TODO: HOLY HACKAMOLY
                            chartDetails: notebookEntry.outputs[index]?.chunks[0].type.includes('chart') ? {
                                xLabel: (JSON.parse(notebookEntry.outputs[index].chunks[0].content) as { xLabel: string, yLabel: string, title: string }).xLabel,
                                yLabel: (JSON.parse(notebookEntry.outputs[index].chunks[0].content) as { xLabel: string, yLabel: string, title: string }).yLabel,
                                title: (JSON.parse(notebookEntry.outputs[index].chunks[0].content) as { xLabel: string, yLabel: string, title: string }).title,
                            } : undefined,
                            outputType: notebookEntry.outputs[index]?.chunks[0].type, // TODO: Remove Hardcode!!!
                        })),
                    }}
                    results={{
                        id: v4(),
                        createdAt: new Date().toISOString(),
                        macroId: v4(),
                        sqlQueries: notebookEntry.sqlQueries,
                        outputs: notebookEntry.outputs.map((output) => ({
                            type: output.chunks[0].type, // TODO: Hardcoded, fix this
                            content: output.chunks[0].content // TODO: Hardcoded, fix this
                        }))
                    }}
                    // we'll get the latest results from the notebook entryl
                />
                <h3 className='text-green text-center'>
                    Small Preview
                </h3>
                <SmallMacroUI
                    macro={{
                        id: v4(),
                        createdAt: new Date().toISOString(),
                        isAutonomouslyActive: false,
                        pollingRate: {
                            seconds: secondsPolling,
                            minutes: minutesPolling,
                            hours: hoursPolling,
                            days: daysPolling
                        },
                        title,
                        profileId: project.profileId,
                        projectId: project.id,
                        textPrompt: notebookEntry.userPrompt,
                        queryData: notebookEntry.sqlQueries.map((query, index) => ({
                            sqlQuery: query,
                            // TODO: HOLY HACKAMOLY
                            chartDetails: notebookEntry.outputs[index]?.chunks[0].type.includes('chart') ? {
                                xLabel: (JSON.parse(notebookEntry.outputs[index].chunks[0].content) as { xLabel: string, yLabel: string, title: string }).xLabel,
                                yLabel: (JSON.parse(notebookEntry.outputs[index].chunks[0].content) as { xLabel: string, yLabel: string, title: string }).yLabel,
                                title: (JSON.parse(notebookEntry.outputs[index].chunks[0].content) as { xLabel: string, yLabel: string, title: string }).title,
                            } : undefined,
                            outputType: notebookEntry.outputs[index]?.chunks[0].type, // TODO: Remove Hardcode!!!
                        })),
                    }}
                    results={{
                        id: v4(),
                        createdAt: new Date().toISOString(),
                        macroId: v4(),
                        sqlQueries: notebookEntry.sqlQueries,
                        outputs: notebookEntry.outputs.map((output) => ({
                            type: output.chunks[0].type, // TODO: Hardcoded, fix this
                            content: output.chunks[0].content // TODO: Hardcoded, fix this
                        }))
                    }}
                />
            </div>
            <Divider className='my-5' />
            <Button
                onClick={createMacro}
                loading={isCreating}
                fullWidth
                color='blue'
                size='lg'
            >
                Create New Macro
            </Button>
        </div>
    </Modal>;
}