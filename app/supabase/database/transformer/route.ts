import accessTokenRefresher from '@/utils/accessTokenRefresher';
import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { SupabaseManagementAPI } from 'supabase-management-js';





export async function POST(request: NextRequest)
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;

    if (!user)
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { organisationId, projectId, schema, tables } = await request.json();

    if (!organisationId || !projectId || !schema || !tables)
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    const { data: accessTokens, error } = await supabase
        .from('supabase_access_tokens')
        .select('*')
        .eq('profileId', user.id);

    if (error)
    {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    if (accessTokens.length === 0)
        return NextResponse.json({ error: 'No tokens found' }, { status: 404 });

    const refreshedTokens = await accessTokenRefresher(accessTokens, supabase);

    const token = refreshedTokens.find(token => token.organisationId === organisationId);
    if (!token)
        return NextResponse.json({ error: 'No token found for organisation' }, { status: 404 });

    const managementSupabase = new SupabaseManagementAPI({ accessToken: token.accessToken });

    // let's get all the columns for each table. we need to know if it's a foreign key and what table (and schema) it references.
    const tableColumns: {
        table: string,
        columns: {
            name: string,
            type: string, // int8, text, uuid, bigint etc.
            foreignKeyRelation: string | null, // schema.table.column or null
        }[]
    }[] = [];

    const result = await managementSupabase.runQuery(projectId, `
        SELECT
            table_info.table_schema,
            table_info.table_name,
            table_info.column_name,
            table_info.data_type,
            COALESCE(
                fk_info.foreign_table_schema || '.' || fk_info.foreign_table_name || '.' || fk_info.foreign_column_name,
                NULL
            ) AS foreign_key_relation
        FROM
            (
                SELECT
                    cols.table_schema,
                    cols.table_name,
                    cols.column_name,
                    cols.data_type
                FROM
                    information_schema.columns AS cols
                WHERE
                    cols.table_schema = '${schema}'
            ) AS table_info
        LEFT JOIN
            (
                SELECT
                    tc.table_schema,
                    tc.table_name,
                    kcu.column_name,
                    ccu.table_schema AS foreign_table_schema,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM
                    information_schema.table_constraints AS tc
                JOIN
                    information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN
                    information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                WHERE
                    tc.constraint_type = 'FOREIGN KEY'
            ) AS fk_info
            ON table_info.table_schema = fk_info.table_schema
            AND table_info.table_name = fk_info.table_name
            AND table_info.column_name = fk_info.column_name
        ORDER BY
            table_info.table_name,
            table_info.column_name;
    `);

    if (!result)
    {
        console.error('No result from query');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    // we need to group the columns by table_name.
    let currentTable: string | null = null;
    let currentColumns: { name: string, type: string, foreignKeyRelation: string | null }[] = [];

    for (const row of result as unknown as { table_schema: string, table_name: string, column_name: string, data_type: string, foreign_key_relation: string }[])
    {
        if (currentTable !== row.table_name)
        {
            if (currentTable)
            {
                tableColumns.push({ table: currentTable, columns: currentColumns });
                currentColumns = [];
            }

            currentTable = row.table_name;
        }

        currentColumns.push({
            name: row.column_name,
            type: row.data_type,
            foreignKeyRelation: row.foreign_key_relation,
        });
    }

    if (currentTable)
        tableColumns.push({ table: currentTable, columns: currentColumns });

    return NextResponse.json({ message: 'Accepted' }, { status: 202 });
}