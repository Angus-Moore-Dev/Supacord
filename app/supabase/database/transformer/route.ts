import accessTokenRefresher from '@/utils/accessTokenRefresher';
import getDatabaseTableStructure from '@/utils/getDatabaseTableStructure';
import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { SupabaseManagementAPI } from 'supabase-management-js';





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

    return NextResponse.json({ id: newProjectId });
}