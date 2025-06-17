
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      remotePatterns: [
        {
          protocol: 'https', // placehold.co uses https
          hostname: 'placehold.co',
          port: '', // Default port for https is 443, so empty string is fine
          pathname: '/**', // Allow any path on this hostname
        },
        // Preserve existing configuration for localhost if still needed
        {
          protocol: 'http', 
          hostname: 'localhost', 
          port: '5000', 
          pathname: '/api/admin/topup-requests/**/receipt', 
        },
      ],
    }
};

export default nextConfig;
