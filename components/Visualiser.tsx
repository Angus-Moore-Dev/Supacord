/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

export default function Visualiser() 
{
    const graphRef = useRef<SVGSVGElement>(null);

    useEffect(() => 
    {
        // width is the width of the visualiser-body section
        const width = document.getElementById('visualiser-body')?.clientWidth || 1600;
        const height = document.getElementById('visualiser-body')?.clientHeight || 900;

        const svg = d3.select(graphRef.current)
            .attr('width', width)
            .attr('height', height)
            .style('border', '1px solid #ccc')
            .call(d3.zoom<any, any>().on('zoom', (event) => 
            {
                svg.attr('transform', event.transform);
            }))
            .append('g');  // Adding group for panning/zooming

        // Dummy data for nodes and links
        const nodes = [{ 
            id: 'A',
            x: width / 2,
            y: height / 2,
            vx: 0,
            vy: 0
        }, 
        { 
            id: 'B',
            x: width / 2,
            y: height / 2,
            vx: 0,
            vy: 0
        }, 
        { 
            id: 'C',
            x: width / 2,
            y: height / 2,
            vx: 0,
            vy: 0
        }, 
        { 
            id: 'D',
            x: width / 2,
            y: height / 2,
            vx: 0,
            vy: 0
        }, 
        { 
            id: 'E',
            x: width / 2,
            y: height / 2,
            vx: 0,
            vy: 0
        }];

        const links = [
            { source: 'A', target: 'B' },
            { source: 'A', target: 'C' },
            { source: 'B', target: 'D' },
            { source: 'C', target: 'D' },
            { source: 'D', target: 'E' }
        ];

        // Initialize the simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id((d: any) => d.id))
            .force('charge', d3.forceManyBody())
            .force('center', d3.forceCenter(width / 2, height / 2));

        // Initialize the links
        const link = svg.selectAll('.link')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke', '#FFF')
            .attr('stroke-width', 1);

        // Initialize the nodes with drag functionality
        const node = svg.selectAll('.node')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('class', 'node')
            .attr('r', 5)
            .attr('cursor', 'pointer')
            .attr('fill', '#FFF')
            .call(
                d3.drag<SVGCircleElement, any>()
                    .on('start', (event, d) => 
                    {
                        if (!event.active) simulation.alphaTarget(0.3).restart();
                        d.fx = d.x;
                        d.fy = d.y;
                    })
                    .on('drag', (event, d) => 
                    {
                        d.fx = event.x;
                        d.fy = event.y;
                    })
                    .on('end', (event, d) => 
                    {
                        if (!event.active) simulation.alphaTarget(0);
                        d.fx = null;
                        d.fy = null;
                    })
            );

        // Show node id on hover
        node.append('title')
            .text((d: any) => d.id);

        // Update positions on each tick
        simulation.on('tick', () => 
        {
            link.attr('x1', (d: any) => d.source.x)
                .attr('y1', (d: any) => d.source.y)
                .attr('x2', (d: any) => d.target.x)
                .attr('y2', (d: any) => d.target.y);

            node.attr('cx', (d: any) => d.x)
                .attr('cy', (d: any) => d.y);
        });

        return () => 
        {
            // Cleanup when the component is unmounted
            simulation.stop();
        };
    }, []);


    return (
        <section id='visualiser-body' className="flex-grow w-full min-h-full flex flex-col border-[1px] border-neutral-600 rounded-lg">
            <svg ref={graphRef}></svg>
        </section>
    );
}
