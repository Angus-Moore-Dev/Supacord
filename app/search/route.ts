import accessTokenRefresher from '@/utils/accessTokenRefresher';
import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest)
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;

    if (!user)
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });

    const { projectId, searchQuery } = await request.json();
    if (!projectId || !searchQuery)
        return NextResponse.json({ error: 'Missing projectId or searchQuery' }, { status: 400 });

    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (!project)
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    const { data: accessToken, error: accessTokenError } = await supabase
        .from('supabase_access_tokens')
        .select('*');

    if (accessTokenError)
        return NextResponse.json({ error: 'Error fetching access token' }, { status: 500 });

    const refreshedTokens = await accessTokenRefresher(accessToken, supabase);

    return NextResponse.json({ project });
}