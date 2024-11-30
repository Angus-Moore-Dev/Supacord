import accessTokenRefresher from '@/utils/accessTokenRefresher';
import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseError, SupabaseManagementAPI } from 'supabase-management-js';
import OpenAI from 'openai';
import { DatabaseSchemaStructure, NotebookEntry, NotebookEntryOutput, OutputType } from '@/lib/global.types';
import getDatabaseTableStructure from '@/utils/getDatabaseTableStructure';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION,
});

// Output specific things
interface ChartDetails {
    xLabel: string;
    yLabel: string;
    title: string;
}

interface SQLQueryResult {
    sqlQuery: string;
    type: OutputType;
    queryExplanation: string;
    chartDetails?: ChartDetails;
}

interface SQLGeneratorResponse {
    queries: SQLQueryResult[];
    primaryKey: string[];
}

// Example type guard to validate the response
function isValidSQLResponse(response: unknown): response is SQLGeneratorResponse 
{
    const r = response as SQLGeneratorResponse;
    return (
        !!r &&
        Array.isArray(r.queries) &&
        r.queries.every(q => 
            typeof q.sqlQuery === 'string' &&
        typeof q.queryExplanation === 'string' &&
        ['text', 'table', 'bar chart', 'line chart', 'pie chart', 'scatter plot', 'heatmap'].includes(q.type) &&
        (!q.chartDetails || (
            typeof q.chartDetails.xLabel === 'string' &&
            typeof q.chartDetails.yLabel === 'string' &&
            typeof q.chartDetails.title === 'string'
        ))
        ) &&
        Array.isArray(r.primaryKey) &&
        r.primaryKey.every(k => typeof k === 'string')
    );
}


export async function POST(request: NextRequest)
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user)
        return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const { 
        projectId,
        chatHistory,
        notebookId,
        notebookEntryId,
        version
    } = await request.json() as {
        projectId: string;
        chatHistory: NotebookEntry[];
        notebookId: string;
        notebookEntryId: string;
        version: number;
    };

    if (!projectId || chatHistory === undefined || !notebookId || !notebookEntryId || version === undefined)
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (!project) 
    {
        console.log('Project not found with id::', projectId);
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

    console.log(chatHistory.map(x => x.userPrompt));

    const managementSupabase = new SupabaseManagementAPI({ accessToken: token.accessToken });
    // Fetch the database schema so that we have the latest version of the database.
    const schemasResult = await managementSupabase.runQuery(project.projectId, 'SELECT schema_name FROM information_schema.schemata');
    const schemas = (schemasResult as unknown as { schema_name: string }[])
        .map((row: { schema_name: string }) => row.schema_name)
        .filter((schema: string) => !schema.startsWith('pg_') && schema !== 'information_schema');

    const promiseChain: Promise<DatabaseSchemaStructure>[] = [];

    for (const schema of schemas)
    {
        promiseChain.push(getDatabaseTableStructure(managementSupabase, project.projectId, schema));
    }

    const schemaStructures = await Promise.all(promiseChain);
    const schema = schemaStructures;

    // non-blocking update to the database so that the schema is always up to date.
    const projectUpdateResult = supabase.from('projects').update({ databaseStructure: schemaStructures }).eq('id', project.id);

    const tools = [
        {
            type: 'function',
            function: {
                name: 'generate_sql_queries',
                description: 'Generates SQL queries based on a given database schema and user question. Returns multiple queries (when requested or needed) with their metadata.',
                parameters: {
                    type: 'object',
                    properties: {
                        queries: {
                            type: 'array',
                            description: 'Array of SQL queries with their metadata',
                            items: {
                                type: 'object',
                                required: ['sqlQuery', 'type', 'queryExplanation'],
                                properties: {
                                    sqlQuery: { 
                                        type: 'string',
                                        description: 'Valid PostgreSQL query'
                                    },
                                    type: { 
                                        type: 'string',
                                        enum: ['table', 'bar chart', 'line chart', 'pie chart', 'scatter plot', 'heatmap'],
                                        description: 'Recommended visualization type for this query'
                                    },
                                    queryExplanation: { 
                                        type: 'string',
                                        description: 'Brief explanation of what the query does'
                                    },
                                    chartDetails: {
                                        type: 'object',
                                        description: 'Chart metadata using exact column names from query',
                                        properties: {
                                            xLabel: { type: 'string' },
                                            yLabel: { type: 'string' },
                                            title: { type: 'string' }
                                        },
                                        required: ['xLabel', 'yLabel', 'title']
                                    }
                                }
                            }
                        },
                        primaryKey: {
                            type: 'array',
                            description: 'Primary key columns used in queries (e.g., ["public.profiles.id"])',
                            items: { type: 'string' }
                        }
                    },
                    required: ['queries', 'primaryKey']
                }
            }
        }
    ];

    const messages = [
        {
            role: 'system',
            content: `
            You are a PostgreSQL query generator that translates natural language into executable SQL queries. You can and should generate multiple queries when needed to fully address the user's LATEST PROMPT.
            WRITE SQL QUERIES BASED THAT SATISFIES THE USER'S PROMPT/REQUEST/QUESTION. Use the previous messages to understand the context and generate the SQL queries accordingly.
    
            Key Requirements:
            1. Generate valid, executable PostgreSQL queries
            2. Default schema is public unless specified otherwise
            3. Generate multiple independent queries when:
                - Different aspects of data need separate analysis
                - Complex operations can be broken down
                - Visualization requires different data structures
                - Multiple insights are needed from the same data
            4. Generate multiple queries when needed for providing different insights, use your best judgment
            5. Provide brief explanations for each query to help the user understand the purpose
            6. Make sure you satisfy the whole user prompt, not just partial. Break it up into multiple queries to guarantee full coverage.
                - If someone asks for multiple things to be done, make sure you address each one separately or (if possible/explicitly requested) together.
                - Do not ignore parts of the prompt when generating queries.
            7. Sometimes the user will mistype or not know all the relevant table/column names, so infer the best possible interpretation if there isn't a direct mapping
            with their phrasing (i.e "total sales" -> "SUM(sales.total)" or type actually being severity).
    
            Query Guidelines:
            - Wrap all identifiers in double quotes to handle camelCase
            - Avoid GROUP BY errors by using aliases consistently
            - Consider appropriate visualizations:
              * Bar charts: Category comparisons
              * Line charts: Time series
              * Tables: Detailed data
              * Pie/Radial: Proportions
              * Scatter plots: Relationships
            - The visualisation xLabel, yLabel must correspond to the column names in the query exactly, and the title should be descriptive
            - Any dates or timestamps should be formatted in a human-readable way
            - If you are unsure of the column names, use inferred names based on the query and the schema that you are provided below. Only reference 
            the schema correctly, do not make up your own names for tables, columns, etc. This will cause errors.
    
            Schema Structure:
            \`\`\`json
            ${JSON.stringify(schema, null, 2)}
            \`\`\`
    
            Constraints:
            - Read-only queries only (no modifications)
            - Optimize for performance using indexes and efficient joins
            - Handle NULL values and edge cases appropriately
            `
        },
        ...chatHistory.map(message =>
        {
            return {
                role: 'user',
                content: message.userPrompt
            };
        })
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
                if (toolCalls?.[0]) 
                {
                    const generatedResponse: SQLGeneratorResponse = JSON.parse(toolCalls[0].function.arguments);
                    console.log('Generated SQL response::', generatedResponse);
                
                    if (!isValidSQLResponse(generatedResponse)) 
                    {
                        console.error('Invalid response from SQL generator');
                        controller.enqueue('\n=====ERROR=====\nAn error occurred while generating the SQL queries\n=====END ERROR=====\n');
                        await new Promise(resolve => setTimeout(resolve, 250));
                        controller.close();
                        return;
                    }
                
                    const { queries } = generatedResponse;
                
                    // Store SQL queries
                    const { error: updateError } = await supabase
                        .from('notebook_entries')
                        .update({ sqlQueries: queries.map(query => query.sqlQuery) })
                        .eq('id', notebookEntryId);
                
                    if (updateError) 
                    {
                        console.error(updateError);
                        controller.enqueue('\n=====ERROR=====\nAn error occurred while saving the SQL queries\n=====END ERROR=====\n');
                        await new Promise(resolve => setTimeout(resolve, 250));
                    }

                    const notebookOutputs: NotebookEntryOutput[] = [];
                
                    for (const query of queries) 
                    {
                        controller.enqueue(`\n\n=====SQL QUERY=====\n${query.sqlQuery}\n=====END SQL QUERY=====\n`);
                        await new Promise(resolve => setTimeout(resolve, 250));
                
                        try 
                        {
                            const result = await managementSupabase.runQuery(
                                project.projectId, 
                                query.sqlQuery
                            );
                
                            // Output query explanation
                            controller.enqueue(`\n=====TEXT=====\n${query.queryExplanation}\n=====END TEXT=====\n`);
                            await new Promise(resolve => setTimeout(resolve, 250));
                            
                            // Handle the single type with chart details if present
                            if (query.type.includes('chart') && query.chartDetails) 
                            {
                                const chartData = {
                                    ...query.chartDetails,
                                    data: result
                                };
                
                                console.log('Type:', query.type, 'is being sent to the client');
                                controller.enqueue(`\n=====${query.type.toUpperCase()}=====\n${JSON.stringify(chartData)}\n=====END ${query.type.toUpperCase()}=====\n`);
                                await new Promise(resolve => setTimeout(resolve, 250));
                            }
                            else 
                            {
                                console.log('Type:', query.type, 'is being sent to the client');
                                controller.enqueue(`\n=====${query.type.toUpperCase()}=====\n${JSON.stringify(result)}\n=====END ${query.type.toUpperCase()}=====\n`);
                                await new Promise(resolve => setTimeout(resolve, 250));
                            }

                            // push a new output to the notebookOutputs array
                            notebookOutputs.push({
                                version: 1,
                                chunks: [{
                                    type: query.type,
                                    content: query.type.includes('chart') ? JSON.stringify({
                                        xLabel: query.chartDetails?.xLabel,
                                        yLabel: query.chartDetails?.yLabel,
                                        title: query.chartDetails?.title,
                                        data: result
                                    }) : JSON.stringify(result)
                                }]
                            });
                        }
                        catch (error) 
                        {
                            if (isSupabaseError(error)) 
                            {
                                console.error(error.message);
                                controller.enqueue(`\n=====ERROR=====\n${error.message}\n=====END ERROR=====\n`);
                                await new Promise(resolve => setTimeout(resolve, 250));
                            }
                            else 
                            {
                                console.error(error);
                                controller.enqueue('\n=====ERROR=====\nAn error occurred while executing the query\n=====END ERROR=====\n');
                                await new Promise(resolve => setTimeout(resolve, 250));
                            }
                        }
                    }

                    // now we want to store these outputs in the database
                    const { error: outputError } = await supabase
                        .from('notebook_entries')
                        .update({ outputs: notebookOutputs })
                        .eq('id', notebookEntryId);

                    if (outputError)
                    {
                        console.error(outputError);
                        controller.enqueue('\n=====ERROR=====\nAn error occurred while saving the outputs\n=====END ERROR=====\n');
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
                await projectUpdateResult;
                controller.close();
            }
        },
    });

    return new Response(streamingResponse, { headers: { 'Content-Type': 'text/plain' }});
}