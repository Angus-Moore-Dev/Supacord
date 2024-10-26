'use client';
import { useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';


interface GraphProps
{
    gData: {
        links: { source: string, target: string }[],
        nodes: { primaryKey: string, id: string, dbRelationship: string }[],
    }
    width: number;
    height: number;
}

export default function Graph({ gData, width, height }: GraphProps)
{
    const cachedGraphData = useMemo(() => gData, [gData]);

    return <ForceGraph3D
        graphData={cachedGraphData}
        // nodeColor={() => 'white'}
        warmupTicks={100}
        cooldownTicks={100}
        linkColor={() => 'grey'}
        linkWidth={2}
        backgroundColor='black'
        width={width}
        height={height}
        showNavInfo={false}
        nodeAutoColorBy={node => node.dbRelationship}
        nodeLabel={node => node.dbRelationship}
    />;
}