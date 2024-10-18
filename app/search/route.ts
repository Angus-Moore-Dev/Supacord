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
                description: 'Generates SQL queries based on a given database schema and user question',
                parameters: {
                    type: 'object',
                    properties: {
                        schema: {
                            type: 'object',
                            description: 'JSON object representing the database schema'
                        },
                        user_question: {
                            type: 'string',
                            description: 'The user\'s question or request for database information'
                        }
                    },
                    required: ['schema', 'user_question']
                }
            }
        }
    ];

    const messages = [
        {
            role: 'system',
            content: `You are an advanced SQL query generator for PostgreSQL databases. Your primary function is to generate diagnostic and easily understandable SQL queries based on user questions and a provided database schema. Always wrap column and table names in double quotes to handle camelCase names.
            Generate multiple queries if necessary to satisfy the user's request. Only retrieve relevant columns unless all columns are specifically needed. Use functions and views from the schema when appropriate. For text/number columns that appear to be enums, investigate all possible values before writing your query.
        
            If the user references non-existent tables or makes typos, infer their intent if possible. Otherwise, list the available columns and ask for clarification.
        
            Your response should be valid PostgreSQL queries only. Do not include explanations or additional text.
            all schemas, tables and columns must have double quotes around them, like "public"."profiles"."name" for instance.
        
            If multiple queries are needed, start your response with "MULTIPLE QUERIES" on a separate line.
        
            Example response formats:
            \`\`\`sql
            SELECT "name", "email" FROM "users" WHERE "id" = '123';
            \`\`\`
        
            Or for multiple queries:
            MULTIPLE QUERIES
            \`\`\`sql
            SELECT "name", "email" FROM "users" WHERE "id" = '123';
            SELECT "orderDate", "total" FROM "orders" WHERE "userId" = '123';
            \`\`\`

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
            content: message.content
        }))
    ];

    //@ts-expect-error - stream is not in the types
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
        stream: true
    });

    let fullMessage: string = '';

    const streamingResponse = new ReadableStream({
        async start(controller) 
        {
            if (chatHistory.length > 0)
                controller.enqueue('\n\n');

            let sqlQuery = '';
            for await (const chunk of response) 
            {
                if (chunk.choices[0]?.delta?.function_call?.arguments) 
                {
                    const args = JSON.parse(chunk.choices[0].delta.function_call.arguments);
                    if (args.user_question) 
                    {
                        sqlQuery += args.user_question;
                        controller.enqueue(args.user_question);
                        fullMessage += args.user_question;
                    }
                }
                else if (chunk.choices[0]?.delta?.content) 
                {
                    const text = chunk.choices[0].delta.content;
                    controller.enqueue(text);
                    sqlQuery += text;
                    fullMessage += text;
                }
            }

            try 
            {
                console.log(sqlQuery);

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
                        fullMessage += '\n\n===EXECUTING QUERY===\n\n';
                        const result = await managementSupabase.runQuery(project.projectId, query);
                        if (Array.isArray(result) && result.length > 0) 
                        {
                            const markdownTable = convertToMarkdownTable(result);
                            controller.enqueue(markdownTable);
                            fullMessage += markdownTable;
                        }
                        else 
                        {
                            controller.enqueue('No results found.');
                            fullMessage += 'No results found.';
                        }
                    }
                }
                else 
                {
                    controller.enqueue('\n\n===EXECUTING QUERY===\n\n');
                    fullMessage += '\n\n===EXECUTING QUERY===\n\n';

                    const result = await managementSupabase.runQuery(project.projectId, sqlQuery
                        .replaceAll('MULTIPLE QUERIES', '')
                        .replaceAll('```sql', '')
                        .replaceAll('```', '')
                    );
                
                    if (Array.isArray(result) && result.length > 0) 
                    {
                        const markdownTable = convertToMarkdownTable(result);
                        controller.enqueue(markdownTable);
                        fullMessage += markdownTable;
                    }
                    else 
                    {
                        controller.enqueue('No results found.');
                        fullMessage += 'No results found.';
                    }
                }
            }
            catch (error) 
            {
                controller.enqueue(`Error executing query: ${error instanceof Error ? error.message : 'Unknown error'}`);
                fullMessage += `Error executing query: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }

            console.log(fullMessage);
            controller.close();
        },
    });

    console.log(fullMessage);

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