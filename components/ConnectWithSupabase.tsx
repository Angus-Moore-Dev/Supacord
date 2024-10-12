'use client';
import ConnectButton from '@/public/connect_supabase.svg';
import Image from 'next/image';


export default function ConnectWithSupabase()
{
    
    async function connect()
    {
        const result = await fetch('/oauth/supabase');
        const data = await result.json();

        if (data.error)
            console.error(data.error);

        window.location.href = data.url;
    }


    return <button onClick={connect}>
        <Image src={ConnectButton} alt='Connect Supabase' priority quality={100} />
    </button>;
}