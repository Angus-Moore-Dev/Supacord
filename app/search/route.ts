/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest } from 'next/server';
import { OpenAI } from 'openai';
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

    const { projectId, searchQuery, chatHistory } = await request.json();
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

    const openAIStream = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0,
        messages: [
            {
                role: 'system',
                content: `You are an SQL queries generator. You are to help investigate questions that a user may have, particularly with understanding information within the database. 
                WRITE QUERIES THAT ARE DESIGNED TO BE EASILY UNDERSTOOD BY A HUMAN, DESIGNED TO BE DIAGNOSTIC AND EXECUTED IMMEDIATELY AFTER YOU WRITE IT (it will be piped straight into a database).
                WRITE MULTIPLE QUERIES IF YOU NEED TO DO SO TO SATISFY THIS REQUIREMENT.
                ONLY GET THE RELEVANT COLUMNS THAT ARE NEEDED FOR THE QUERY. DO NOT GET ALL COLUMNS UNLESS YOU BELIEVE IT'S NECESSARY.
                IF THE SCHEMA HAS FUNCTIONS OR VIEWS, YOU CAN USE THEM IN YOUR QUERY IF YOU BELIEVE IT WILL HELP.

                USE THE CONVERSATION HISTORY TO UNDERSTAND, BUT ONLY MAKE REFERENCE TO THE SQL THAT WAS WRITTEN, NOTHING SYNTATICALLY THAT WOULD FAIL IN AN SQL QUERY.

                DO NOT EXPLAIN OR ELABORATE ON THE QUERY. ONLY WRITE THE QUERY. DO NOT WRITE ANYTHING ELSE. GUARANTEE THAT THE COLUMNS OR QUERY YOU EXECUTE IS ACTUALLY POSSIBLE WITHIN POSTGRESQL.

                IF THERE IS A TEXT/NUMBER COLUMN THAT LOOKS LIKE AN ENUM, YOU SHOULD DO SOME INVESTIGATION BY FIGURING OUT WHAT ALL OF THE ENUM VALUES ARE AND THEN USING THAT INFORMATION TO WRITE YOUR QUERY.

                You will be given a JSON structure of the schema ${project.selectedSchema} to generate an SQL query based on the search query provided by the user.
                An example may be, "Please give me all of the investors that were part of the investment with ID of 202410210". That example would require 3-4 different tables to be interacted with, which you 
                are provided with in the JSON structure below.
                YOU ARE TO ONLY OUTPUT SQL QUERIES THAT ARE VALID TO THE SCHEMA. DO NOT DO ANYTHING ELSE, ONLY OUTPUT SQL QUERIES FOR A POSTGRESQL DATABASE.

                IF YOU NEED TO OUTPUT MULTIPLE QUERIES, START YOUR OUTPUT WITH MULTIPLE QUERIES.

                EXAMPLE
                \`\`\`sql
                SELECT "name", "email" FROM "users" WHERE "id" = '123';
                \`\`\`

                EXAMPLE 2
                MULTIPLE QUERIES
                \`\`\`sql
                SELECT "name", "email" FROM "users" WHERE "id" = '123';
                SELECT "name", "email" FROM "users" WHERE "id" = '456';
                \`\`\`

                \`\`\`sql
                SELECT "name", "email" FROM "users" WHERE "id" = '123';
                \`\`\`
                
                Any column used in your query must be wrapped in double quotes. For example, if you are selecting the "name" column from the "users" table, you would write SELECT "name" FROM "users".

                Finally, the user's query may reference tables that are not in the schema or may have a typo. If you can infer what the user meant, you can write a query that you believe the user meant to write.
                Otherwise, just list out the columns within the tables and ask the user to clarify.
                
                The schema structure is as follows in JSON format:
                ${JSON.stringify(project.databaseStructure)}`
            },
            ...chatHistory.map((message: { type: 'user' | 'ai', content: string }) => ({
                role: message.type === 'user' ? 'user' : 'assistant',
                content: message.content.replaceAll('\n\n===EXECUTING QUERY===\n\n', '').replaceAll('MULTIPLE QUERIES', '')
            }))
        ],
        stream: true
    });

    let fullMessage: string = '';

    const streamingResponse = new ReadableStream({
        async start(controller) 
        {

            if (chatHistory.length > 0)
                controller.enqueue('\n\n');

            let sqlQuery = '';
            for await (const chunk of openAIStream) 
            {
                const text = chunk.choices[0].delta?.content || '';
                controller.enqueue(text);
                sqlQuery += text;
                fullMessage += text;
            }


            try 
            {
                console.log(sqlQuery);

                if (sqlQuery.startsWith('MULTIPLE QUERIES')) 
                {
                    const queries = sqlQuery.replaceAll('MULTIPLE QUERIES', '').split('\n\n').map(query => query
                        .trim()
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
                // controller.enqueue(encoder.encode(`Error executing query: ${error instanceof Error ? error.message : 'Unknown error'}`));
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