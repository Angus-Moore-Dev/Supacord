/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { SupabaseManagementAPI } from 'supabase-management-js';
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
                description: 'Generates SQL queries based on a given database schema and user question. ONLY OUTPUT A VALID SQL STATEMENT',
                parameters: {
                    type: 'object',
                    properties: {
                        sqlQuery: {
                            type: 'string',
                            description: 'The SQL query to be executed against the postgresql database using the schema provided'
                        },
                    },
                    required: ['sqlQuery']
                }
            }
        }
    ];

    const messages = [
        {
            role: 'system',
            content: `You are an advanced SQL query generator for PostgreSQL databases. Your primary function is to generate diagnostic and easily understandable SQL queries based on user questions and a provided database schema. Always wrap column and table names in double quotes to handle camelCase names.
            Generate multiple queries if necessary to satisfy the user's request. Only retrieve relevant columns unless all columns are specifically needed. Use functions and views from the schema when appropriate. For text/number columns that appear to be enums, investigate all possible values before writing your query.
        
            If the user references tables/columns that are non-existant or are close (such as profile picture being "profilePictureURL" or log type "severity"), then use your best judgement to generate the query. If the user's question is ambiguous, ask for clarification.
            If a column is a text field and you need to use it as an enum or something, then add to your query a way to get the distinct values from that first. For example
            the user might ask "How many types of each type happened in the changelog in the past 24 hours?". In this case, you need to get the severity column,
            get the distinct values from it and then count how many of each type happened in the past 24 hours. This is just an example, but you get the idea.

            Here is the schema for the database in JSON format. It contains a schema, views, materialized views, and functions,
            all designed to help you write the most effective SQL queries in line with the user's request. Please use 
            functions, views and materialized views where appropriate, otherwise use the schema property to generate the SQL queries,
            as it contains table information, including column names, their types, foreign key relations etc.

            START OF SCHEMA:
            ${JSON.stringify(schema, null, 2)}
            END OF SCHEMA
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
    });

    const streamingResponse = new ReadableStream({
        async start(controller) 
        {
            if (chatHistory.length > 0)
                controller.enqueue('\n\n');

            const toolCalls = response.choices[0].message.tool_calls;
            if (!toolCalls || toolCalls.length === 0)
            {
                controller.enqueue('OpenAI did not work as expected. Please try again later.');
                controller.close();
                return;
            }

            const { sqlQuery } = JSON.parse(toolCalls[0].function.arguments) as { sqlQuery: string };

            try 
            {
                console.log('Executing query:', sqlQuery);
                controller.enqueue(`\`\`\`sql\n${sqlQuery}\n\`\`\``);

                if (sqlQuery.startsWith('MULTIPLE QUERIES')) 
                {
                    const queries = sqlQuery.replaceAll('MULTIPLE QUERIES', '').split('\n\n').map(query => query
                        .trim()
                        .replaceAll('MULTIPLE QUERIES', '')
                        .replaceAll('```sql', '')
                        .replaceAll('```', '')
                    ).filter(Boolean);

                    for (const query of queries) 
                    {
                        console.log('Executing query:', query);
                        controller.enqueue('\n\n===EXECUTING QUERY===\n\n');
                        const result = await managementSupabase.runQuery(project.projectId, query);
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
                else 
                {
                    controller.enqueue('\n\n===EXECUTING QUERY===\n\n');

                    const result = await managementSupabase.runQuery(project.projectId, sqlQuery
                        .replaceAll('MULTIPLE QUERIES', '')
                        .replaceAll('```sql', '')
                        .replaceAll('```', '')
                    );
                
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
                controller.enqueue(`Error executing query: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            controller.close();
        },
    });


    return new Response(streamingResponse, { headers: { 'Content-Type': 'text/plain' }});
}

function convertToMarkdownTable(data: Record<string, any>[]): string 
{
    if (!data || data.length === 0) return 'No results found.';

    const headers = Object.keys(data[0]);
    let markdownTable = `| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n`;

    for (const row of data) 
    {
        markdownTable += `| ${headers.map(header => row[header] !== null && row[header] !== undefined ? String(row[header]) : '').join(' | ')} |\n`;
    }

    return `${markdownTable}\n\n`;
}