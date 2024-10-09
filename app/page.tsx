import SupacordBanner from '@/public/supacord_banner.png';
import Image from 'next/image';
import Link from 'next/link';


export default async function HomePage()
{
    return <section className="flex-grow flex flex-col items-center gap-5 p-8">
        <Image src={SupacordBanner} alt="Supacord Banner" width={960} height={600} className='fade-in' />
        <div className='flex flex-col items-center'>
            <h1>
				Visualise your Supabase project&apos;s database and use natural language to query it.
            </h1>
            <h3>
				Currently in alpha, so expect bugs and missing features.
            </h3>
        </div>
        <p>
			Supacord is an open-source platform, please checkout out <Link href='https://github.com/Angus-Moore-Dev/Supacord/' target='_blank' className='text-blue-500 hover:text-blue-400 underline'>
				our GitHub.
            </Link>
        </p>
    </section>;
}