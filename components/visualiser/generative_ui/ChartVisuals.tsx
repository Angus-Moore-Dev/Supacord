'use client';
import { 
    BarChart, 
    LineChart,
    PieChart,
} from '@mantine/charts';

interface ChartingVisualProps
{
    content: {
        xLabel: string;
        yLabel: string;
        title: string;
        data: Record<string, number>[];
    }
}

export function BarChartVisual({ content }: ChartingVisualProps): JSX.Element
{
    return <BarChart
        h={375}
        w={'100%'}
        data={content.data}
        dataKey={content.xLabel}
        type='stacked'
        p={0}
        m={0}
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

export default function LineChartVisual({ content }: ChartingVisualProps): JSX.Element
{
    return <LineChart
        h={375}
        w={'100%'}
        data={content.data}
        dataKey={content.xLabel}
        series={[
            {
                name: content.yLabel,
                color: 'green.6'
            }
        ]}
        title={content.title || 'Line Chart'}
        xAxisLabel={content.xLabel}
        tickLine="xy"
        gridAxis="xy"
        curveType='bump'
        strokeWidth={5}
    />;
}

export function PieChartVisual({ content }: ChartingVisualProps): JSX.Element
{
    const colors = [
        'green.6',
        'blue.6',
        'red.6',
        'yellow.6',
        'purple.6',
        'cyan.6',
        'teal.6',
        'lime.6',
        'orange.6',
    ];

    return <PieChart
        h={375}
        size={300}
        w={'100%'}
        withLabelsLine labelsPosition="outside" labelsType={'value'} withLabels
        withTooltip
        // data must be sent in as name, value and color
        data={content.data.map((item) => 
            ({ 
                name: item[content.xLabel].toString(), 
                value: item[content.yLabel], 
                // the colour should be moving down the index, returning back based on modulo
                color: colors[item[content.xLabel].toString().charCodeAt(0) % colors.length]
            })
        )}
        title={content.title || 'Pie Chart'}
    />;
}