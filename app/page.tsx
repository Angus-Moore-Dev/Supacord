import ConnectWithSupabase from '@/components/ConnectWithSupabase';
import HomepageNavbar from '@/components/HomepageNavbar';
import { createServerClient } from '@/utils/supabaseServer';
import { Button } from '@mantine/core';
import Link from 'next/link';


export default async function HomePage()
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;

    return <section className="flex-grow flex flex-col items-center gap-5 fade-in relative">
        <HomepageNavbar user={user} />
        <section className='flex flex-col w-full max-w-7xl gap-10 px-8 mb-24'>
            <div className='flex flex-col gap-5 items-center text-center my-12'>
                <h1 className='font-extrabold text-5xl max-w-4xl text-center'>
                    Your <span className='
                        bg-gradient-to-r from-[#38bc81] to-[#65d9a5] text-transparent bg-clip-text
                    '>Supabase</span> Project in a 3D Universe with Natural Language Queries.
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
                <ConnectWithSupabase />
            </div>
            <div className='min-h-screen flex flex-col gap-5 pt-24 w-full' id='homepage-features'>
                <h2 className='arial-black text-3xl'>
                    Features - Title Description Here
                </h2>
            </div>
            <div className='min-h-screen flex flex-col gap-5 pt-24 w-full' id='homepage-usecases'>
                <h2 className='arial-black text-3xl'>
                    Use Cases - Title Description Here
                </h2>
            </div>
            <div className='min-h-screen flex flex-col gap-5 pt-24 w-full' id='homepage-datasecurity'>
                <h2 className='arial-black text-3xl'>
                    Data & Security - Title Description Here
                </h2>
            </div>
            <div className='min-h-screen flex flex-col gap-5 pt-24 w-full' id='homepage-pricing'>
                <h2 className='arial-black text-3xl'>
                    Pricing - Title Description Here
                </h2>
            </div>
        </section>
    </section>;
}