import { createAdminClient, createServerClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';



export async function GET(request: NextRequest)
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;

    if (!user)
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const supabaseClientId = process.env.SUPABASE_CLIENT_ID;
    const redirectURI = `${request.nextUrl.origin}/oauth/supabase/callback`;

    console.log(redirectURI);

    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
        .from('supabase_oauth_auth_flow')
        .insert({
            profileId: user.id,
            requestingOrigin: request.nextUrl.origin,
        })
        .select('*')
        .single();

    if (error)
    {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const { state } = data;
    
    const url = `https://api.supabase.io/v1/oauth/authorize?client_id=${supabaseClientId}&redirect_uri=${redirectURI}&response_type=code&state=${state}`;

    return NextResponse.json({ url });
}