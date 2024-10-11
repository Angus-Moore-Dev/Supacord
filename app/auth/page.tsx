'use client';

import { Input } from '@mantine/core';
import SupacordLogo from '@/public/supacord_text.png';
import Supacord from '@/public/supacord_logo_transparent.png';
import Image from 'next/image';
import Visualiser from '@/components/Visualiser';
import { useEffect, useState } from 'react';



export default function AuthPage()
{
    const [width, setWidth] = useState(0);

    useEffect(() => 
    {
        setWidth(document.getElementById('visualiser-example')?.clientWidth ?? 900);
    }, []);

    return <section className="flex-grow flex max-w-[100vw]">
        <div className="w-full min-w-[576px] md:max-w-xl bg-[#1a1a1a] text-white p-8 flex flex-col gap-5 items-center justify-center border-r-[1px]">
            <div className='flex gap-3 items-center'>
                <Image src={Supacord} alt='Supacord' width={60} height={60} />
                <Image src={SupacordLogo} alt='Supacord' width={250} height={60} />
            </div>
            <Input.Wrapper label="Email" className='w-full'>
                <Input
                    placeholder="Email"
                    type="email"
                    size='lg'
                />
            </Input.Wrapper>
            <Input.Wrapper label="Password" className='w-full'>
                <Input
                    placeholder="Password"
                    type="password"
                    size='lg'
                />
            </Input.Wrapper>
        </div>
        <div id='visualiser-example' className='flex-grow'>
            <Visualiser width={width} />
        </div>
    </section>;
}