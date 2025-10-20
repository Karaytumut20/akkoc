/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // 📌 Cloudinary veya başka kaynaklar varsa bırakabilirsin
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '**',
      },
      // 📌 Eski Supabase domainin
      {
        protocol: 'https',
        hostname: 'sbejgtziknyxaylugffc.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // 📌 Yeni Supabase domainin
      {
        protocol: 'https',
        hostname: 'zqbxdwmvvcqfnecwmavj.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
