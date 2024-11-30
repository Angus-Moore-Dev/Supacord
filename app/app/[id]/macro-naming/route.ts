import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION
});


export async function POST(request: NextRequest)
{
    const supabase = createServerClient();
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user)
    {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const titleRequest = await request.json() as {
        sqlQuery: string;
        explanation: string;
    }[];

    if (!titleRequest || titleRequest.length === 0)
    {
        return NextResponse.json({ error: 'No SQL queries provided' }, { status: 400 });
    }


    // generate the title, in less than 15 words.
    const titleResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            {
                role: 'system',
                content: `
                    You are an expert SQL query analyser.
                    You are given a SQL query and an explanation of what the query does.
                    You need to generate a title for a macro that summarises the query and its purpose.
                    The title must be no more than 15 words.

                    It is used to help a user understand the purpose of the macro.
                `
            },
            {
                role: 'user',
                content: `Here are the SQL queries and explanations: ${titleRequest.map(query => `#${query.sqlQuery}\n${query.explanation}`).join('\n\n')}
                `
            }
        ],
        temperature: 0.5,
        max_tokens: 15
    });

    return NextResponse.json({ title: titleResponse.choices[0].message.content });
}