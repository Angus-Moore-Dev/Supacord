import HomepageNavbar from '@/components/HomepageNavbar';
import { createServerClient } from '@/utils/supabaseServer';
import { Button } from '@mantine/core';
import { CornerLeftUp } from 'lucide-react';
import Link from 'next/link';

import Example1 from '@/public/homepage/example1.png';
import Example2 from '@/public/homepage/example2.png';
import Example3 from '@/public/homepage/example3.png';
import Example4 from '@/public/homepage/example4.png';
import Example5 from '@/public/homepage/example5.png';
import Image from 'next/image';



export default async function HomePage()
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;

    return <section className="flex-grow flex flex-col items-center gap-5 fade-in relative">
        <HomepageNavbar user={user} />
        <section className='flex flex-col w-full max-w-7xl gap-10 px-16 mt-[100px]'>
            <div className='flex flex-col gap-10 items-start my-24'>
                <h1 className='font-extrabold text-5xl max-w-4xl'>
                    Visualise Your <span className='underline text-supabase-green'><Link href='https://www.supabase.com' target='_blank'>Supabase</Link></span> Project in a 3D Universe.<small className='text-base text-neutral-400 font-normal'>&nbsp;&nbsp;&nbsp;Queryable With <b>SpaceQL!</b></small>
                </h1>
                <h3 className='max-w-2xl'>
                    Stop wasting time staring at UUIDs, writing massive SQL macros and being a monkey staring at a monolith. Embrace science-fiction technology.
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
                        <div className='flex gap-1 items-end mt-2'>
                            <CornerLeftUp size={24} /> <small>
                                Sign Up While It&apos;s Free!
                            </small>
                        </div>
                    </Link>
                }
                {
                    user &&
                    <Link href='/app'>
                        <Button size='lg' variant='white'>
                            Go To App &rarr;
                        </Button>
                    </Link>
                }
            </div>
            <div className="min-h-screen w-full flex flex-wrap justify-center items-center gap-5 relative" id="homepage-features">
                <div className="relative w-full group">
                    <Image
                        src={Example4}
                        alt="Example 4"
                        className="w-full rounded-xl shadow-lg transition-all duration-300 ease-in-out transform group-hover:scale-105 group-hover:z-10 border-4 border-white"
                    />
                </div>
                <div className="relative w-full -mt-16 ml-16 group">
                    <Image
                        src={Example1}
                        alt="Example 1"
                        className="w-full rounded-xl shadow-lg transition-all duration-300 ease-in-out transform group-hover:scale-105 group-hover:z-10 border-4 border-white"
                    />
                </div>
                <div className="relative w-full -mt-16 -ml-16 group">
                    <Image
                        src={Example2}
                        alt="Example 2"
                        className="w-full rounded-xl shadow-lg transition-all duration-300 ease-in-out transform group-hover:scale-105 group-hover:z-10 border-4 border-white bord"
                    />
                </div>
                <div className="relative w-full -mt-16 ml-16 group">
                    <Image
                        src={Example3}
                        alt="Example 3"
                        className="w-full rounded-xl shadow-lg transition-all duration-300 ease-in-out transform group-hover:scale-105 group-hover:z-10 border-4 border-white"
                    />
                </div>
                <div className="relative w-full -mt-16 -ml-16 group">
                    <Image
                        src={Example5}
                        alt="Example 5"
                        className="w-full rounded-xl shadow-lg transition-all duration-300 ease-in-out transform group-hover:scale-105 group-hover:z-10 border-4 border-white"
                    />
                </div>
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