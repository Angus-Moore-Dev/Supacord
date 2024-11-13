'use client';
import { Skeleton } from '@mantine/core';

export default function TableSkeleton()
{
    return <div className="flex-grow flex flex-col gap-3">
        {/* Skeleton in the shape of a table, thicker header and then 6 rows with 5 columns */}
        <div className='flex flex-row gap-1'>
            <Skeleton style={{ height: '4rem' }} />
            <Skeleton style={{ height: '4rem' }} />
            <Skeleton style={{ height: '4rem' }} />
            <Skeleton style={{ height: '4rem' }} />
            <Skeleton style={{ height: '4rem' }} />
        </div>
        <div className='flex flex-col gap-1'>
            <div className='flex flex-row gap-1'>
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
            </div>
            <div className='flex flex-row gap-1'>
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
            </div>
            <div className='flex flex-row gap-1'>
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
            </div>
            <div className='flex flex-row gap-1'>
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
            </div>
            <div className='flex flex-row gap-1'>
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
                <Skeleton style={{ height: '2.5rem' }} />
            </div>
        </div>
    </div>;
}