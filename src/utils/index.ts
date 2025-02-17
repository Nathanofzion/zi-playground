import TOML from '@iarna/toml';
import { Asset } from '@stellar-asset-lists/sdk';

export * from './convert';

export function truncateAddress(address: string): string {
    if (typeof address !== 'string' || address.length < 10) {
        throw new Error('Address must be a string with at least 10 characters.');
    }

    const start = address.slice(0, 4);
    const end = address.slice(-4);
    return `${start}...${end}`;
}

export async function fetchAssetImage(asset: Asset) {
    try {
        const response = await fetch(`https://${asset.domain}/.well-known/stellar.toml`);
        const tomlData = await response.text();
        const parsedToml = TOML.parse(tomlData) as any;

        if (parsedToml.CURRENCIES) {
            const currency = parsedToml.CURRENCIES.find((currency: any) => currency.code == asset.code);
            return currency.image;
        }
    } catch (_err) {
        console.error('Failed to fetch or parse TOML for:', asset.code);
    }
    return null;
}
