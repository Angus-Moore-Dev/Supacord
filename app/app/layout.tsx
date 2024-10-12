import SupacordLogo from '@/public/supacord_logo_transparent.png';
import { Button } from '@mantine/core';
import Image from 'next/image';
import Link from 'next/link';



export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>)
{
    return <div className="flex-grow flex flex-col">
        <nav className="
            w-full h-[80px] bg-neutral-900 border-b-[1px] border-neutral-700 flex items-center gap-5
            px-8 md:px-16
        ">
            <Link href='/app'>
                <Image src={SupacordLogo} alt='Supacord' width={60} height={60} />
            </Link>
            <Link href='/app/projects' className='ml-16'>
                <Button>
                    Projects
                </Button>
            </Link>
            <Link href='/app/projects'>
                <Button>
                    Projects
                </Button>
            </Link>
        </nav>
        {children}
    </div>;
}