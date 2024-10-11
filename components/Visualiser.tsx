/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import ForceGraph3D from 'react-force-graph-3d';

export default function Visualiser({ width }: { width?: number }) 
{

    const N = 1500;
    const gData = {
        nodes: [...Array(N).keys()].map(i => ({ id: i })),
        links: [...Array(N).keys()]
            .filter(id => id)
            .map(id => ({
                source: id,
                target: Math.round(Math.random() * (id-1)),
            }))
    };

    return <ForceGraph3D
        graphData={gData}
        nodeColor={node => node.id === 0 ? 'gold' : 'red'}
        nodeLabel={node => `Node: ${node.id}`}
        backgroundColor='#1a1a1a'
        cooldownTicks={100}
        warmupTicks={0}
        width={width}
    />;
}
