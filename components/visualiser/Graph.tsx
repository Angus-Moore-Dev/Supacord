/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });


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
    const graphRef = useRef<any>();
    const cachedGraphData = useMemo(() => 
    {
        if (graphRef.current)
            graphRef.current.refresh();
        return gData;
    }, [gData]);

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
        ref={graphRef}
    />;
}