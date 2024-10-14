/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { Project, ProjectLink, ProjectNode } from '@/lib/global.types';
import ForceGraph3D from 'react-force-graph-3d';

interface VisualiserProps
{
    project: Project;
    projectNodes: ProjectNode[];
    projectLinks: ProjectLink[];
}

export default function Visualiser({ projectNodes, projectLinks }: VisualiserProps) 
{

    // const N = 5000;
    // const gData = {
    //     nodes: [...Array(N).keys()].map(i => ({ id: i })),
    //     links: [...Array(N).keys()]
    //         .filter(id => id)
    //         .map(id => ({
    //             source: id,
    //             target: Math.round(Math.random() * (id-1)),
    //         }))
    // };

    const gData = {
        nodes: projectNodes.map(node => ({ id: node.id })),
        links: projectLinks.map(link => ({ source: link.startingNodeId, target: link.endingNodeId }))
    };

    return <ForceGraph3D
        graphData={gData}
        nodeColor={() => 'red'}
        nodeLabel={node => `Node: ${node.id}: ${JSON.stringify(projectNodes.find(x => x.id === node.id)?.entityData ?? {})}`}
        backgroundColor='#1a1a1a'
        cooldownTicks={100}
        warmupTicks={0}
    />;
}
