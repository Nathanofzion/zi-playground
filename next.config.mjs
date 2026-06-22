/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
    // Pin the workspace root so Next 15 doesn't infer a stray parent-dir
    // lockfile as the root (breaks output file tracing on deploy).
    outputFileTracingRoot: __dirname,
    experimental: {
        optimizePackageImports: ["@chakra-ui/react"],
    },
    // Next 15: renamed from experimental.serverComponentsExternalPackages.
    serverExternalPackages: [
        '@stellar/stellar-sdk',
        '@stellar/stellar-sdk-v14',
        '@stellar/stellar-base',
        'sodium-native'
    ],
    transpilePackages: [
        'passkey-kit',
        'passkey-factory-sdk',
        'passkey-kit-sdk',
        'sac-sdk',
        '@soroban-react/core',
        '@soroban-react/types',
        'react-social-icons',
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

        // Fix: passkey-kit bundles @stellar/stellar-sdk@14 which requires
        // lib/package.json that pnpm deduplication removes. Redirect it to
        // the actual root package.json of the same package.
        const missingPkgJson = path.join(
          __dirname,
          'node_modules/passkey-kit/node_modules/@stellar/stellar-sdk/lib/package.json'
        );
        const actualPkgJson = path.join(
          __dirname,
          'node_modules/passkey-kit/node_modules/@stellar/stellar-sdk/package.json'
        );
        config.resolve.alias = {
          ...config.resolve.alias,
          [missingPkgJson]: actualPkgJson,
        };

        return config;
      },
};

export default nextConfig;