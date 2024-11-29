// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import type { 
    Macro,
    SearchStreamOutput
} from 'lib/global.types.ts';
import type { Database } from 'lib/database.types.ts';
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js';
import { isSupabaseError, SupabaseManagementAPI } from 'npm:supabase-management-js';

/**
 * The purpose of this function is to compute a series of macros for a given project. It takes in an arbitrary sized array
 * of macro ids, fetches them and then runs their queries, storing the results in the user_macro_invocation_results table.
 */
Deno.serve(async (req: Request) => 
{
    const authHeader = req.headers.get('Authorization');

    if (!authHeader || authHeader !== `Bearer ${Deno.env.get('EDGE_FUNCTION_KEY')}` ) 
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const macros = await req.json() as Macro[];

    if (!Array.isArray(macros))
        return new Response(JSON.stringify({ error: 'Macro ids is not an array' }), { status: 400 });
    if (macros.length === 0)
        return new Response(JSON.stringify({ error: 'No macro ids provided' }), { status: 400 });

    const adminSupabase = createClient<Database>(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // we want to compute all of these macros in parallel, since a lot of them will be across multiple projects for different users.
    const promiseChain: Promise<void>[] = [];

    // Group macros by projectId to minimize token refreshes
    const macrosByProject = macros.reduce((acc, macro) => 
    {
        if (!acc[macro.projectId]) 
        {
            acc[macro.projectId] = [];
        }
        acc[macro.projectId].push(macro);
        return acc;
    }, {} as Record<string, Macro[]>);

    for (const [projectId, projectMacros] of Object.entries(macrosByProject)) 
    {
        promiseChain.push((async () => 
        {
            const { data: project, error: projectError } = await adminSupabase
                .from('projects')
                .select('id, organisationId, projectId, databaseName')
                .eq('id', projectId)
                .single();

            if (projectError) 
            {
                console.error(projectError);
                throw new Error(projectError.message);
            }

            const { data: accessToken, error: accessTokenError } = await adminSupabase
                .from('supabase_access_tokens')
                .select('*')
                .eq('organisationId', project.organisationId)
                .single();

            if (accessTokenError) 
            {
                console.error(accessTokenError);
                throw new Error(accessTokenError.message);
            }

            // Only refresh token once per project
            const updatedAccessToken = await refreshTokenSingular(accessToken, adminSupabase);
            const managementSupabase = new SupabaseManagementAPI({ accessToken: updatedAccessToken.accessToken });

            // Process all macros for this project
            for (const macro of projectMacros) 
            {
                const output: SearchStreamOutput[] = [];
                
                for (const queryData of macro.queryData) 
                {
                    try 
                    {
                        const result = await managementSupabase.runQuery(project.projectId, queryData.sqlQuery);
                        output.push({
                            type: queryData.outputType,
                            content: JSON.stringify(queryData.outputType.includes('chart') ? {
                                ...queryData.chartDetails,
                                data: result
                            } : result)
                        });
                    }
                    catch (error) 
                    {
                        if (isSupabaseError(error)) 
                        {
                            console.error(error);
                            throw new Error(error.message);
                        }
                        else 
                        {
                            console.error(error);
                            throw error;
                        }
                    }
                }
                
                const { error: outputError } = await adminSupabase
                    .from('user_macro_invocation_results')
                    .insert({
                        sqlQueries: (macro.queryData as { sqlQuery: string }[]).map(query => query.sqlQuery),
                        macroId: macro.id,
                        outputs: output
                    });

                if (outputError) 
                {
                    console.error(outputError);
                    throw new Error(outputError.message);
                }
            }
        })());
    }

    await Promise.all(promiseChain);

    return new Response(
        JSON.stringify(macros),
        { headers: { 'Content-Type': 'application/json' } },
    );
});

/* To invoke locally:

    1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
    2. Make an HTTP request:

    curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/macro_computation' \
    --header 'Authorization: Bearer supalytics_8144b465-ebfb-41be-913b-fbd2de78e801' \
    --header 'Content-Type: application/json' \
    --data '["1234567890","1234567890"]'

*/



// Fuck Edge Function import maps not working.
// This genuinely has pissed me off for nearly 2 hours, being unable to import
// code that uses @supabase/supabase-js instead of the fucking Deno version.
// Why can't it just auto resolve that they're the same libraries? The packages carry
// fucking hashes after all, so you could determine that it's the same library, same code
// so it's all good to run from there...

// Here's the redundant, duplicated code to refresh the tokens for the fucking external
// access. Maybe I'm just stupid and couldn't figure it out properly, but there was nearly
// nothing on this beyond 2 lines on the official Deno docs.

type SupabaseToken = Database['public']['Tables']['supabase_access_tokens']['Row'];
export async function refreshTokenSingular(token: SupabaseToken, supabase: SupabaseClient<Database>): Promise<SupabaseToken> 
{
    const now = Math.floor(Date.now() / 1000);
    if (now > token.accessTokenExpirationUTC) 
    {
        const response = await fetch('https://api.supabase.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            body: new URLSearchParams({
                client_id: Deno.env.get('SUPALYTICS_SUPABASE_CLIENT_ID')!,
                client_secret: Deno.env.get('SUPALYTICS_SUPABASE_CLIENT_SECRET')!,
                grant_type: 'refresh_token',
                refresh_token: token.refreshToken,
            })
        });
        
        const newTokenData = await response.json();
        console.log(newTokenData);
        const { data: newToken, error: updateError } = await supabase
            .from('supabase_access_tokens')
            .update({
                accessToken: newTokenData.access_token,
                refreshToken: newTokenData.refresh_token,
                accessTokenExpirationUTC: now + newTokenData.expires_in,
            })
            .eq('id', token.id)
            .select('*')
            .single();
        if (updateError) throw new Error(updateError.message);
        return newToken;
    }

    return token;
}