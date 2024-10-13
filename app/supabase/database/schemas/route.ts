import accessTokenRefresher from '@/utils/accessTokenRefresher';
import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { SupabaseManagementAPI } from 'supabase-management-js';


export async function POST(request: NextRequest)
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;

    if (!user)
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { organisationId, projectId } = await request.json();

    if (!projectId || !organisationId)
        return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    // just assume we can get the project.

    const { data: tokens, error } = await supabase
        .from('supabase_access_tokens')
        .select('*');

    if (error)
    {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    if (tokens.length === 0)
        return NextResponse.json({ error: 'No tokens found' }, { status: 404 });

    const refreshedTokens = await accessTokenRefresher(tokens, supabase);

    // now we find the token that corresponds to the organisationId
    const token = refreshedTokens.find(token => token.organisationId === organisationId);
    if (!token)
        return NextResponse.json({ error: 'No token found for organisation' }, { status: 404 });

    const managementSupabase = new SupabaseManagementAPI({ accessToken: token.accessToken });
    const result = await managementSupabase.runQuery(projectId, 'SELECT schema_name FROM information_schema.schemata');

    if (!result)
    {
        console.error('No result from query');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    // result is an array of { schema_name: string } objects.
    // remove any schema name that goes pg_ or information_schema
    const schemas = (result as unknown as { schema_name: string }[])
        .map((row: { schema_name: string }) => row.schema_name)
        .filter((schema: string) => !schema.startsWith('pg_') && schema !== 'information_schema');

    console.log(schemas.sort());
    return NextResponse.json(schemas.sort());
}