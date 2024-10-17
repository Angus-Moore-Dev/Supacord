// import accessTokenRefresher from '@/utils/accessTokenRefresher';
import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION,
});

export async function POST(request: NextRequest)
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;

    if (!user)
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });

    const { projectId, searchQuery } = await request.json();
    if (!projectId || !searchQuery)
        return NextResponse.json({ error: 'Missing projectId or searchQuery' }, { status: 400 });

    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (!project)
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    // now we want to generate an SQL query based on the search query.

    try
    {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are an SQL query generator. You will be given a JSON structure of the schema ${project.selectedSchema} to generate an SQL query based on the search query provided by the user.
                    An example may be, "Please give me all of the investors that were part of the investment with ID of 202410210". That example would require 3-4 different tables to be interacted with, which you 
                    are provided with in the JSON structure below.
                    YOU ARE TO ONLY OUTPUT SQL QUERIES THAT ARE VALID TO THE SCHEMA. DO NOT DO ANYTHING ELSE, ONLY OUTPUT SQL QUERIES FOR A POSTGRESQL DATABASE.
                    DO NOT OUTPUT IN MARKDOWN. ONLY OUTPUT IN SOMETHING THAT COULD BE PUT STRAIGHT INTO A DATABASE.
                    
                    For any column or table that is written in camelCase, wrap it in "double quotes" so that it can be recognised (for instance, profile."profilePictureURL"). 
                    
                    The schema structure is as follows:
                    ${JSON.stringify(project.databaseStructure, null, 4)}`
                },
                {
                    role: 'user',
                    content: searchQuery
                }
            ]
        });

        const result = response.choices[0].message.content;

        console.log('Generated SQL query:', result);

        return NextResponse.json({ query: result });
    }
    catch (error)
    {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}