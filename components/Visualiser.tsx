/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { Project, ProjectLink, ProjectNode } from '@/lib/global.types';
import generateHexColour from '@/utils/generateColour';
import { Divider } from '@mantine/core';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpaceGraphic from '@/public/space.jpg';
// import ForceGraph2D from 'react-force-graph-2d';

interface VisualiserProps
{
    project: Project;
    projectNodes: ProjectNode[];
    projectLinks: ProjectLink[];
}

export default function Visualiser({ projectNodes, projectLinks }: VisualiserProps) 
{
    const gData = {
        nodes: projectNodes.map(node => ({ id: node.id, })),
        links: projectLinks.map(link => ({ source: link.startingNodeId, target: link.endingNodeId }))
    };

    const [height, setHeight] = useState(0);


    useEffect(() => 
    {
        if (typeof window !== 'undefined')
            setHeight(window.innerHeight - 100);
    }, []);

    return <div className='flex-grow flex flex-col relative'>
        <Image src={SpaceGraphic} fill alt='Space' className='brightness-[25%]' />
        {/* legend that floats on the bottom right corner */}
        <div className='flex flex-col gap-1 absolute top-2 right-2 bg-black bg-opacity-50 p-2 rounded-lg h-[50vh] z-50'>
            <h1 className='text-xl font-bold'>Legend</h1>
            <Divider />
            {
                // create a set of unique dbRelationships from the projectNodes and create their colours 
                // just like we do below with the nodeColour
                Array.from(new Set(projectNodes.map(x => x.dbRelationship))).map(dbRelationship => 
                {
                    return <div key={dbRelationship} className='flex gap-2 items-center'>
                        <div className='w-4 h-4 rounded-full' style={{ backgroundColor: generateHexColour(dbRelationship) }} />
                        <p>{dbRelationship}</p>
                    </div>;
                })
            }
        </div>
        <ForceGraph3D
            graphData={gData}
            linkColor={() => 'white'}
            nodeColor={node => generateHexColour(projectNodes.find(x => x.id === node.id)?.dbRelationship ?? '')}
            nodeLabel={node => `Node: ${node.id}: ${JSON.stringify(projectNodes.find(x => x.id === node.id)?.entityData ?? {})}`}
            backgroundColor='rgba(0, 0, 0, 0)'
            cooldownTicks={100}
            onEngineTick={() => console.log('tick')}
            height={height}
            enableNodeDrag={false}
            dagLevelDistance={100}
        />
        <div className='bottom-5 absolute w-full flex items-center justify-center'>
            <input
                className='rounded-full w-[60vw] p-8 px-16 bg-[#0e0e0e] border-[1px] border-neutral-700 text-xl text-center focus:outline-none'
                type='search'
                placeholder='Search Your Database...'
            />
        </div>
    </div>;
}
