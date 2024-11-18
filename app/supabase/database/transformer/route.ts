import accessTokenRefresher from '@/utils/accessTokenRefresher';
import getDatabaseTableStructure from '@/utils/getDatabaseTableStructure';
import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { SupabaseManagementAPI } from 'supabase-management-js';
import { DatabaseSchemaStructure } from '@/lib/global.types';




export async function POST(request: NextRequest)
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;

    if (!user)
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { organisationId, projectId, organisationName, projectName } = await request.json();

    if (!organisationId || !projectId || !organisationName || !projectName)
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

    // it gets returned as a string[].
    const schemasResult = await managementSupabase.runQuery(projectId, 'SELECT schema_name FROM information_schema.schemata');
    const schemas = (schemasResult as unknown as { schema_name: string }[])
        .map((row: { schema_name: string }) => row.schema_name)
        .filter((schema: string) => !schema.startsWith('pg_') && schema !== 'information_schema');

    const promiseChain: Promise<DatabaseSchemaStructure>[] = [];

    for (const schema of schemas)
    {
        promiseChain.push(getDatabaseTableStructure(managementSupabase, projectId, schema));
    }

    const schemaStructures = await Promise.all(promiseChain);

    const { data: newProject, error: newProjectError } = await supabase
        .from('projects')
        .insert({
            profileId: user.id,
            databaseName: projectName,
            organisationId,
            projectId,
            databaseStructure: schemaStructures
        })
        .select('*')
        .single();

    if (newProjectError)
    {
        console.error(newProjectError);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const { id: newProjectId } = newProject;


    return NextResponse.json({ id: newProjectId });
}