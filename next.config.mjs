/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        optimizePackageImports: ["@chakra-ui/react"],
        serverComponentsExternalPackages: [
            '@stellar/stellar-sdk',
            '@stellar/stellar-sdk-v14',
            '@stellar/stellar-base',
            'sodium-native'
        ],
    },
    transpilePackages: [
        'passkey-kit',
        'passkey-factory-sdk',
        'passkey-kit-sdk',
        'sac-sdk',
        '@soroban-react/core',
        '@soroban-react/types',
    ],
    
    webpack: (config, { isServer }) => {
        if (!isServer) {
          // ✅ Prevent client-side bundling
          config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            crypto: false,
            stream: false,
            buffer: false,
          };
        }
        return config;
      },
};

export default nextConfig;