/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { isSupabaseError, SupabaseManagementAPI } from 'supabase-management-js';
import accessTokenRefresher from '@/utils/accessTokenRefresher';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION,
});

export async function POST(request: NextRequest) 
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;

    if (!user) 
    {
        return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401 });
    }

    const { projectId, searchQuery, chatHistory } = await request.json() as {
        projectId: string;
        searchQuery: string;
        chatHistory: {
            type: string;
            content: string;
        }[];
    };
    if (!projectId || !searchQuery || !chatHistory) 
    {
        return new Response(JSON.stringify({ error: 'Missing projectId or searchQuery' }), { status: 400 });
    }

    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (!project) 
    {
        return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404 });
    }

    const { data: accessTokens, error } = await supabase
        .from('supabase_access_tokens')
        .select('*');

    if (error) 
    {
        console.error(error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }

    const refreshedTokens = await accessTokenRefresher(accessTokens, supabase);

    const token = refreshedTokens.find(token => token.organisationId === project.organisationId);
    if (!token) 
    {
        return new Response(JSON.stringify({ error: 'No access token found for project' }), { status: 404 });
    }

    const managementSupabase = new SupabaseManagementAPI({ accessToken: token.accessToken });

    // Fetch the database schema
    const schema = project.databaseStructure;

    const tools = [
        {
            type: 'function',
            function: {
                name: 'generate_sql_queries',
                description: 'Generates SQL queries based on a given database schema and user question. ONLY OUTPUT VALID SQL STATEMENTS',
                parameters: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'array',
                            description: 'The recommended visualization format(s) for the query results',
                            items: {
                                type: 'string',
                                enum: ['text', 'table', 'bar chart', 'line chart', 'pie chart', 'scatter plot', 'time series', 'heatmap', 'histogram']
                            }
                        },
                        chainedQueries: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    sqlQuery: { type: 'string' },
                                    type: { type: 'array', items: { type: 'string' } },
                                    queryExplanation: { type: 'string' }
                                }
                            },
                            description: 'An array of related queries that should be executed in sequence'
                        },
                        primaryKey: {
                            type: 'array',
                            description: 'the primary key of the table being queried (for instance, public.profiles.id or public.investments.id)',
                            items: { type: 'string' }
                        }
                    },
                    required: ['sqlQuery', 'type']
                }
            }
        }
    ];

    const messages = [
        {
            role: 'system',
            content: `
            You are an advanced SQL query generator designed to act as a direct interface between users and a specific PostgreSQL database. Your primary function is to translate natural language questions into accurate and efficient SQL queries that will be automatically executed against the database. Your output must be precise, VALID SQL and ready for immediate use. Follow these guidelines:

            1. Query Accuracy and Direct Execution:
            - Generate SQL queries that are valid, accurate, and immediately executable against the given database schema.
            - Your queries will be used directly to interact with the database, so ensure they are free from syntax errors and logically correct.
            - Identify and utilize columns that could be used as enums (e.g., status types, categories) for more efficient querying.

            2. User-Database Interface:
            - Act as a translator between natural language user inputs and SQL queries.
            - Interpret user intentions accurately, even when questions are ambiguous or incomplete.
            - If a user question is unclear, ask for clarification before generating a query.

            3. Query Chaining and Independence:
            - When necessary, create multiple SQL queries that can be chained together to achieve complex goals.
            - Ensure each query is independently executable.
            - If a task requires multiple dependent operations, combine them into a single query using subqueries or CTEs.
            - Separate independent operations into distinct queries.

            4. Data Visualization Recommendations:
            - For each query, suggest the most appropriate visualization format based on the data being fetched:
                a. Use bar charts for comparisons across categories (e.g., error counts by severity).
                b. Recommend line charts for time-based data with clear X and Y axes (e.g., errors per hour over 24 hours).
                c. Suggest tables for detailed, multi-column data (e.g., user assessments).
                d. Consider pie charts for showing composition or proportion.
                e. Propose scatter plots for showing relationships between two variables.
                f. Recommend time series charts for data with timestamps.

            5. Schema Awareness and Optimization:
            - Utilize your knowledge of the database schema to create optimal queries.
            - Leverage appropriate joins, indexes, and table relationships.
            - Write queries with performance in mind, using appropriate indexing and avoiding unnecessary table scans.
            - Use aggregations and window functions when dealing with large datasets.

            6. Error Handling and Edge Cases:
            - Consider potential null values, empty sets, or edge cases in your queries.
            - Provide appropriate error handling or default values where necessary.

            7. Query Explanation:
            - Provide clear explanations of the query logic and any assumptions made.
            - If asked, break down complex queries to help users understand the approach.

            8. Security and Access Control:
            - Be mindful of potential security implications in your queries.
            - Avoid generating queries that could expose sensitive data or compromise database integrity.

            Remember, your output will be directly used to query the database. Therefore, you must only generate valid SQL statements that adhere to PostgreSQL syntax. Your role is critical in bridging the gap between user intent and database interaction, so strive for accuracy, efficiency, and clarity in all your responses.
            Wrap all columns and tables in double quotes in case of camelCase or special characters used in the column or table names.

            all tables, functions, views, materialized views, triggers, and indexes are under the schema: "${project.selectedSchema}". Do not reference any other schema unless it's through a foreign key relationship.
            When returning a row from a table, ensure that the primary key comes first and is labelled as "schema.table_name.key". We need this for additional functionality for data visualisation (so we can recognise
            what nodes are being referred to in the graph).

            The structure of the schema is as follows:
            {
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
            }

            Here is the schema:
            
            \`\`\`json
            ${JSON.stringify(schema, null, 2)}
            \`\`\`
            `
        },
        ...chatHistory.map(message => ({
            role: message.type === 'user' ? 'user' : 'assistant',
            content: `Please generate an SQL query for postgresql based on the following user input: ${message.content}`
        }))
    ];

    //@ts-expect-error - stream is not in the types
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        tools: tools,
        tool_choice: 'required',
        temperature: 0
    });

    const streamingResponse = new ReadableStream({
        async start(controller) 
        {
            if (chatHistory.length > 0)
                controller.enqueue('\n\n');

            const toolCalls = response.choices[0].message.tool_calls;
            if (toolCalls && toolCalls.length > 0)
            {
                const { 
                    type,
                    chainedQueries,
                    primaryKey
                } = JSON.parse(toolCalls[0].function.arguments) as { 
                    type: string[],
                    chainedQueries: { sqlQuery: string, type: string[], queryExplanation: string }[],
                    primaryKey: string[]
                };

                console.log('Type:', type);
                console.log('Chained Queries:', chainedQueries);
                console.log('Primary Key:', primaryKey);

                try 
                {
                    for (const sqlQuery of chainedQueries)
                    {
                        // controller.enqueue(`\`\`\`sql\n${sqlQuery.sqlQuery}\n\`\`\``);

                        const result = await managementSupabase.runQuery(
                            project.projectId, 
                            sqlQuery.sqlQuery
                        );

                        // we want to get the primary key entities from what was returned
                        console.log(result);
                    
                        if (Array.isArray(result) && result.length > 0) 
                        {
                            const markdownTable = convertToMarkdownTable(result);
                            controller.enqueue(markdownTable);
                        }
                        else 
                        {
                            controller.enqueue('No results found.');
                        }
                    }
                }
                catch (error) 
                {
                    if (isSupabaseError(error))
                    {
                        console.error(error);
                    }
                    controller.enqueue(`Error executing query: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            controller.close();
        },
    });


    return new Response(streamingResponse, { headers: { 'Content-Type': 'text/plain' }});
}

function convertToMarkdownTable(data: Record<string, any>[]): string 
{
    if (!data || data.length === 0) return 'No results found.';

    // Add headers
    const headers = Object.keys(data[0]);
    let markdownTable = `| ${headers.join(' | ')} |\n`;
    
    // Add separator row
    markdownTable += `| ${headers.map(() => '---').join(' | ')} |\n`;

    // Add data rows
    for (const row of data) 
    {
        markdownTable += `| ${headers.map(header => 
        {
            const value = row[header];
            if (value === null || value === undefined) return '';
            // Escape pipe characters in the content to prevent table formatting issues
            return String(value).replace(/\|/g, '\\|');
        }).join(' | ')} |\n`;
    }

    return markdownTable;
}