import TOML from "@iarna/toml";
import { Asset } from "@stellar-asset-lists/sdk";

export * from "./convert";

export function truncateAddress(address?: string | null): string {
  if (!address) return "";

  const start = address.slice(0, 6);
  const end = address.slice(-4);
  return `${start}...${end}`;
}

export const formatNumber = (value: number | string, fractionDigits: number = 2) => {
  if (typeof value == 'number' && !isNaN(value))
    return value.toFixed(fractionDigits).replace(/\.+[0-9]*$/, (substring) => substring.replace(/\.*0*$/, ''));
  if (typeof value == 'string')
    return value.replace(/\.+[0-9]*$/, (substring) => substring.slice(0, fractionDigits + 1));
  return '0';
}

export async function fetchAssetImage(asset: Asset) {
  try {
    const response = await fetch(
      `https://${asset.domain}/.well-known/stellar.toml`
    );
    const tomlData = await response.text();
    const parsedToml = TOML.parse(tomlData) as any;

    if (parsedToml.CURRENCIES) {
      const currency = parsedToml.CURRENCIES.find(
        (currency: any) => currency.code == asset.code
      );
      return currency.image;
    }
  } catch (err: any) {
    console.error(err.message);
  }

  return null;
}
