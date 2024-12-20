import ConnectWithSupabase from '@/components/ConnectWithSupabase';
import getSupabaseTokens from '@/utils/getSupabaseTokens';
import serverGetMyProfile from '@/utils/serverGetMyProfile';
import { CornerLeftUp } from 'lucide-react';


export default async function AppHomePage()
{
    const profile = await serverGetMyProfile();
    const accessTokens = await getSupabaseTokens();

    if (!profile)
    {
        return <div className="flex flex-col px-16 py-8">
            <h1>
                Error Fetching Your Profile...
            </h1>
            <p>
                Check the developer console for more information.
            </p>
        </div>;
    }

    if (!accessTokens || accessTokens.length === 0)
        return <div className="flex-grow flex flex-col gap-10 px-16 py-8">
            <div className='flex flex-col gap-5'>
                <h1>
                    Get Started By Connecting Supacord &rarr; <span className='text-supabase-green'>Supabase</span>
                </h1>
                <ConnectWithSupabase />
                <div className='flex items-end gap-1 -mt-3'>
                    <CornerLeftUp size={24} />
                    <small>
                        Connect Your Projects Now!
                    </small>
                </div>
            </div>
        </div>;


    return <div className='w-full flex flex-col gap-5 px-16 py-8'>
        <h1>
            Dashboarding Stuff Goes Here
        </h1>
    </div>;
}