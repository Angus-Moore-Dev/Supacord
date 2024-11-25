'use client';

import { NotebookEntry, Project } from '@/lib/global.types';
import getGradientColour from '@/utils/getGradientColour';
import { CodeHighlightTabs } from '@mantine/code-highlight';
import { Divider, Input, Modal, Slider } from '@mantine/core';
import { Code2 } from 'lucide-react';
import { useState } from 'react';
import SmallMacroUI, { LargeMacroUI } from './MacroUIs';
import { v4 } from 'uuid';


interface CreateNewMacroProps
{
    project: Project;
    notebookEntry: NotebookEntry;
    opened: boolean;
    onClose: () => void;
}

export default function CreateNewMacro({ 
    project, 
    notebookEntry,
    opened: o,
    onClose
}: CreateNewMacroProps)
{
    const [title, setTitle] = useState(notebookEntry.userPrompt || ''); // default to user prompt
    const [secondsPolling, setSecondsPolling] = useState(3); // min 3, max 60
    const [minutesPolling, setMinutesPolling] = useState(0); // min 0, max 60
    const [hoursPolling, setHoursPolling] = useState(0); // min 0, max 24
    const [daysPolling, setDaysPolling] = useState(0); // min 0, max 30


    return <Modal opened={o} onClose={onClose} size={'50%'} radius='lg' padding={'lg'} centered lockScroll withCloseButton={false}>
        <div className='flex flex-col gap-5 relative'>
            <h2 className='text-green text-center bg-[#1a1a1a] py-2.5 w-full sticky top-0 z-50'>
                Create New Macro
            </h2>
            <Divider />
            <Input.Wrapper label='Macro Title' required description="Change this if you want something more formal to summarise what data you're tracking">
                <Input
                    size='lg'
                    autoFocus
                    placeholder='Enter a title for your macro'
                    value={title}
                    onChange={(e) => setTitle(e.currentTarget.value)}
                    className='font-bold'
                />
            </Input.Wrapper>
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
            <section className='flex gap-5'>
                <div className='flex flex-col gap-5 flex-1'>
                    {/* Polling Rates Slider */}
                    <div className='flex flex-col gap-1 p-4 bg-[#0e0e0e] rounded-lg'>
                        <p>
                            Seconds
                        </p>
                        <Slider
                            value={secondsPolling}
                            onChange={setSecondsPolling}
                            color={getGradientColour(secondsPolling, 0, 60)}
                            marks={[
                                { value: 0, label: '0s' },
                                { value: 10, label: '10s' },
                                { value: 20, label: '20s' },
                                { value: 30, label: '30s' },
                                { value: 45, label: '45s' },
                                { value: 60, label: '60s' }
                            ]}
                            min={0}
                            max={60}
                            className='mb-6'
                        />
                    </div>
                    <div className='flex flex-col gap-1 p-4 bg-[#0e0e0e] rounded-lg'>
                        <p>
                            Minutes
                        </p>
                        <Slider
                            value={minutesPolling}
                            onChange={setMinutesPolling}
                            color={getGradientColour(minutesPolling, 0, 60)}
                            marks={[
                                { value: 0, label: '0m' },
                                { value: 15, label: '15m' },
                                { value: 30, label: '30m' },
                                { value: 45, label: '45m' },
                                { value: 60, label: '60m' }
                            ]}
                            min={0}
                            max={60}
                            className='mb-6'
                        />
                    </div>
                    <div className='flex flex-col gap-1 p-4 bg-[#0e0e0e] rounded-lg'>
                        <p>
                            Hours
                        </p>
                        <Slider
                            value={hoursPolling}
                            onChange={setHoursPolling}
                            color={getGradientColour(hoursPolling, 0, 24)}
                            marks={[
                                { value: 0, label: '0h' },
                                { value: 6, label: '6h' },
                                { value: 12, label: '12h' },
                                { value: 18, label: '18h' },
                                { value: 24, label: '24h' }
                            ]}
                            min={0}
                            max={24}
                            className='mb-6'
                        />
                    </div>
                    <div className='flex flex-col gap-1 p-4 bg-[#0e0e0e] rounded-lg'>
                        <p>
                            Days
                        </p>
                        <Slider
                            value={daysPolling}
                            onChange={setDaysPolling}
                            color={getGradientColour(daysPolling, 0, 30)}
                            marks={[
                                { value: 0, label: '0d' },
                                { value: 7, label: '7d' },
                                { value: 14, label: '14d' },
                                { value: 21, label: '21d' },
                                { value: 30, label: '30d' }
                            ]}
                            min={0}
                            max={30}
                            className='mb-6'
                        />
                    </div>
                </div>
                <div className='flex flex-col gap-5 bg-[#0e0e0e] p-4 rounded-lg flex-1'>
                    <h3>
                        Preview
                    </h3>
                    <p className='text-medium-500'>
                        The frequency of this macro will be every:
                        <br />
                        <span className='text-green font-bold'>
                            {/* rewrite the below so that it only has commas if there's more itself as an attribute */}
                            {daysPolling > 0 && `${daysPolling} day${daysPolling > 1 ? 's' : ''}${hoursPolling > 0 || minutesPolling > 0 || secondsPolling > 0 ? ', ' : ''}`}
                            {hoursPolling > 0 && `${hoursPolling} hours${minutesPolling > 0 || secondsPolling > 0 ? ', ' : ''}`}
                            {minutesPolling > 0 && `${minutesPolling} minutes${secondsPolling > 0 ? ', ' : ''}`}
                            {secondsPolling > 0 && `${secondsPolling} seconds`}
                        </span>
                        {
                            daysPolling === 0 && hoursPolling === 0 && minutesPolling === 0 && secondsPolling === 0 &&
                            <>
                                <br />
                                <br />
                                <p className='text-red-500'>
                                    This macro will have to be manually invoked by you.
                                </p>
                            </>
                        }
                    </p>
                </div>
            </section>
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
                            chartDetails: notebookEntry.outputs[index].chunks[0].type.includes('chart') ? {
                                xLabel: (JSON.parse(notebookEntry.outputs[index].chunks[0].content) as { xLabel: string, yLabel: string, title: string }).xLabel,
                                yLabel: (JSON.parse(notebookEntry.outputs[index].chunks[0].content) as { xLabel: string, yLabel: string, title: string }).yLabel,
                                title: (JSON.parse(notebookEntry.outputs[index].chunks[0].content) as { xLabel: string, yLabel: string, title: string }).title,
                            } : undefined,
                            outputType: notebookEntry.outputs[index].chunks[0].type, // TODO: Remove Hardcode!!!
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
                            chartDetails: notebookEntry.outputs[index].chunks[0].type.includes('chart') ? {
                                xLabel: (JSON.parse(notebookEntry.outputs[index].chunks[0].content) as { xLabel: string, yLabel: string, title: string }).xLabel,
                                yLabel: (JSON.parse(notebookEntry.outputs[index].chunks[0].content) as { xLabel: string, yLabel: string, title: string }).yLabel,
                                title: (JSON.parse(notebookEntry.outputs[index].chunks[0].content) as { xLabel: string, yLabel: string, title: string }).title,
                            } : undefined,
                            outputType: notebookEntry.outputs[index].chunks[0].type, // TODO: Remove Hardcode!!!
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
        </div>
    </Modal>;
}