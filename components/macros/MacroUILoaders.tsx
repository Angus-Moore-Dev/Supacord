'use client';

import { Skeleton } from '@mantine/core';

export default function LargeMacroUILoader()
{
    return <div className='flex flex-col gap-3 p-4 bg-[#0e0e0e] rounded-lg'>
        <Skeleton height={40} width={'100%'} />
        <div className='flex flex-col gap-3 p-4 bg-[#1e1e1e] rounded-lg'>
            <Skeleton height={40} width={'100%'} />
            <Skeleton height={40} width={'100%'} />
            <Skeleton height={40} width={'100%'} />
            <Skeleton height={40} width={'100%'} />
        </div>
        <div className='flex gap-3 p-4 bg-[#1e1e1e] rounded-lg  items-end h-[350px]'>
            <Skeleton width={'20%'} height={'60%'} />
            <Skeleton width={'20%'} height={'88%'} />
            <Skeleton width={'20%'} height={'25%'} />
            <Skeleton width={'20%'} height={'100%'} />
            <Skeleton width={'20%'} height={'40%'} />
        </div>
    </div>;
}