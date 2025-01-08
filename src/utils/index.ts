export * from './convert';

export function truncateAddress(address: string): string {
    if (typeof address !== 'string' || address.length < 10) {
        throw new Error('Address must be a string with at least 10 characters.');
    }

    const start = address.slice(0, 4);
    const end = address.slice(-4);
    return `${start}...${end}`;
}