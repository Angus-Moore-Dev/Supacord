'use client';

import { Select, Skeleton } from '@mantine/core';
// import { useRouter } from 'next/navigation';
// import { useState } from 'react';


export default function NewProjectImport()
{
    // const router = useRouter();
    // const [isLoading, setIsLoading] = useState(true);

    return <div className="flex flex-col gap-5">
        <h1>
            Import A New Project
        </h1>
        <Skeleton w={300} h={40} />
        <Select size='md' label='Select Organisation' placeholder='Select Organisation' className='max-w-[300px]' />
    </div>;
}