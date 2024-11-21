'use client';

import { Profile } from '@/lib/global.types';
import { Tabs } from '@mantine/core';


interface ProfileUIProps
{
    profile: Profile;
}

export default function ProfileUI({ profile }: ProfileUIProps)
{
    return <div className="flex flex-col items-center justify-center gap-10 mx-auto w-full flex-grow">
        <Tabs orientation='vertical' variant='pills' defaultValue={'Profile'} className='w-full h-full max-w-2xl flex-grow border-r-[1px] border-neutral-700'>
            <Tabs.List w={250} className='bg-[#0e0e0e] w-full border-r-[1px] border-neutral-700'>
                <Tabs.Tab value={'Profile'}>
                    Profile
                </Tabs.Tab>
                <Tabs.Tab value={'Projects'}>
                    Projects
                </Tabs.Tab>
                <Tabs.Tab value={'Settings'}>
                    Settings
                </Tabs.Tab>
                <Tabs.Tab value={'Security'}>
                    Security
                </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value={'Profile'} className='p-4 w-full max-h-[calc(100vh-60px-64px)] overflow-y-auto'>
                {profile.firstName} {profile.lastName}
            </Tabs.Panel>
            <Tabs.Panel value={'Projects'} className='p-4 w-full max-h-[calc(100vh-60px-64px)] overflow-y-auto'>
                Projects Panel
            </Tabs.Panel>
            <Tabs.Panel value={'Settings'} className='p-4 w-full max-h-[calc(100vh-60px-64px)] overflow-y-auto'>
                Settings Panel
            </Tabs.Panel>
            <Tabs.Panel value={'Security'} className='p-4 w-full max-h-[calc(100vh-60px-64px)] overflow-y-auto'>
                Security Panel
            </Tabs.Panel>
        </Tabs>
    </div>;
}