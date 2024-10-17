import { DatabaseSchemaStructure } from '@/lib/global.types';
import { SupabaseManagementAPI } from 'supabase-management-js';

export default async function getDatabaseTableStructure(
    supabase: SupabaseManagementAPI,
    projectId: string,
    schema: string,
): Promise<DatabaseSchemaStructure>
{
    const result = await supabase.runQuery(projectId, `
            WITH primary_keys AS (
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            kcu.column_name
        FROM 
            information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
    ),
    schema_info AS (
        SELECT 
            t.table_schema,
            t.table_name,
            c.column_name,
            c.data_type,
            c.character_maximum_length,
            c.is_nullable,
            c.column_default,
            fk.foreign_table_schema,
            fk.foreign_table_name,
            fk.foreign_column_name,
            CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key
        FROM 
            information_schema.tables t
        JOIN 
            information_schema.columns c ON t.table_schema = c.table_schema AND t.table_name = c.table_name
        LEFT JOIN (
            SELECT
                conname AS foreign_key_name,
                n.nspname AS table_schema,
                c.relname AS table_name,
                a.attname AS column_name,
                nf.nspname AS foreign_table_schema,
                cf.relname AS foreign_table_name,
                af.attname AS foreign_column_name
            FROM
                pg_constraint
            JOIN 
                pg_class c ON c.oid = pg_constraint.conrelid
            JOIN 
                pg_namespace n ON n.oid = c.relnamespace
            JOIN 
                pg_class cf ON cf.oid = pg_constraint.confrelid
            JOIN 
                pg_namespace nf ON nf.oid = cf.relnamespace
            JOIN 
                pg_attribute a ON a.attnum = ANY(pg_constraint.conkey) AND a.attrelid = pg_constraint.conrelid
            JOIN 
                pg_attribute af ON af.attnum = ANY(pg_constraint.confkey) AND af.attrelid = pg_constraint.confrelid
            WHERE
                contype = 'f'
        ) fk ON fk.table_schema = t.table_schema AND fk.table_name = t.table_name AND fk.column_name = c.column_name
        LEFT JOIN primary_keys pk ON pk.table_schema = t.table_schema AND pk.table_name = t.table_name AND pk.column_name = c.column_name
        WHERE 
            t.table_schema = '${schema}'
    ),
    columns_json AS (
        SELECT
            table_name,
            json_agg(
                json_build_object(
                    'column_name', column_name,
                    'data_type', data_type,
                    'character_maximum_length', character_maximum_length,
                    'is_nullable', is_nullable,
                    'column_default', column_default,
                    'is_primary_key', is_primary_key,
                    'foreign_key', CASE 
                        WHEN foreign_table_name IS NOT NULL THEN 
                            json_build_object(
                                'foreign_table_schema', foreign_table_schema,
                                'foreign_table_name', foreign_table_name,
                                'foreign_column_name', foreign_column_name
                            )
                        ELSE NULL
                    END
                ) ORDER BY column_name
            ) AS columns
        FROM schema_info
        GROUP BY table_name
    ),
    tables_json AS (
        SELECT 
            json_agg(
                json_build_object(
                    'table_name', table_name,
                    'columns', columns
                ) ORDER BY table_name
            ) AS tables
        FROM columns_json
    ),
    functions_json AS (
        SELECT json_agg(
            json_build_object(
                'function_name', p.proname,
                'return_type', pg_catalog.pg_get_function_result(p.oid),
                'argument_types', pg_catalog.pg_get_function_arguments(p.oid),
                'function_type', CASE p.prokind
                                    WHEN 'f' THEN 'function'
                                    WHEN 'p' THEN 'procedure'
                                    WHEN 'a' THEN 'aggregate'
                                    WHEN 'w' THEN 'window'
                                END
            ) ORDER BY p.proname
        ) AS functions
        FROM pg_catalog.pg_proc p
        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = '${schema}'
    ),
    views_json AS (
        SELECT json_agg(
            json_build_object(
                'view_name', table_name,
                'view_definition', view_definition
            ) ORDER BY table_name
        ) AS views
        FROM information_schema.views
        WHERE table_schema = '${schema}'
    ),
    materialized_views_json AS (
        SELECT json_agg(
            json_build_object(
                'materialized_view_name', matviewname,
                'definition', definition
            ) ORDER BY matviewname
        ) AS materialized_views
        FROM pg_catalog.pg_matviews
        WHERE schemaname = '${schema}'
    ),
    triggers_json AS (
        SELECT json_agg(
            json_build_object(
                'trigger_name', trigger_name,
                'event_manipulation', event_manipulation,
                'event_object_table', event_object_table,
                'action_statement', action_statement,
                'action_timing', action_timing
            ) ORDER BY trigger_name
        ) AS triggers
        FROM information_schema.triggers
        WHERE trigger_schema = '${schema}'
    ),
    indexes_json AS (
        SELECT json_agg(
            json_build_object(
                'table_name', tablename,
                'index_name', indexname,
                'index_definition', indexdef
            ) ORDER BY tablename, indexname
        ) AS indexes
        FROM pg_indexes
        WHERE schemaname = '${schema}'
    )
    SELECT json_build_object(
        'schema', tables,
        'functions', functions,
        'views', views,
        'materialized_views', materialized_views,
        'triggers', triggers,
        'indexes', indexes
    ) AS schema_json
    FROM tables_json, functions_json, views_json, materialized_views_json, triggers_json, indexes_json;
    `);

    if (!result) 
    {
        console.error('No result from query');
        throw new Error('No result from query');
    }

    const schemaJson = (result[0] as { schema_json: DatabaseSchemaStructure }).schema_json;

    return schemaJson;
}
