import { createServerClient } from '@/utils/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION
});

export async function POST(request: NextRequest)
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user)
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const {
        projectId,
        notebookId,
        userPrompt
    } = await request.json() as {
        projectId: string;
        notebookId: string;
        userPrompt: string;
    };

    if (!projectId || !notebookId || !userPrompt)
        return NextResponse.json({ error: 'Missing projectId or notebookId' }, { status: 400 });

    // now we want to automatically generate a title for this notebook based off the user prompt

    const { error } = await supabase
        .from('notebooks')
        .select('id')
        .eq('id', notebookId)
        .single();

    if (error)
    {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch notebook', reason: error.message }, { status: 500 });
    }

    try
    {
        const result = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are an agent tasked with writing concise titles for a notebook. You are to come up with a title based on the first user prompt in a scientific
                    notebook in 7 words or less. You must not exceed 7 words. You will take in the user's prompt and generate a title based on that.`
                },
                {
                    role: 'user',
                    'content': userPrompt
                }
            ]
        });
    
        const title = result.choices[0].message.content;
        if (!title)
            return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 });

        const { error: updateError } = await supabase
            .from('notebooks')
            .update({ title: title })
            .eq('id', notebookId);

        if (updateError)
        {
            console.error(updateError);
            return NextResponse.json({ error: 'Failed to update notebook title', reason: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ title });
    }
    catch (error)
    {
        console.error(error);
        return NextResponse.json({ error: 'Failed to generate title', reason: JSON.stringify(error) }, { status: 500 });
    }
}