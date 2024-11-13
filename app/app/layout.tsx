import SupacordLogo from '@/public/supacord_text.png';
import { Button } from '@mantine/core';
import { User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';



export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>)
{
    return <div className="flex-grow flex flex-col">
        <nav className="w-full h-[60px] bg-neutral-900 border-b-[1px] border-neutral-700 flex items-center gap-5 px-8 md:px-16">
            <Link href='/app'>
                <Image src={SupacordLogo} alt='Supacord' width={150} height={60} />
            </Link>
            <Link href='/app/projects' className='ml-16'>
                <Button variant='subtle'>
                    Projects
                </Button>
            </Link>
            <Link href='/app/account' className='ml-auto'>
                <Button leftSection={<User size={20} />} variant='subtle'>
                    My Account
                </Button>
            </Link>
        </nav>
        {children}
    </div>;
}