import { createAdminClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseError, SupabaseManagementAPI } from 'supabase-management-js';


export async function GET(request: NextRequest)
{
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!state)
        return new Response('Missing state', { status: 400 });
    if (!code)
        return new Response('Missing code', { status: 400 });

    // now we check if the state is valid.
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from('supabase_oauth_auth_flow')
        .select('*')
        .eq('state', state)
        .single();

    if (error)
    {
        console.error(error);
        return NextResponse.json({ error: 'No state found' }, { status: 404 });
    }

    // now we make a request to get our access token.
    const { requestingOrigin, profileId } = data;

    const tokenResult = await fetch('https://api.supabase.io/v1/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Authorization': `Bearer ${btoa(`${process.env.SUPABASE_CLIENT_ID}:${process.env.SUPABASE_CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
            client_id: process.env.SUPABASE_CLIENT_ID!,
            client_secret: process.env.SUPABASE_CLIENT_SECRET!,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: `${requestingOrigin}/oauth/supabase/callback`,
        })
    });

    const tokenData = await tokenResult.json() as {
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    };

    // get the current UTC time in seconds.
    const tokenExpirationUTC = Math.floor(Date.now() / 1000) + tokenData.expires_in;

    const managementSupabase = new SupabaseManagementAPI({ accessToken: tokenData.access_token });

    let organisationId: string | null = null;
    let organisationName: string | null = null;
    try
    {
        const organisations = await managementSupabase.getOrganizations();
        if (!organisations || organisations.length === 0)
        {
            console.error('No organisations found');
            return NextResponse.json({ error: 'No organisations found' }, { status: 500 });
        }

        organisationId = organisations[0].id;
        organisationName = organisations[0].name;
    }
    catch (error)
    {
        if (isSupabaseError(error))
        {
            console.error(error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    }


    if (!organisationId || !organisationName)
    {
        console.error('Organsiation Id and Name not supplied a value before creating the token.');
        return NextResponse.json({ error: 'No organisation found' }, { status: 500 });
    }

    const { error: tokenError } = await adminSupabase
        .from('supabase_access_tokens')
        .insert({
            profileId: profileId,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            accessTokenExpirationUTC: tokenExpirationUTC,
            organisationId: organisationId,
            organisationName: organisationName,
        });

    if (tokenError)
    {
        console.error(tokenError);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.redirect(`${requestingOrigin}/app`);
}