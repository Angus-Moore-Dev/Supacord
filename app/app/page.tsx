import ConnectWithSupabase from '@/components/ConnectWithSupabase';
import getSupabaseToken from '@/utils/getSupabaseToken';
import serverGetMyProfile from '@/utils/serverGetMyProfile';


export default async function AppHomePage()
{
    const profile = await serverGetMyProfile();
    const accessToken = await getSupabaseToken();

    if (!profile)
    {
        return <div className="flex flex-col px-16 py-8">
            <h1>
                Error Fetching Your Profile :(
            </h1>
            <p>
                Check the developer console for more information.
            </p>
        </div>;
    }

    return <div className="flex-grow flex flex-col gap-10 px-16 py-8">
        {
            <div className='flex-grow flex flex-col gap-5 items-center justify-center'>
                <h1>
                    Get Started By Connecting Your Supabase Project(s)
                </h1>
                <ConnectWithSupabase />
            </div>
        }
    </div>;
}