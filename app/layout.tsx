import type { Metadata } from 'next';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './globals.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Raleway } from 'next/font/google';
import { Notifications } from '@mantine/notifications';
import { Analytics } from '@vercel/analytics/react';

const inter = Raleway({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Supacord | Data Visualiser',
    description: 'A visualiser platform to help Supabase developers investigate data',
    icons: {
        icon: '/favicon.ico'
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
            <body className={`${inter.className} min-h-screen flex flex-col antialiased`}>
                <MantineProvider defaultColorScheme="dark" theme={{
                    primaryColor: 'dark',
                    fontSmoothing: true,
                    defaultRadius: 'lg'
                }}>
                    <Notifications position='bottom-right' />
                    {children}
                </MantineProvider>
                <Analytics />
            </body>
        </html>
    );
}
