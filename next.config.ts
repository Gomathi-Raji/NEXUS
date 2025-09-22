/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['avatars.githubusercontent.com',
      'github.githubassets.com',
      'seeklogo.com',
      'seeklogo.com',
      'www.docker.com',
      'github.com',
      'x.com',
      'pbs.twimg.com',
      'peerlist.io',
      'api.producthunt.com',
      'www.producthunt.com'
      
    ],
    
  },
  // Annotate config to avoid TS implicit any error during Netlify build
  webpack: (config: any) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      three: require.resolve('three'),
    };
    return config;
  },
};

module.exports = nextConfig;
