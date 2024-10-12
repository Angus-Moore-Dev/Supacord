'use client';

import { Button, Input } from '@mantine/core';
import SupacordLogo from '@/public/supacord_text.png';
import Supacord from '@/public/supacord_logo_transparent.png';
import Image from 'next/image';
// import Visualiser from '@/components/Visualiser';
import { useState } from 'react';
import { createBrowserClient } from '@/utils/supabaseBrowser';
import { useRouter } from 'next/navigation';



export default function AuthPage()
{
    const router = useRouter();
    const supabase = createBrowserClient();
    // const [width, setWidth] = useState(0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningIn, setIsSigningIn] = useState(false);

    async function signIn()
    {
        if (email && password)
        {
            setIsSigningIn(true);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error)
            {
                console.error(error);
            }

            router.push('/app');
            setIsSigningIn(false);
        }
    }


    // useEffect(() => 
    // {
    //     setWidth(document.getElementById('visualiser-example')?.clientWidth ?? 900);
    // }, []);


    return <section className="flex-grow flex max-w-[100vw]">
        <div className="w-full min-w-[576px] md:max-w-xl bg-[#1a1a1a] text-white p-8 flex flex-col gap-5 items-center justify-center border-r-[1px]">
            <div className='flex gap-3 items-center'>
                <Image src={Supacord} alt='Supacord' width={60} height={60} />
                <Image src={SupacordLogo} alt='Supacord' width={250} height={60} />
            </div>
            <Input.Wrapper label="Email" className='w-full'>
                <Input
                    disabled={isSigningIn}
                    placeholder="Email"
                    type="email"
                    size='lg'
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                />
            </Input.Wrapper>
            <Input.Wrapper label="Password" className='w-full'>
                <Input
                    disabled={isSigningIn}
                    placeholder="Password"
                    type="password"
                    size='lg'
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                />
            </Input.Wrapper>
            <Button variant='white' className='ml-auto' onClick={signIn} loading={isSigningIn}>
                Sign In
            </Button>
        </div>
        <div id='visualiser-example' className='flex-grow'>
            {/* <Visualiser width={width} /> */}
        </div>
    </section>;
}