import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest)
{
    console.log(request);
    return NextResponse.json({ message: 'Hello' });
}