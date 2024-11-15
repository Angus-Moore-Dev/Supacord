import accessTokenRefresher from '@/utils/accessTokenRefresher';
import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseError, SupabaseManagementAPI } from 'supabase-management-js';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION,
});


export async function POST(request: NextRequest)
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user)
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { 
        projectId,
        chatHistory
    } = await request.json() as {
        projectId: string;
        chatHistory: {
            type: 'ai' | 'user';
            content: string;
        }[];
    };

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
                                enum: ['text', 'table', 'bar chart', 'line chart', 'pie chart', 'scatter plot', 'heatmap']
                            }
                        },
                        chartDetails: {
                            type: 'object',
                            description: 'Labels for the data that would be used in a chart. MUST BE THE SAME AS THE COLUMN NAMES IN THE RESULTING QUERY, OTHERWISE IT WILL FAIL.',
                            properties: {
                                xLabel: { type: 'string' },
                                yLabel: { type: 'string' },
                                title: { type: 'string' },
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
                    required: ['chainedQueries', 'type', 'queryExplanation', 'primaryKey']
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
            - For aggregate queries, use appropriate SQL functions that don't require GROUP BY clauses when possible.

            2. User-Database Interface:
            - Act as a translator between natural language user inputs and SQL queries.
            - Interpret user intentions accurately, even when questions are ambiguous or incomplete.
            - If a user question is unclear, ask for clarification before generating a query.

            3. Query Chaining and Independence:
            - When necessary, create multiple SQL queries that can be chained together to achieve complex goals.
            - Ensure each query is independently executable.
            - If a task requires multiple dependent operations, combine them into a single query using subqueries or CTEs.
            - Separate independent operations into distinct queries.
            - Any foreign key or primary key relationship must be defined as "schema.table.column", e.g. "public"."reviews"."profileId" => "public"."profiles"."id" or "public"."investments"."createdBy" => "public"."profiles"."id".
            This is necessary for the graph visualisation tool to understand the relationships between nodes.

            4. Data Visualization Requirements:
            - For each query, suggest the most appropriate visualization format based on the data being fetched:
                a. Use bar charts for comparisons across categories (e.g., error counts by severity).
                b. Recommend line charts for time-based data with clear X and Y axes (e.g., errors per hour over 24 hours).
                c. Suggest tables for detailed, multi-column data (e.g., user assessments).
                d. Consider pie charts for showing composition or proportion.
                e. Propose scatter plots for showing relationships between two variables.
                f. Recommend time series charts for data with timestamps.
                g. Suggest radial charts for categorical data where a bar chart is not suitable.

            5. Schema Awareness and Optimization:
            - Utilize your knowledge of the database schema to create optimal queries.
            - Leverage appropriate joins, indexes, and table relationships.
            - Write queries with performance in mind, using appropriate indexing and avoiding unnecessary table scans.
            - Use aggregations and window functions when dealing with large datasets.

            6. Error Handling and Edge Cases:
            - Consider potential null values, empty sets, or edge cases in your queries.
            - Provide appropriate error handling or default values where necessary.
            - If the user provides a name that doesn't correlate to any column or table, attempt to infer the correct column or table based on context.
            for instance, the user saying "type" might correspond to "severity", "moduleType" or another column in the table. It is up to you to assume
            that the user is not familiar with the schema of the database.

            7. Query Explanation:
            - Provide clear explanations of the query logic and any assumptions made.
            - If asked, break down complex queries to help users understand the approach.

            Remember, your output will be directly used to query the database. Therefore, you must only generate valid SQL statements that adhere to PostgreSQL syntax. Your role is critical in bridging the gap between user intent and database interaction, so strive for accuracy, efficiency, and clarity in all your responses.
            Wrap all columns and tables in double quotes in case of camelCase or special characters used in the column or table names.

            all tables, functions, views, materialized views, triggers, and indexes are under the schema: "${project.selectedSchema}". Do not reference any other schema unless it's through a foreign key relationship.
            When returning a row from a table, ensure that the primary key comes first and is labelled as "schema.table_name.key". We need this for additional functionality for data visualisation (so we can recognise
            what nodes are being referred to in the graph). For instance, "profiles.id" would be "public"."profiles"."id", or "investments.investmentNumberId" would be "public"."investments"."investmentNumberId".

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

    const streamingResponse = new ReadableStream({
        async start(controller) 
        {
            try
            {
                //@ts-expect-error - stream is not in the types
                const response = await openai.chat.completions.create({
                    model: 'gpt-4o',
                    messages: messages,
                    tools: tools,
                    tool_choice: 'required',
                    temperature: 0.3
                });


                const toolCalls = response.choices[0].message.tool_calls;
                if (toolCalls && toolCalls.length > 0)
                {
                    const { 
                        type,
                        chainedQueries,
                        primaryKey,
                        chartDetails,
                    } = JSON.parse(toolCalls[0].function.arguments) as { 
                    type: string[],
                    chainedQueries: { sqlQuery: string, type: string[], queryExplanation: string }[],
                    primaryKey: string[],
                    chartDetails: {
                        xLabel: string;
                        yLabel: string;
                        title: string;
                    }
                };

                    console.log('Type:', type);
                    console.log('Chained Queries:', chainedQueries);
                    console.log('Primary Key:', primaryKey);
                    console.log('Chart Details:', chartDetails);

                    for (const chainedQuery of chainedQueries)
                    {
                        controller.enqueue(`\n\n=====SQL QUERY=====\n${chainedQuery.sqlQuery}\n=====END SQL QUERY=====\n`);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    
                        try
                        {
                            const result = await managementSupabase.runQuery(
                                project.projectId, 
                                chainedQuery.sqlQuery
                            );

                            // now we want to output based on the type with the query explanation and then the result
                            controller.enqueue(`\n=====TEXT=====\n${chainedQuery.queryExplanation}\n=====END TEXT=====\n`);
                            // now we want to output based on the type
                            for (const type of chainedQuery.type)
                            {
                                // if it's a chart type, we want to output the chart details formatted against the results
                                // so that we send one JSON object that's already mapped to the chart details
                                if (type.includes('chart'))
                                {
                                    const { xLabel, yLabel, title } = chartDetails;
                                    const chartData = {
                                        xLabel,
                                        yLabel,
                                        title,
                                        data: result
                                    };

                                    console.log('Type:', type, 'is being sent to the client');
                                    await new Promise(resolve => setTimeout(resolve, 250));
                                    controller.enqueue(`\n=====${type.toUpperCase()}=====\n${JSON.stringify(chartData)}\n=====END ${type.toUpperCase()}=====\n`);
                                    await new Promise(resolve => setTimeout(resolve, 250));
                                }
                                else
                                {
                                    console.log('Type:', type, 'is being sent to the client');
                                    await new Promise(resolve => setTimeout(resolve, 250));
                                    controller.enqueue(`\n=====${type.toUpperCase()}=====\n${JSON.stringify(result)}\n=====END ${type.toUpperCase()}=====\n`);
                                    await new Promise(resolve => setTimeout(resolve, 250));
                                }
                            }
                        }
                        catch (error)
                        {
                            if (isSupabaseError(error))
                            {
                                console.error(error.message);
                                controller.enqueue(`\n=====ERROR=====\n${error.message}\n=====END ERROR=====\n`);
                            }
                            else
                            {
                                console.error(error);
                                controller.enqueue('\n=====ERROR=====\nAn error occurred while executing the query\n=====END ERROR=====\n');
                            }
                        }
                    }
                }
            }
            catch (error)
            {
                console.error(error);
                controller.enqueue('\n=====ERROR=====\nAn error occurred while generating the SQL queries\n=====END ERROR=====\n');
            }
            finally
            {
                controller.close();
            }
        },
    });

    return new Response(streamingResponse, { headers: { 'Content-Type': 'text/plain' }});
}