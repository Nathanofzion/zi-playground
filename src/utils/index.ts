export * from "./convert";

export function truncateAddress(address?: string | null): string {
  if (!address) return "";

  const start = address.slice(0, 6);
  const end = address.slice(-4);
  return `${start}...${end}`;
}

export const formatNumber = (
  value: number | string,
  fractionDigits: number = 2
) => {
  if (typeof value == "number" && !isNaN(value))
    return value
      .toFixed(fractionDigits)
      .replace(/\.+[0-9]*$/, (substring) => substring.replace(/\.*0*$/, ""));
  if (typeof value == "string")
    return value.replace(/\.+[0-9]*$/, (substring) =>
      substring.slice(0, fractionDigits + 1)
    );
  return "0";
};
