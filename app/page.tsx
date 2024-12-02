import WaitlistForm from '@/components/homepage/WaitlistForm';
import HomepageNavbar from '@/components/HomepageNavbar';
import { createServerClient } from '@/utils/supabaseServer';



export default async function HomePage()
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user;

    return <section className="flex-grow flex flex-col items-center gap-5 fade-in relative">
        <HomepageNavbar user={user} />
        <section className='flex flex-col w-full max-w-7xl gap-10 px-16 mt-[100px] mb-24'>
            <div className='flex flex-col gap-10 items-start mt-24'>
                <h1 className='font-extrabold text-5xl max-w-4xl text-center lg:text-left'>
                    <b className='text-green'><i>The</i></b> Data Analytics Platform for <b className='text-supabase-green'>Supabase</b> Developers.
                </h1>
                <h3 className='max-w-2xl text-center lg:text-left'>
                    {/* Stop wasting time staring at UUIDs, writing massive SQL macros and being a monkey staring at a monolith. Embrace science-fiction technology. */}
                    You will be able to dynamically query your database, store common macros/charts/visuals, possess realtime updates and 
                    intelligently be displayed metrics/information with a natural language interface.
                </h3>
                <h4 className='max-w-2xl text-center lg:text-left'>
                    If you are a a developer with a Supabase project and you want to <b>see your data</b>, then Supacord
                    is something you&apos;ll have on your development toolbelt forever.
                </h4>
            </div>
            <WaitlistForm />
        </section>
        <small className='text-neutral-500 font-medium max-w-xl text-center'>
            Supalytics is not affiliated with Supabase in any way. We are currently in private alpha and people on the waitlist will be invited in batches...
        </small>
    </section>;
}