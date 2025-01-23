import MillionLint from '@million/lint';
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'gjjjsnygfjeycfmnbjcf.supabase.co',
                port: '',
                pathname: '**',
                search: '',
            },
        ],
    },
};

export default nextConfig;
