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
                    <b>
                        <b className='text-green'>Natural Language Queries</b> & Analytics for <b className='text-supabase-green'>Supabase</b> Developers.
                    </b>
                </h1>
                <h3>
                    This is a dead project. Go and read the code on <a href="https://github.com/angus-moore-dev/supalytics" className='text-supabase-green'>GitHub</a>.
                    <br />
                    <br />
                    There&apos;s some innovative code that I wrote, particularly with respect to how it handles automated querying of user data.
                    <br />
                    <br />
                    Or you can read my account on 𝕏 <a href='https://x.com/angusmoore00' className='text-supabase-green'>here</a>.
                </h3>
                <h4>
                    I am now working full-time on NOTEX.
                </h4>
            </div>
            {/* <WaitlistForm /> */}
        </section>
        <small className='text-neutral-500 font-medium max-w-xl text-center'>
            Supalytics is not affiliated with Supabase in any way. We are currently in private alpha and people on the waitlist will be invited in batches...
        </small>
    </section>;
}