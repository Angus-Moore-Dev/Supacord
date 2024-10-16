/* eslint-disable @typescript-eslint/no-explicit-any */
import { EntityData, ProjectNode } from '@/lib/global.types';
import accessTokenRefresher from '@/utils/accessTokenRefresher';
import getDatabaseTableStructure from '@/utils/getDatabaseTableStructure';
import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { SupabaseManagementAPI } from 'supabase-management-js';
// import axios from 'axios';




export async function POST(request: NextRequest)
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;

    if (!user)
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { organisationId, projectId, schema, organisationName, projectName } = await request.json();

    if (!organisationId || !projectId || !schema || !organisationName || !projectName)
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    const { data: accessTokens, error } = await supabase
        .from('supabase_access_tokens')
        .select('*')
        .eq('profileId', user.id);

    if (error)
    {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    if (accessTokens.length === 0)
        return NextResponse.json({ error: 'No tokens found' }, { status: 404 });

    const refreshedTokens = await accessTokenRefresher(accessTokens, supabase);

    const token = refreshedTokens.find(token => token.organisationId === organisationId);
    if (!token)
        return NextResponse.json({ error: 'No token found for organisation' }, { status: 404 });

    const managementSupabase = new SupabaseManagementAPI({ accessToken: token.accessToken });
    const tableStructure = await getDatabaseTableStructure(managementSupabase, projectId, schema);

    const { data: newProject, error: newProjectError } = await supabase
        .from('projects')
        .insert({
            profileId: user.id,
            databaseName: projectName,
            organisationId,
            projectId,
            selectedSchema: schema,
            databaseStructure: tableStructure,
        })
        .select('*')
        .single();

    if (newProjectError)
    {
        console.error(newProjectError);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const { id: newProjectId } = newProject;

    // we want to now go through every single table within the selected schema, pull all data from it and create new nodes in our database.
    // we also want to create relationships between these nodes based on the foreign keys in the database. But that comes later.

    // do it in batches of 100 rows at a time.
    for (const table of tableStructure)
    {
        let offset = 0;
        // find out how large this table is
        const tableSizeResult = await managementSupabase.runQuery(projectId, `SELECT COUNT(*) FROM ${schema}."${table.table}"`);
        if (!tableSizeResult)
        {
            console.error('No result from query');
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        const tableSize = (tableSizeResult[0] as unknown as { count: number }).count;

        console.log('SCRAPING TABLE::', table.table, 'SIZE::', tableSize);
        do
        {
            // so the only columns we care about is the primary key and the foreign keys for establishing links.
            // figure out from the table structure which columns are the primary key and which are foreign keys.
            const columnsToSelect = table.columns.filter(column => column.isPrimaryKey || column.foreignKeyRelation);

            // now we need to get the data from the table.
            const tableData = await managementSupabase.runQuery(projectId, `SELECT ${columnsToSelect.map(column => `"${column.name}"`).join(', ')} FROM ${schema}."${table.table}" LIMIT 500 OFFSET ${offset}`);
            if (!tableData)
            {
                console.error('No result from query');
                return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
            }

            // now we need to make the number of nodes for the number of results we just got (max of 100)
            const nodes: {
                projectId: string;
                dbRelationship: string;
                entityData: EntityData[];
            }[] = [];

            for (const row of tableData as unknown as Record<any, any>[])
            {
                const entityData: EntityData[] = [];
                for (const column of columnsToSelect)
                {
                    entityData.push({
                        columnName: column.name,
                        columnValue: row[column.name],
                        foreignKeyRelationship: column.foreignKeyRelation || '',
                        isPrimaryKey: column.isPrimaryKey,
                    });
                }

                nodes.push({
                    projectId: newProjectId,
                    dbRelationship: `${schema}.${table.table}`,
                    entityData,
                });
            }

            // now we need to insert these nodes into the database.
            const { error: insertedNodesError } = await supabase
                .from('project_nodes')
                .insert(nodes);

            if (insertedNodesError)
            {
                console.error(insertedNodesError);
                return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
            }

            offset += 500;
        }
        while (offset < tableSize);
    }


    // ======================== LINK GENERATION HERE ========================
    const [{ data: nodes, error: nodesError }, { data: existingLinks, error: linksError }] = await Promise.all([
        supabase
            .from('project_nodes')
            .select('*')
            .eq('projectId', newProjectId)
            .neq('dbRelationship', 'public.changelog'),
        supabase
            .from('project_links')
            .select('startingNodeId, endingNodeId')
            .eq('projectId', newProjectId)
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
            const link = checkAndCreateLink(node, otherNode, newProjectId, existingLinkSet);
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

    return NextResponse.json({ id: newProjectId });
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