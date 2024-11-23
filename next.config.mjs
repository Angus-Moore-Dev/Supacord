/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '127.0.0.1',
                port: '54321',
                pathname: '/**/*'
            },
            {
                protocol: 'https',
                hostname: 'supacord.com',
                pathname: '/**/*'
            }
        ]
    }
};

export default nextConfig;
