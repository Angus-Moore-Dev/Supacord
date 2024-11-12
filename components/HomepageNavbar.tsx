'use client';
import SupacordLogo from '@/public/supacord_logo_transparent.png';
import Supacord from '@/public/supacord_text.png';
import Image from 'next/image';
import { User } from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@mantine/core';

interface HomepageNavbarProps
{
    user: User | null;
}

export default function HomepageNavbar({ user }: HomepageNavbarProps)
{
    const navRef = useRef<HTMLDivElement>(null);


    useEffect(() => 
    {
        // when the scroll is greater than 0, add the classname bg-neutral-900 and border-b-[1px] border-b-neutral-700
        // otherwise remove the classname
        const handleScroll = () => 
        {
            if (window.scrollY > 0) 
            {
                if (navRef.current)
                {
                    navRef.current.classList.add('border-b-[1px]', 'bg-neutral-900', 'h-[80px]');
                    navRef.current.classList.remove('h-[100px]');
                }
            }
            else 
            {
                if (navRef.current)
                {
                    navRef.current.classList.remove('border-b-[1px]', 'bg-neutral-900', 'h-[80px]');
                    navRef.current.classList.add('h-[100px]');
                }
            }
        };

        // add the event listener
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return <nav ref={navRef} className='w-full flex flex-row gap-3 items-center justify-center py-6 border-b-neutral-700 fixed transition top-0 z-50 h-[100px]'
        style={{ transition: 'all 0.3s ease-in-out' }}
    >
        {/* <Image src={SupacordBanner} alt='Supacord' width={200} height={60} /> */}
        <div className='w-full flex max-w-7xl items-center gap-3 px-16'>
            <Image src={SupacordLogo} alt='Supacord' width={40} height={40} />
            <Image src={Supacord} alt='Supacord' width={150} height={40} />
            <section className='ml-16 flex gap-5 items-center'>
                {/* Will have clickables down to the section that points to the CTAs */}
            </section>
            <section className='ml-auto flex gap-5 items-center'>
                {/* {
                    !user &&
                    <Link href='/auth' className='h-fit'>
                        <Button variant='white'>
                            Join The Alpha Now
                        </Button>
                    </Link>
                } */}
                {
                    user &&
                    <>
                        <Link href='/app'>
                            <Button>
                                Go To App &rarr;
                            </Button>
                        </Link>
                    </>
                }
            </section>
        </div>
    </nav>;
}
