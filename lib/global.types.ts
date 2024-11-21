import { Database } from './database.types';

export type SupabaseToken = Database['public']['Tables']['supabase_access_tokens']['Row'];

export type Project = Database['public']['Tables']['projects']['Row'];
export type Notebook = Database['public']['Tables']['notebooks']['Row'];
export type NotebookEntry = Omit<Database['public']['Tables']['notebook_entries']['Row'], 'outputs'> & { outputs: NotebookEntryOutput[] };

export type Profile = Database['public']['Tables']['profiles']['Row'];

export type Macro = Database['public']['Tables']['user_macros']['Row'];

export type EntityData = {
    columnName: string;
    columnValue: string;
    foreignKeyRelationship: string; // schema.table.column
    isPrimaryKey: boolean;
}

export type DatabaseSchemaStructure = {
    schema: Array<{
        table_name: string;
        columns: Array<{
        column_name: string;
        data_type: string;
        character_maximum_length: number | null;
        is_nullable: string;
        column_default: string | null;
        is_primary_key: boolean;
        foreign_key: {
            foreign_table_schema: string;
            foreign_table_name: string;
            foreign_column_name: string;
        } | null;
        }>;
    }>;
    functions: Array<{
        function_name: string;
        return_type: string;
        argument_types: string;
        function_type: 'function' | 'procedure' | 'aggregate' | 'window';
    }>;
    views: Array<{
        view_name: string;
        view_definition: string;
    }>;
    materialized_views: Array<{
        materialized_view_name: string;
        definition: string;
    }>;
    triggers: Array<{
        trigger_name: string;
        event_manipulation: string;
        event_object_table: string;
        action_statement: string;
        action_timing: string;
    }>;
    indexes: Array<{
        table_name: string;
        index_name: string;
        index_definition: string;
    }>;
};


export type PrimaryKeyEntities = { primaryKey: string, ids: string[] };

export enum OutputType
{
    Error = 'error',
    Text = 'text',
    SQL = 'sql query',
    Table = 'table',
    BarChart = 'bar chart',
    LineChart = 'line chart',
    PieChart = 'pie chart',
    ScatterPlot = 'scatter plot',
    Heatmap = 'heatmap', // TODO: @mantine/charts does not support this.
}

export type SearchStreamOutput = {
    content: string; // unformatted content
    type: OutputType;
}

export type NotebookEntryOutput = {
    version: number;
    chunks: SearchStreamOutput[];
}