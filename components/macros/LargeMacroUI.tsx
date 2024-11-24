'use client';

import { Macro } from '@/lib/global.types';


interface LargeMacroUIProps
{
    macro: Macro;
}

export default function LargeMacroUI({ macro }: LargeMacroUIProps)
{
    return <div className='flex flex-col gap-3 p-4 bg-[#0e0e0e] rounded-lg'>
        {
            JSON.stringify(macro)
        }
    </div>;
}