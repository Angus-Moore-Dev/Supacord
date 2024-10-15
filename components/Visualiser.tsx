/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { Project, ProjectLink, ProjectNode } from '@/lib/global.types';
import generateHexColour from '@/utils/generateColour';
import { Button, Divider } from '@mantine/core';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import SpaceGraphic from '@/public/space.jpg';
import ForceGraph3D from 'react-force-graph-3d';
import { Search } from 'lucide-react';
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
    const [width, setWidth] = useState(0);

    const [showSidebar, setShowSidebar] = useState(false);


    useEffect(() => 
    {
        if (typeof window !== 'undefined')
        {
            setHeight(window.innerHeight - 100);
            setWidth(window.innerWidth);
        }

        // on height or widht change, update the height and width.
        window.addEventListener('resize', () => 
        {
            setHeight(window.innerHeight);
            setWidth(window.innerWidth);
        });

        return () => 
        {
            window.removeEventListener('resize', () => 
            {
                setHeight(window.innerHeight);
                setWidth(window.innerWidth);
            });
        };
    }, []);

    return <div className='flex-grow flex flex-col relative'>
        <Image src={SpaceGraphic} fill alt='Space' className='brightness-[25%]' />
        {/* legend that floats on the bottom right corner */}
        <AnimatedSidebar />
        {/* <div className='flex flex-col gap-1 absolute top-2 right-2 bg-black bg-opacity-50 p-2 rounded-lg h-[50vh] z-50'>
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
        </div> */}
        {/* <ForceGraph3D
            graphData={gData}
            linkColor={() => 'white'}
            nodeColor={node => generateHexColour(projectNodes.find(x => x.id === node.id)?.dbRelationship ?? '')}
            nodeLabel={node => `Node: ${node.id}: ${JSON.stringify(projectNodes.find(x => x.id === node.id)?.entityData ?? {})}`}
            backgroundColor='rgba(0, 0, 0, 0)'
            cooldownTicks={100}
            onEngineTick={() => console.log('tick')}
            height={height}
            width={width}
            enableNodeDrag={false}
            dagLevelDistance={100}
            nodeVal={node => 
            {
                // based on the links, find out how many links are connected to this node
                const links = projectLinks.filter(link => link.startingNodeId === node.id || link.endingNodeId === node.id);
                return links.length;
            }}
        /> */}
        <div className='bottom-5 absolute w-full flex items-center justify-center'>
            <div className='w-[60vw] flex gap-5 bg-black p-2 rounded-full border-[1px] border-neutral-700 shadow-lg items-center px-8'>
                <input
                    id='search-database-input'
                    className='focus:outline-none bg-transparent w-full py-4'
                    type='search'
                    placeholder='Search Your Database...'
                />
                <Button variant='white' className='min-w-fit' rightSection={<Search size={20} />}>
                    Search
                </Button>
            </div>
        </div>
    </div>;
}


const AnimatedSidebar = () => 
{
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => 
    {
        const handleKeyPress = (event: any) => 
        {
            if (event.key === 'Enter' && event.target.id === 'search-database-input') 
            {
                setIsOpen(true);
            }
        };

        document.addEventListener('keypress', handleKeyPress);

        return () => 
        {
            document.removeEventListener('keypress', handleKeyPress);
        };
    }, []);

    return (
        <div className="absolute top-2 right-0">
            <div
                className={`w-[50vw] h-[calc(100vh-200px)] bg-black bg-opacity-75 border-[1px] border-neutral-700 shadow-lg transform transition-transform duration-300 ease-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Sidebar content goes here */}
                <div className="p-4">
                    <h2 className="text-lg font-bold mb-4">Sidebar Content</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                        Close Sidebar
                    </button>
                </div>
            </div>
        </div>
    );
};