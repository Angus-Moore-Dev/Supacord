'use client';
import ConnectButton from '@/public/connect_supabase.svg';
import Image from 'next/image';


export default function ConnectWithSupabase()
{
    return <button>
        <Image src={ConnectButton} alt='Connect Supabase' priority quality={100} />
    </button>;
}