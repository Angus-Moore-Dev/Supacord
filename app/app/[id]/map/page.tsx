'use client';
import WorldMap from '@/public/world.svg';
import Image from 'next/image';


export default function MapPage()
{
    return <div className="w-full flex flex-col flex-grow p-5">
        <Image src={WorldMap} alt="World Map" />
        <h1>
            MAPBOX GOES HERE INSTEAD.
        </h1>
    </div>;
}
