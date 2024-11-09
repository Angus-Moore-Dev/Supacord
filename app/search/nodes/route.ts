import { EntityData, PrimaryKeyEntities, ProjectLink, ProjectNode } from '@/lib/global.types';
import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';



export async function POST(request: NextRequest)
{
    const supabase = createServerClient();
    const user = ((await supabase.auth.getUser()).data).user;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });


    const { 
        projectId,
        primaryKeys
    } = await request.json() as {
        projectId: string,
        primaryKeys: PrimaryKeyEntities[]
    };

    console.log('projectId', projectId);
    console.log('primaryKeys', primaryKeys);

    const gData: {
        links: { source: string, target: string }[],
        nodes: { primaryKey: string, id: string, dbRelationship: string }[],
    } = {
        links: [],
        nodes: [],
    };

    let nodeOffset = 0;
    const batchSize = 500;
    const { count, error } = await supabase
        .from('project_nodes')
        .select('*', { count: 'exact', head: true })
        .eq('projectId', projectId);

    if (error || count === null)
    {
        console.error('Failed to fetch project nodes count', error);
        return NextResponse.json({ error: 'Failed to fetch total count for project nodes' }, { status: 500 });
    }

    // first we need to get the nodes based on their dbRelationship.

    // the dbRelationship is in the format of schema.table, wheres the primary key is schema.table.colum,
    // so we need to split the dbRelationship to get the schema and table name to reduce the nodes down
    // const dbRelationships = primaryKeys.map(pk => pk.primaryKey.split('.').slice(0, 2).join('.'));

    // now we iterate through 1000 nodes at a time to get the nodes that are related to the primary keys
    const allNodes: ProjectNode[] = [];

    do
    {
        const { data: nodes, error } = await supabase
            .from('project_nodes')
            .select('*')
            .eq('projectId', projectId)
            .range(nodeOffset, nodeOffset + batchSize - 1);

        if (error)
        {
            console.error('Failed to fetch project nodes', error);
            return NextResponse.json({ error: 'Failed to fetch project nodes' }, { status: 500 });
        }

        for (const node of nodes)
        {
            const entityData = node.entityData as EntityData[];
            // now we get the primary key for the node

            for (const entity of entityData)
            {
                if (primaryKeys.find(x => x.primaryKey === `${node.dbRelationship}.${entity.columnName}`))
                    if (primaryKeys.some(x => x.ids.includes(entity.columnValue)))
                        allNodes.push(node);
            }
        }

        nodeOffset += batchSize;
    }
    while (nodeOffset < count);


    for (const node of allNodes)
    {
        const entityData = node.entityData as EntityData[];
        if (entityData.length === 0) continue;

        if (entityData.some(x => x.isPrimaryKey && primaryKeys.some(pk => pk.primaryKey === `${node.dbRelationship}.${x.columnName}` && pk.ids.includes(x.columnValue))))
        {
            gData.nodes.push({
                primaryKey: `${node.dbRelationship}.${entityData.find(x => x.isPrimaryKey)!.columnName}`,
                id: node.id,
                dbRelationship: node.dbRelationship,
            });
        }
    }

    const promiseChain: Promise<ProjectLink[]>[] = [];
    for (const node of gData.nodes)
    {
        promiseChain.push((async () => 
        {
            const { data: links, error } = await supabase
                .from('project_links')
                .select('*')
                .eq('projectId', projectId)
                .or(`startingNodeId.eq.${node.id},endingNodeId.eq.${node.id}`);

            if (error)
            {
                console.error('Failed to fetch project links', error);
                return [];
            }

            return links;
        })());
    }

    // now we get the nodes on the other side of the link
    const links = await Promise.all(promiseChain);
    gData.links = links.flat().map(link => ({ source: link.startingNodeId, target: link.endingNodeId }));

    // sometimes the links have the target and source mixed up,
    // so we need to fetch the IDs of the links to get the nodes on the other side of the link
    
    const otherSideNodeIds = links.flat().map(link => gData.nodes.find(node => node.id === link.startingNodeId) ? link.endingNodeId : link.startingNodeId);
    const { data: oneDegreeSeparationNodes, error: oneDegreeSeparationNodesError } = await supabase
        .from('project_nodes')
        .select('*')
        .in('id', otherSideNodeIds);

    if (oneDegreeSeparationNodesError)
    {
        console.error('Failed to fetch one degree separation nodes', oneDegreeSeparationNodesError);
        return NextResponse.json({ error: 'Failed to fetch one degree separation nodes' }, { status: 500 });
    }

    gData.nodes.push(...oneDegreeSeparationNodes.map(node => ({ 
        primaryKey: (node.entityData as EntityData[]).find(x => x.isPrimaryKey)?.columnValue || '', 
        id: node.id, 
        dbRelationship: node.dbRelationship
    })));

    // now we repeat this process for the one degree separated nodes to get the 2nd degree separated nodes

    const secondDegreeChain: Promise<ProjectLink[]>[] = [];
    for (const node of oneDegreeSeparationNodes)
    {
        secondDegreeChain.push((async () => 
        {
            const { data: links, error } = await supabase
                .from('project_links')
                .select('*')
                .eq('projectId', projectId)
                .or(`startingNodeId.eq.${node.id},endingNodeId.eq.${node.id}`);

            if (error)
            {
                console.error('Failed to fetch project links', error);
                return [];
            }

            return links;
        })());
    }

    const secondDegreeLinks = await Promise.all(secondDegreeChain);
    gData.links.push(...secondDegreeLinks.flat().map(link => ({ source: link.startingNodeId, target: link.endingNodeId })));

    // now we get the nodes on the other side of the link
    const secondDegreeOtherSideNodeIds = secondDegreeLinks.flat().map(link => oneDegreeSeparationNodes.find(node => node.id === link.startingNodeId) ? link.endingNodeId : link.startingNodeId);
    const { data: secondDegreeNodes, error: secondDegreeNodesError } = await supabase
        .from('project_nodes')
        .select('*')
        .in('id', secondDegreeOtherSideNodeIds);

    if (secondDegreeNodesError)
    {
        console.error('Failed to fetch second degree nodes', secondDegreeNodesError);
        return NextResponse.json({ error: 'Failed to fetch second degree nodes' }, { status: 500 });
    }

    gData.nodes.push(...secondDegreeNodes.map(node => ({ 
        primaryKey: (node.entityData as EntityData[]).find(x => x.isPrimaryKey)?.columnValue || '', 
        id: node.id, 
        dbRelationship: node.dbRelationship
    })));


    return NextResponse.json(gData);
}