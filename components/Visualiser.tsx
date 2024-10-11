/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
// import * as d3 from 'd3';
import ForceGraph3D from 'react-force-graph-3d';

export default function Visualiser() 
{
    const N = 40;
    const gData = {
        nodes: [...Array(N).keys()].map(i => ({ id: i })),
        links: [...Array(N).keys()]
            .filter(id => id)
            .map(id => ({
                source: id,
                target: Math.round(Math.random() * (id-1)),
            }))
    };

    return (
        <div className='flex flex-col border-[1px] rounded-lg border-neutral-700'>
            <ForceGraph3D
                graphData={gData}
                nodeColor={node => node.id === 0 ? 'gold' : 'red'}
                nodeLabel={node => `Node: ${node.id}`}
                backgroundColor='#1a1a1a'
				
            />
        </div>
    );
}
