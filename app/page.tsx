import HomepageNavbar from '@/components/HomepageNavbar';
import Visualiser from '@/components/Visualiser';
// import Visualiser from '@/components/Visualiser';
import { createServerClient } from '@/utils/supabaseServer';
import { Button } from '@mantine/core';
import Link from 'next/link';


export default async function HomePage()
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;

    return <section className="flex-grow flex flex-col items-center gap-5 fade-in relative">
        <HomepageNavbar user={user} />
        <section className='flex flex-col w-full max-w-7xl gap-10 px-8'>
            <div className='flex flex-col gap-5 items-center text-center mt-24'>
                <h1>
                    Visualise your Supabase project&apos;s database and use natural language to query it.
                </h1>
                <h3>
                    We are currently in alpha, so expect bugs and missing features.
                </h3>
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
            </div>
            {/* <div className='flex flex-col gap-5 mt-24 w-full'>
                <h2 className='arial-black'>
                    Features - Title Description Here
                </h2>
            </div>
            <div className='flex flex-col gap-5 mt-24 w-full'>
                <h2 className='arial-black'>
                    Use Cases - Title Description Here
                </h2>
            </div>
            <div className='flex flex-col gap-5 mt-24 w-full'>
                <h2 className='arial-black'>
                    Data & Security - Title Description Here
                </h2>
            </div>
            <div className='flex flex-col gap-5 mt-24 w-full'>
                <h2 className='arial-black'>
                    Pricing - Title Description Here
                </h2>
            </div> */}
        </section>
        <Visualiser />
    </section>;
}