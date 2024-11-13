'use client';

import { createBrowserClient } from '@/utils/supabaseBrowser';
import { Button, Input } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';



export default function WaitlistForm()
{
    const supabase = createBrowserClient();
    const [hasFilledOutAlready, setHasFilledOutAlready] = useState(false);
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);


    async function joinWaitlist()
    {
        if (isSubmitting || !email)
        {
            return;
        }

        setIsSubmitting(true);
        setHasFilledOutAlready(false);

        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) 
        {
            throw new Error('Failed to fetch country data');
        }
        const data = await response.json() as {
            country_name: string,
            region: string,
            city: string,
        };

        const { error } = await supabase
            .from('waitlist_emails')
            .insert({
                email,
                location: `${data.city}, ${data.region}, ${data.country_name}`
            });

        if (error)
        {
            if (error.code === '23505')
            {
                notifications.show({ message: 'You have already joined the waitlist!', color: 'red', variant: 'filled' });
                setHasFilledOutAlready(true);
            }
            else
                notifications.show({ message: 'There was an error submitting your waitlist form, please try again!', color: 'red', variant: 'filled' });
            
            console.error(error);
            setIsSubmitting(false);
            return;
        }

        setHasFilledOutAlready(true);
        localStorage.setItem('submitted-email', email);
        notifications.show({ message: 'Thank you for joining the waitlist!', color: 'green', variant: 'filled' });
        setIsSubmitting(false);
    }


    useEffect(() => 
    {
        if (localStorage.getItem('submitted-email'))
        {
            setHasFilledOutAlready(true);
        }
    }, []);


    return <div className="flex flex-col gap-3 w-full lg:w-1/2">
        <Input
            disabled={isSubmitting}
            size="lg"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className='w-full'
            placeholder='Enter your email address'
            onKeyDown={e => e.key === 'Enter' && joinWaitlist()}
        />
        <Button disabled={isSubmitting} fullWidth={false} className='max-w-fit ml-auto' onClick={joinWaitlist}>
            Join The Waitlist!
        </Button>
        {
            hasFilledOutAlready && <b className='text-right text-green-400'>
                Thank you for joining our waitlist!
            </b>
        }
    </div>;
}