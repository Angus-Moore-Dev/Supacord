import { EntityData } from '@/lib/global.types';
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

    const { data: nodes, error: nodesError } = await supabase
        .from('project_nodes')
        .select('*')
        .eq('projectId', projectId);

    if (nodesError)
    {
        console.error(nodesError);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const linksCreated = 0;

    for (const node of nodes)
    {
        for (const otherNode of nodes)
        {
            if (node.id === otherNode.id)
                continue;

            for (const entityData of node.entityData as EntityData[])
            {
                for (const otherEntityData of otherNode.entityData as EntityData[])
                {
                    if (entityData.foreignKeyRelationship === `${otherNode.dbRelationship}.${otherEntityData.columnName}` && entityData.columnValue === otherEntityData.columnValue)
                    {
                        // check this link doesn't already exist.
                        const { data: existingLinks, error: existingLinksError } = await supabase
                            .from('project_links')
                            .select('*')
                            .eq('startingNodeId', node.id)
                            .eq('endingNodeId', otherNode.id);

                        const { data: existingLinksReverse, error: existingLinksReverseError } = await supabase
                            .from('project_links')
                            .select('*')
                            .eq('startingNodeId', otherNode.id)
                            .eq('endingNodeId', node.id);
                            
                        if (existingLinksError || existingLinksReverseError)
                        {
                            console.error(existingLinksError || existingLinksReverseError);
                            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
                        }

                        if (existingLinks.length === 0 && existingLinksReverse.length === 0)
                        {
                            const { error: insertedLinkError } = await supabase
                                .from('project_links')
                                .insert({
                                    projectId: projectId,
                                    startingNodeId: node.id,
                                    endingNodeId: otherNode.id,
                                });

                            if (insertedLinkError)
                            {
                                console.error(insertedLinkError);
                                return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
                            }

                            console.log(`#${linksCreated}`, 'LINK CREATED::', node.id, '->', otherNode.id, entityData.foreignKeyRelationship);
                        }
                    }
                }
            }
        }
    }

    return NextResponse.json({ success: true });
}