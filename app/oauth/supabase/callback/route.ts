import { createAdminApiClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';


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
    const adminSupabase = createAdminApiClient();
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

    const { error: tokenError } = await adminSupabase
        .from('supabase_access_tokens')
        .insert({
            id: profileId,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            accessTokenExpirationUTC: tokenExpirationUTC,
        });
    
    if (tokenError)
    {
        console.error(tokenError);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    return NextResponse.redirect(`${requestingOrigin}/app`);
}