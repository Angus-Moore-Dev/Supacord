import { Database } from '@/lib/database.types';
import { SupabaseToken } from '@/lib/global.types';
import { SupabaseClient } from '@supabase/supabase-js';


export default async function accessTokenRefresher(
    tokens: SupabaseToken[], 
    supabase: SupabaseClient<Database>,
)
{
    const refreshedTokens: SupabaseToken[] = [];

    for (const token of tokens)
    {
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

            // update the database with the new access token.
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

            if (updateError)
            {
                console.error(updateError);
                throw new Error(updateError.message);
            }

            refreshedTokens.push(newToken);
        }

        refreshedTokens.push(token);
    }

    return refreshedTokens;
}