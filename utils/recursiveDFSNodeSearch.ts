import { Database } from '@/lib/database.types';
import { ProjectNode } from '@/lib/global.types';
import { SupabaseClient } from '@supabase/supabase-js';

export default async function recursiveDFSNodeSearch(
    supabase: SupabaseClient<Database>,
    gData: {
        links: { source: string; target: string; }[];
        nodes: { id: string; }[];
    },
    currentNode: ProjectNode,
    degreesOfSeparation: number,
    currentDepth: number = 0,
    visitedNodes: Set<string> = new Set()  // Track visited nodes
): Promise<void> 
{
    console.log('currentNode', currentNode, 'degreesOfSeparation', degreesOfSeparation, 'currentDepth', currentDepth);

    // Base case: if we've reached our maximum degrees of separation, stop recursing
    if (currentDepth >= degreesOfSeparation) 
    {
        // fetch the nodes that are connected to this node, then do not recurse further
        if (!visitedNodes.has(currentNode.id)) 
        {
            visitedNodes.add(currentNode.id);
            gData.nodes.push({ id: currentNode.id });  // Only store the ID
        }

        const { data: edges, error } = await supabase
            .from('project_links')
            .select('*')
            .or(`startingNodeId.eq.${currentNode.id},endingNodeId.eq.${currentNode.id}`);

        if (error)
        {
            console.error('Failed to fetch edges for node', currentNode.id, error);
            return;
        }

        for (const edge of edges) 
        {
            const edgeExists = gData.links.some(l => 
                (l.source === edge.startingNodeId && l.target === edge.endingNodeId) ||
                (l.source === edge.endingNodeId && l.target === edge.startingNodeId)
            );

            if (!edgeExists) 
            {
                gData.links.push({
                    source: edge.startingNodeId,
                    target: edge.endingNodeId,
                });
            }
        }

        // grab the nodes for these edges and then return.
        const nodeIds = edges.map(edge => edge.startingNodeId === currentNode.id ? edge.endingNodeId : edge.startingNodeId);

        const { data: nodes, error: nodeError } = await supabase
            .from('project_nodes')
            .select('*')
            .in('id', nodeIds);

        if (nodeError)
        {
            console.error('Failed to fetch nodes for edges', nodeError);
            return;
        }

        for (const node of nodes) 
        {
            if (!visitedNodes.has(node.id)) 
            {
                visitedNodes.add(node.id);
                gData.nodes.push({ id: node.id });
            }
        }

        return;
    }

    // recursive step.
    // Add the current node if we haven't seen it yet
    if (!visitedNodes.has(currentNode.id)) 
    {
        visitedNodes.add(currentNode.id);
        gData.nodes.push({ id: currentNode.id });  // Only store the ID
    }

    // Fetch all edges connected to the current node
    const { data: edges, error } = await supabase
        .from('project_links')
        .select('*')
        .or(`startingNodeId.eq.${currentNode.id},endingNodeId.eq.${currentNode.id}`);

    if (error) 
    {
        console.error('Failed to fetch edges for node', currentNode.id, error);
        return;
    }

    // Process each edge
    for (const edge of edges) 
    {
        // Add edge if we haven't seen it yet (in either direction)
        const edgeExists = gData.links.some(l => 
            (l.source === edge.startingNodeId && l.target === edge.endingNodeId) ||
            (l.source === edge.endingNodeId && l.target === edge.startingNodeId)
        );

        if (!edgeExists) 
        {
            gData.links.push({
                source: edge.startingNodeId,
                target: edge.endingNodeId,
            });
        }

        // Determine which node ID to fetch (the one that isn't the current node)
        const targetNodeId = edge.startingNodeId === currentNode.id 
            ? edge.endingNodeId 
            : edge.startingNodeId;

        // Only fetch and recurse on the target node if we haven't visited it yet
        if (!visitedNodes.has(targetNodeId)) 
        {
            const { data: targetNode, error: nodeError } = await supabase
                .from('project_nodes')
                .select('*')
                .eq('id', targetNodeId)
                .single();

            if (nodeError) 
            {
                console.error('Failed to fetch target node', targetNodeId, nodeError);
                continue;
            }

            // Recursively process the target node at the next depth level
            await recursiveDFSNodeSearch(
                supabase,
                gData,
                targetNode,
                degreesOfSeparation,
                currentDepth + 1,
                visitedNodes
            );
        }
    }
}