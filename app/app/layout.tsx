import '@mantine/code-highlight/styles.css';
import SupacordLogo from '@/public/supacord_text.png';
import SupacordIcon from '@/public/supacord_logo_transparent.png';
import { createServerClient } from '@/utils/supabaseServer';
import { Button } from '@mantine/core';
import { User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';



export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>)
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;
    let profileName = '';
    if (user)
    {
        const { data: profile } = await supabase.from('profiles').select().eq('id', user.id).single();
        profileName = profile ? `${profile?.firstName} ${profile?.lastName}` : 'My Account';
    }
    else
        profileName = 'My Account';

    return <div className="flex-grow flex flex-col">
        <nav className="w-full h-[60px] bg-neutral-900 border-b-[1px] border-neutral-700 flex items-center gap-5 px-8 md:px-16">
            <Link href='/app' className='flex gap-3 items-center'>
                <Image src={SupacordIcon} alt='Supacord' width={35} height={40} quality={100} />
                <Image src={SupacordLogo} alt='Supacord' width={150} height={60} quality={100} />
            </Link>
            <Link href='/app/projects' className='ml-16'>
                <Button variant='subtle'>
                    Projects
                </Button>
            </Link>
            <Link href='/app/account' className='ml-auto'>
                <Button leftSection={<User size={20} />} variant='subtle'>
                    {profileName}
                </Button>
            </Link>
        </nav>
        {children}
    </div>;
}