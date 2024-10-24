import { NextRequest, NextResponse } from 'next/server';



export async function POST(request: NextRequest)
{
    // we can use the request object to understand what IDs we need to search for under which schema.table_name.primaryKey
    /*
    [
        {
            "primaryKey": "public.post.id",
            "ids": [
                '[id]',
                '[id]',
                '[id]',
                '[id]',
                '[id]',
                '[id]',
            ]
        },
        {
            "primaryKey": "public.post.id",
            "ids": [
                '[id]',
                '[id]',
                '[id]',
                '[id]',
                '[id]',
                '[id]',
            ]
        },
        {
            "primaryKey": "public.post.id",
            "ids": [
                '[id]',
                '[id]',
                '[id]',
                '[id]',
                '[id]',
                '[id]',
            ]
        },
    ]
    */

    console.log(await request.json());

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}