'use client';
import { BarChart } from '@mantine/charts';

interface BarChartVisualProps
{
    content: {
        xLabel: string;
        yLabel: string;
        title: string;
        data: Record<string, number>[];
    }
}

export default function BarChartVisual({ content }: BarChartVisualProps): JSX.Element
{
    const colours = [
        'blue.6',
        'cyan.6',
        'teal.6',
        'green.6',
        'lime.6',
        'yellow.6',
        'orange.6',
        'red.6',
        'gray.6',
        'indigo.6',
        'pink.6',
        'purple.6',
    ];

    console.log('series::', Object.values(content.data).map((value, index) => ({ name: value[content.xLabel], color: colours[index] })));
    console.log(content);

    return <BarChart
        h={375}
        w={'100%'}
        // the data is formatted as an array of objects, where the variable is the xLabel is the name which corresponds to a distinct x-axis value
        // and the value is the yLabel which corresponds to the y-axis value
        data={content.data}
        dataKey={content.xLabel}
        type='stacked'
        p={0}
        m={0}
        // series is an array of { name: string, color: string } for the legend
        // for instamce, it might be [{ name: 'A', color: 'blue.6' }, { name: 'B', color: 'cyan.6' }]
        // another instance might be [{ name: 'AUTOMATED INFORMATION', color: 'blue.6' }, { name: 'DATABASE FAILURE', color: 'cyan.6' }]
        // series={Object.values(content.data).map((value, index) => ({ name: value[content.xLabel].toString(), color: colours[index] }))}
        series={[
            {
                name: content.yLabel,
                color: 'green.6'
            }
        ]}
        title={content.title || 'Bar Chart'}
        xAxisLabel={content.xLabel}
        tickLine="xy"
        gridAxis="xy"
    />;
}