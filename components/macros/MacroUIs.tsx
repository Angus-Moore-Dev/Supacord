'use client';

import { Macro, MacroInvocationResults, OutputType } from '@/lib/global.types';
import { Alert, Tabs } from '@mantine/core';
import { BarChartVisual, LineChartVisual, PieChartVisual } from '../visualiser/generative_ui/ChartVisuals';
import { TableVisual } from '../visualiser/generative_ui/TableVisual';

interface LargeMacroUIProps
{
    macro: Macro;
    results: MacroInvocationResults;
}

export function LargeMacroUI({ 
    macro,
    results
}: LargeMacroUIProps)
{
    return <div className='flex flex-col gap-5 p-4 bg-[#0e0e0e] rounded-lg'>
        <section className='flex items-start justify-between gap-3'>
            <h3 className='text-green text-center font-semibold'>
                {macro.title}
            </h3>
        </section>
        {
            results.outputs.map((output, index) => 
            {
                switch (output.type)
                {
                case OutputType.Text:
                    return <p key={index} className='font-medium whitespace-pre-wrap'>
                        {output.content}
                    </p>;
                case OutputType.Table:
                    return <TableVisual key={index} data={JSON.parse(output.content)} />;
                case OutputType.BarChart:
                    return <BarChartVisual
                        key={index}
                        content={JSON.parse(output.content)}
                    />;
                case OutputType.LineChart:
                    return <LineChartVisual
                        key={index}
                        content={JSON.parse(output.content)}
                    />;
                case OutputType.PieChart:
                    return <PieChartVisual
                        key={index}
                        content={JSON.parse(output.content)}
                    />;
                case OutputType.Error:
                    return <Alert key={index} color='red' variant='filled'>
                        {output.content}
                    </Alert>;
                }
            }
            )
        }
    </div>;
}


export default function SmallMacroUI({
    macro,
    results
}: LargeMacroUIProps)
{
    return <div className='flex flex-col gap-3 p-4 bg-[#0e0e0e] rounded-lg'>
        <section className='flex items-start justify-between gap-3'>
            <h4 className='font-medium text-green'>
                {macro.title}
            </h4>
        </section>
        <Tabs defaultValue={'0'} variant='pills'>
            <Tabs.List grow>
                {
                    results.sqlQueries.map((query, index) => 
                    {
                        const output = results.outputs[index];

                        return <Tabs.Tab key={index} value={`${index}`}>
                            <b>{index + 1}</b> | <span className='capitalize'>{output.type}</span>
                        </Tabs.Tab>;
                    })
                }
            </Tabs.List>
            {
                results.outputs.map((output, index) =>
                {
                    switch (output.type)
                    {
                    case OutputType.Text:
                        return <Tabs.Panel key={index} value={`${index}`}>
                            <p className='font-medium whitespace-pre-wrap'>
                                {output.content}
                            </p>
                        </Tabs.Panel>;
                    case OutputType.Table:
                        return <Tabs.Panel key={index} value={`${index}`}>
                            <TableVisual data={JSON.parse(output.content)} />
                        </Tabs.Panel>;
                    case OutputType.BarChart:
                        return <Tabs.Panel key={index} value={`${index}`}>
                            <BarChartVisual content={JSON.parse(output.content)} />
                        </Tabs.Panel>;
                    case OutputType.LineChart:
                        return <Tabs.Panel key={index} value={`${index}`}>
                            <LineChartVisual content={JSON.parse(output.content)} />
                        </Tabs.Panel>;
                    case OutputType.PieChart:
                        return <Tabs.Panel key={index} value={`${index}`}>
                            <PieChartVisual content={JSON.parse(output.content)} />
                        </Tabs.Panel>;
                    case OutputType.Error:
                        return <Tabs.Panel key={index} value={`${index}`}>
                            <Alert color='red' variant='filled'>
                                {output.content}
                            </Alert>
                        </Tabs.Panel>;
                    }
                })
            }
        </Tabs>
    </div>;
}