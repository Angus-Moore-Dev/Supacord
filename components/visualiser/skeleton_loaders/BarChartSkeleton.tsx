'use client';
import { Skeleton } from '@mantine/core';

export default function BarChartSkeleton()
{
    return <div className="flex-grow flex flex-col gap-3">
        {/* Skeleton in the shape of a bar chart */}
        <div className='flex flex-row gap-1 items-end'>
            <Skeleton style={{ height: '4rem' }} />
            <Skeleton style={{ height: '6rem' }} />
            <Skeleton style={{ height: '12rem' }} />
            <Skeleton style={{ height: '8rem' }} />
            <Skeleton style={{ height: '6rem' }} />
            <Skeleton style={{ height: '10rem' }} />
            <Skeleton style={{ height: '6rem' }} />
            <Skeleton style={{ height: '12rem' }} />
            <Skeleton style={{ height: '4rem' }} />
        </div>
    </div>;
}