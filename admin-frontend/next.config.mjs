
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // If you plan to display images from your backend (e.g., receipts)
    // and they are served from a different domain or path, configure images here.
    // For now, assuming receipts might be served via a backend endpoint that returns image data directly.
    images: {
      remotePatterns: [
        {
          protocol: 'http', // or 'https' if your backend API uses SSL
          hostname: 'localhost', // or your backend API hostname
          port: '5000', // or your backend API port
          pathname: '/api/admin/topup-requests/**/receipt', // Example path if backend serves images this way
        },
      ],
    }
};

export default nextConfig;
