import { EntityData, ProjectNode } from '@/lib/global.types';
import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) 
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;

    if (!user)
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { projectId } = await request.json();
    if (!projectId)
        return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    // Fetch all nodes and existing links in a single query
    const [{ data: nodes, error: nodesError }, { data: existingLinks, error: linksError }] = await Promise.all([
        supabase
            .from('project_nodes')
            .select('*')
            .eq('projectId', projectId)
            .neq('dbRelationship', 'public.changelog'),
        supabase
            .from('project_links')
            .select('startingNodeId, endingNodeId')
            .eq('projectId', projectId)
    ]);

    if (nodesError || linksError) 
    {
        console.error(nodesError || linksError);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    console.log('Nodes length::', nodes.length);
    console.log('Existing links length::', existingLinks.length);

    // Create a Set of existing links for faster lookup
    const existingLinkSet = new Set(existingLinks.map(link => `${link.startingNodeId}-${link.endingNodeId}`));

    const newLinks: { projectId: string, startingNodeId: string, endingNodeId: string }[] = [];
    let linksCreated = 0;

    for (let i = 0; i < nodes.length; i++) 
    {
        const node = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) 
        {
            const otherNode = nodes[j];
            const link = checkAndCreateLink(node, otherNode, projectId, existingLinkSet);
            if (link) 
            {
                newLinks.push(link);
                linksCreated++;
                console.log(`#${linksCreated}`, 'LINK CREATED::', link.startingNodeId, '->', link.endingNodeId);
            }
        }
    }

    // Batch insert all new links
    if (newLinks.length > 0) 
    {
        let offset = 0;
        const BATCH_SIZE = 1000;
        do
        {
            const { error: insertError } = await supabase
                .from('project_links')
                .insert(newLinks.slice(offset, offset + BATCH_SIZE));
            if (insertError) 
            {
                console.error(insertError);
                return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
            }
            offset += BATCH_SIZE;
        }
        while (offset < newLinks.length);
    }

    return NextResponse.json({ success: true, linksCreated });
}

function checkAndCreateLink(node1: ProjectNode, node2: ProjectNode, projectId: string, existingLinkSet: Set<string>) 
{
    for (const entityData1 of node1.entityData as EntityData[]) 
    {
        for (const entityData2 of node2.entityData as EntityData[]) 
        {
            if (checkRelationship(entityData1, entityData2, node1, node2) || 
                checkRelationship(entityData2, entityData1, node2, node1)) 
            {
                const forwardLink = `${node1.id}-${node2.id}`;
                const reverseLink = `${node2.id}-${node1.id}`;

                if (!existingLinkSet.has(forwardLink) && !existingLinkSet.has(reverseLink)) 
                {
                    return {
                        projectId: projectId,
                        startingNodeId: node1.id,
                        endingNodeId: node2.id,
                    };
                }
                else
                {
                    console.log('LINK EXISTS::', node1.id, '->', node2.id);
                }
            }
        }
    }
    return null;
}

function checkRelationship(entityData1: EntityData, entityData2: EntityData, node1: ProjectNode, node2: ProjectNode): boolean 
{
    return (
        entityData1.foreignKeyRelationship === `${node2.dbRelationship}.${entityData2.columnName}` && 
        entityData1.columnValue === entityData2.columnValue
    ) || (
        entityData1.columnName === entityData2.foreignKeyRelationship?.split('.')[1] &&
        entityData1.columnValue === entityData2.columnValue
    );
}