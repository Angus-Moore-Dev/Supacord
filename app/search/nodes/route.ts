import { EntityData, PrimaryKeyEntities, ProjectNode } from '@/lib/global.types';
import recursiveDFSNodeSearch from '@/utils/recursiveDFSNodeSearch';
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
        nodes: { id: string }[],
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
    const dbRelationships = primaryKeys.map(pk => pk.primaryKey.split('.').slice(0, 2).join('.'));

    // now we iterate through 1000 nodes at a time to get the nodes that are related to the primary keys
    const allNodes: ProjectNode[] = [];

    do
    {
        const { data: nodes, error } = await supabase
            .from('project_nodes')
            .select('*')
            .eq('projectId', projectId)
            .in('dbRelationship', dbRelationships)
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

    // now we recursive go down the path of computing the links
    for (const node of allNodes)
        await recursiveDFSNodeSearch(
            supabase,
            gData,
            node,
            1   
        );

    // now we want to make sure that every single link has 2 nodes, otherwise remove it.
    console.log('gData', gData);
    return NextResponse.json(gData);
}