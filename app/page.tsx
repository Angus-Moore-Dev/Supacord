import Visualiser from '@/components/Visualiser';
import SupacordBanner from '@/public/supacord_banner.png';
import { createServerClient } from '@/utils/supabaseServer';
import { Button } from '@mantine/core';
import Image from 'next/image';
import Link from 'next/link';


export default async function HomePage()
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;

    return <section className="flex-grow flex flex-col items-center gap-5 p-8 fade-in">
        <Image src={SupacordBanner} alt="Supacord Banner" width={1736} height={411} className='fade-in' />
        <div className='flex flex-col gap-3 items-center text-center'>
            <h1>
				Visualise your Supabase project&apos;s database and use natural language to query it.
            </h1>
            <h3>
				We are currently in alpha, so expect bugs and missing features.
            </h3>
        </div>
        <p>
			Supacord is an open-source platform, please checkout out <Link href='https://github.com/Angus-Moore-Dev/Supacord/' target='_blank' className='text-blue-500 hover:text-blue-400 underline'>
				our GitHub.
            </Link>
        </p>
        {
            !user &&
			<Link href='/auth'>
			    <Button size='lg' variant='white'>
                    Join The Alpha Now
			    </Button>
			</Link>
        }
        <Visualiser />
    </section>;
}