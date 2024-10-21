import accessTokenRefresher from '@/utils/accessTokenRefresher';
import { createServerClient } from '@/utils/supabaseServer';
import { NextResponse } from 'next/server';
import { isSupabaseError, SupabaseManagementAPI } from 'supabase-management-js';



export async function GET()
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user)
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { data: accessTokens, error } = await supabase
        .from('supabase_access_tokens')
        .select('*')
        .eq('profileId', user.id)
        .order('createdAt', { ascending: true });

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

    try
    {
        const refreshedTokens = await accessTokenRefresher(accessTokens, supabase);

        for (const token of refreshedTokens)
        {
            const managementSupabase = new SupabaseManagementAPI({ accessToken: token.accessToken });
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
    catch (error)
    {
        if (isSupabaseError(error))
            console.error(error.message);
        else
            console.error(error);

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}