import { SupabaseManagementAPI } from 'supabase-management-js';



export default async function getDatabaseTableStructure(
    supabase: SupabaseManagementAPI,
    projectId: string,
    schema: string,
)
{
    const tableColumns: {
        table: string,
        columns: {
            name: string,
            type: string, // int8, text, uuid, bigint etc.
            foreignKeyRelation: string | null, // schema.table.column or null
        }[]
    }[] = [];

    const result = await supabase.runQuery(projectId, `
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
        throw new Error('No result from query');
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

    return tableColumns;
}