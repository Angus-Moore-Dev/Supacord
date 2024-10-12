import { createServerClient } from '@/utils/supabaseServer';
import { NextResponse } from 'next/server';
import { SupabaseManagementAPI } from 'supabase-management-js';



export async function GET()
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user)
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { data: accessTokens, error } = await supabase
        .from('supabase_access_tokens')
        .select('*')
        .eq('profileId', user.id);

    if (error)
    {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }


    const projectData: {
        organisationId: string;
        name: string;
        projects: {
            id: string;
            name: string;
        }[]
    }[] = [];


    for (const token of accessTokens)
    {
        let accessToken = token.accessToken;

        const now = Math.floor(Date.now() / 1000);
        if (now > token.accessTokenExpirationUTC)
        {
            // use the refresher to get ourselves a new one.
            const newTokenResult = await fetch('https://api.supabase.com/v1/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                body: new URLSearchParams({
                    client_id: process.env.SUPABASE_CLIENT_ID!,
                    client_secret: process.env.SUPABASE_CLIENT_SECRET!,
                    grant_type: 'refresh_token',
                    refresh_token: token.refreshToken,
                })
            });

            const newTokenData = await newTokenResult.json() as {
                access_token: string;
                refresh_token: string;
                token_type: string;
                expires_in: number;
            };

            accessToken = newTokenData.access_token;

            // update the database with the new access token.
            const { error: updateError } = await supabase
                .from('supabase_access_tokens')
                .update({
                    accessToken: newTokenData.access_token,
                    refreshToken: newTokenData.refresh_token,
                    accessTokenExpirationUTC: now + newTokenData.expires_in,
                })
                .eq('profileId', user.id);

            if (updateError)
            {
                console.error(updateError);
                return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
            }
        }

        const managementSupabase = new SupabaseManagementAPI({ accessToken });
        const projects = await managementSupabase.getProjects();
        if (!projects)
        {
            console.error('ERROR FETCHING PROJECTS FOR ACCESS TOKEN ID:', token.id);
            continue;
        }

        if (projects.length === 0)
            continue;

        projectData.push({
            organisationId: token.organisationId,
            name: token.organisationName,
            projects: projects.map(project => ({
                id: project.id,
                name: project.name,
            }))
        });
    }

    return NextResponse.json(projectData);
}