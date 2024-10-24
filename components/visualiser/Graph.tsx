'use client';
import { useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';


interface GraphProps
{
    gData: {
        links: { source: string, target: string }[],
        nodes: { id: string }[],
    }
    width: number;
    height: number;
}

export default function Graph({ gData, width, height }: GraphProps)
{
    const cachedGraphData = useMemo(() => gData, [gData]);

    return <ForceGraph3D
        graphData={cachedGraphData}
        nodeColor={() => 'white'}
        warmupTicks={100}
        cooldownTicks={100}
        linkColor={() => 'green'}
        linkWidth={2}
        backgroundColor='black'
        width={width}
        height={height}
        showNavInfo={false}
    />;
}