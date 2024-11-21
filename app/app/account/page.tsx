import ProfileUI from '@/components/profile/ProfileUI';
import { createServerClient } from '@/utils/supabaseServer';
import { Metadata } from 'next';


export async function generateMetadata(): Promise<Metadata>
{
    return { title: 'My Profile | Supacord' };
}


export default async function AccountPage()
{
    const supabase = createServerClient();
    const user = (await supabase.auth.getUser()).data.user!;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error)
        return <div className='flex flex-col gap-3'>
            <h1>
                Error fetching profile
            </h1>
            <p>
                {error.message}
            </p>
        </div>;

    return <div className='w-full flex flex-col gap-5 px-16 py-8 flex-grow'>
        <ProfileUI profile={profile} />
    </div>;
}