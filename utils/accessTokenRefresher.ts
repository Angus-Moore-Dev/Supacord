import { Database } from '../lib/database.types';
import { SupabaseToken } from '../lib/global.types';
import { SupabaseClient } from '@supabase/supabase-js';

export default async function accessTokenRefresher(
    tokens: SupabaseToken[], 
    supabase: SupabaseClient<Database>,
): Promise<SupabaseToken[]> 
{
    return await Promise.all(tokens.map(token => refreshTokenSingular(token, supabase)));
}

export async function refreshTokenSingular(token: SupabaseToken, supabase: SupabaseClient<Database>): Promise<SupabaseToken> 
{
    const now = Math.floor(Date.now() / 1000);
    if (now > token.accessTokenExpirationUTC) 
    {
        return fetch('https://api.supabase.com/v1/oauth/token', {
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
        })
            .then(response => response.json())
            .then((newTokenData: {
                access_token: string;
                refresh_token: string;
                token_type: string;
                expires_in: number;
            }) => 
            {
                return supabase
                    .from('supabase_access_tokens')
                    .update({
                        accessToken: newTokenData.access_token,
                        refreshToken: newTokenData.refresh_token,
                        accessTokenExpirationUTC: now + newTokenData.expires_in,
                    })
                    .eq('id', token.id)
                    .select('*')
                    .single();
            })
            .then(({ data: newToken, error: updateError }) => 
            {
                if (updateError) throw new Error(updateError.message);
                return newToken;
            });
    }

    return token;
}