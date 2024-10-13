import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseError, SupabaseManagementAPI } from 'supabase-management-js';


export async function POST(request: NextRequest)
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;

    if (!user)
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { organisationId, projectId, schema } = await request.json();

    if (!projectId || !organisationId || !schema)
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

    // now we find the token that corresponds to the organisationId
    const token = tokens.find(token => token.organisationId === organisationId);
    if (!token)
        return NextResponse.json({ error: 'No token found for organisation' }, { status: 404 });

    const managementSupabase = new SupabaseManagementAPI({ accessToken: token.accessToken });

    // get the tables against the given schema.

    try
    {
        const tables = await managementSupabase.runQuery(projectId, `SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema}'`);
        // it's stored as { table_name: 'name' }[] so we just want the names.
        return NextResponse.json(
            (tables as unknown as { table_name: string }[]).map(table => table.table_name)
        );
    }
    catch (error)
    {
        if (isSupabaseError(error))
        {
            console.error(error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    }

    return NextResponse.json({ message: 'Hello' });
}