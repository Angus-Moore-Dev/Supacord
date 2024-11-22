import type { Metadata } from 'next';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';
import './globals.css';
import './loading_animation.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
    title: 'Supacord',
    description: 'Empowering Supabase developers to create custom, perceptive analytics metrics, across all projects, enabled by Artificial Intelligence.',
    icons: {
        icon: '/favicon.ico'
    },
    openGraph: {
        title: 'Supacord',
        description: 'Empowering Supabase developers to create custom, perceptive analytics metrics, across all projects, enabled by Artificial Intelligence.',
        type: 'website',
        url: 'https://supacord.com',
        siteName: 'Supacord',
        images: [
            {
                url: '/supacord_github_banner.png',
                width: 2500,
                height: 1003,
                alt: 'Empowering Supabase developers to create custom, perceptive analytics metrics, across all projects, enabled by Artificial Intelligence.'
            }
        ]
    }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>)
{
    return (
        <html lang="en" data-mantine-color-scheme="dark">
            <head>
                <ColorSchemeScript color="dark" defaultColorScheme='dark' forceColorScheme="dark" />
                <script async defer src="https://buttons.github.io/buttons.js"></script>
            </head>
            <body className={'min-h-screen flex flex-col antialiased'}>
                <MantineProvider defaultColorScheme="dark" theme={{
                    primaryColor: 'green',
                    fontSmoothing: true,
                    defaultRadius: 'sm'
                }}>
                    <Notifications position='bottom-right' />
                    {children}
                </MantineProvider>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
