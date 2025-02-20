import TOML from '@iarna/toml';
import { Asset } from '@stellar-asset-lists/sdk';

export * from './convert';

export function getErrorCode(message: string) {
    const match = message.match(/Error\(Contract, #(\d+)\)/);
    if (!match)
        throw new Error('No error code');
    return match[1];
}

export function truncateAddress(address?: string | null): string {
    if (!address)
        return "";

    const start = address.slice(0, 6);
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
    } catch (err: any) {
        console.error(err.message);
    }

    return null;
}
