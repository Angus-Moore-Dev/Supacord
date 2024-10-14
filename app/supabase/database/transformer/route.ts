/* eslint-disable @typescript-eslint/no-explicit-any */
import { EntityData } from '@/lib/global.types';
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

    // now we use axios to dispatch a request to the link generation endpoint.
    // axios.post(`${request.nextUrl.origin}/supabase/database/transformer/link-generation`, { projectId: newProjectId });

    return NextResponse.json({ id: newProjectId });
}