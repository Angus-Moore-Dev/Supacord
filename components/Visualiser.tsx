/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

export default function Visualiser() 
{
    const graphRef = useRef<SVGSVGElement>(null);

    useEffect(() => 
    {
        const width = document.getElementById('visualiser-body')?.clientWidth || 1600;
        const height = document.getElementById('visualiser-body')?.clientHeight || 900;

        // Select the <svg> element and remove any existing content to prevent multiple instances
        const svg = d3.select(graphRef.current);
        svg.selectAll('*').remove();  // Clear previous content

        // Append a <g> element for zoom and pan
        const g = svg.append('g');

        // Apply zoom behavior to the entire <svg>, but transform the <g> group inside
        svg.call(
            d3.zoom<any, any>()
                .scaleExtent([0.1, 4])
                .on('zoom', (event) => 
                {
                    g.attr('transform', event.transform); // Apply zoom and pan transformation to <g>
                })
        );

        const nodes = [
            { id: 'questions: A', type: 'question', x: width / 2, y: height / 2, vx: 0, vy: 0 },
            { id: 'questions: B', type: 'question', x: width / 2, y: height / 2, vx: 0, vy: 0 },
            { id: 'responses: C', type: 'response', x: width / 2, y: height / 2, vx: 0, vy: 0 },
            { id: 'responses: D', type: 'response', x: width / 2, y: height / 2, vx: 0, vy: 0 },
            { id: 'responses: E', type: 'response', x: width / 2, y: height / 2, vx: 0, vy: 0 }
        ];

        const links = [
            { source: 'questions: A', target: 'questions: B' },
            { source: 'questions: A', target: 'responses: C' },
            { source: 'questions: B', target: 'responses: D' },
            { source: 'responses: C', target: 'responses: D' },
            { source: 'responses: D', target: 'responses: E' },
            { source: 'responses: E', target: 'questions: A' }
        ];

        // Calculate the degree (number of links) for each node
        const degreeMap: Record<string, number> = {};
        links.forEach(link => 
        {
            degreeMap[link.source] = (degreeMap[link.source] || 0) + 1;
            degreeMap[link.target] = (degreeMap[link.target] || 0) + 1;
        });

        // Initialize the simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id((d: any) => d.id))
            .force('charge', d3.forceManyBody())
            .force('center', d3.forceCenter(width / 2, height / 2));

        // Initialize the links
        const link = g.selectAll('.link')
            .data(links)
            .enter()
            .append('line')
            .attr('class', 'link')
            .attr('stroke', '#FFF')
            .attr('stroke-width', 1);

        // Initialize the nodes with drag functionality and color coding
        const node = g.selectAll('.node')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('class', 'node')
            .attr('r', (d: any) => (degreeMap[d.id] || 3) * 3) // Scale the radius by the number of links
            .attr('cursor', 'pointer')
            .attr('fill', (d: any) => d.type === 'question' ? 'red' : 'green') // Color questions red, responses green
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

        // Add a legend to explain the color coding
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width - 150}, ${height - 100})`);

        // Add question legend (red)
        legend.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 6)
            .attr('fill', 'red');

        legend.append('text')
            .attr('x', 10)
            .attr('y', 4)
            .attr('fill', 'white')
            .text('Questions');

        // Add response legend (green)
        legend.append('circle')
            .attr('cx', 0)
            .attr('cy', 20)
            .attr('r', 6)
            .attr('fill', 'green');

        legend.append('text')
            .attr('x', 10)
            .attr('y', 24)
            .attr('fill', 'white')
            .text('Responses');

        return () => 
        {
            simulation.stop();
        };
    }, []);

    return (
        <section id='visualiser-body' className="flex-grow w-full min-h-full flex flex-col border-2 border-neutral-700 rounded-lg">
            <svg ref={graphRef} className='flex-grow rounded-lg border-neutral-700'></svg>
        </section>
    );
}
