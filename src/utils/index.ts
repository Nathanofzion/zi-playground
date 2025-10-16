// Export all utility functions from convert.ts (now client-safe)
export * from "./convert";

// ✅ Address formatting utilities
export function truncateAddress(address?: string | null): string {
  if (!address) return "";

  const start = address.slice(0, 6);
  const end = address.slice(-4);
  return `${start}...${end}`;
}

export function formatAddress(address: string, length: number = 6): string {
  if (!address || address.length <= length * 2) return address;
  return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
}

// ✅ Number formatting utilities
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

export const formatCurrency = (
  value: number | string,
  currency: string = "XLM",
  fractionDigits: number = 7
): string => {
  const formatted = formatNumber(value, fractionDigits);
  return `${formatted} ${currency}`;
};

export const formatPercent = (
  value: number,
  fractionDigits: number = 2
): string => {
  return `${formatNumber(value * 100, fractionDigits)}%`;
};

// ✅ Validation utilities
export function isValidPublicKey(publicKey: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(publicKey);
}

export function isValidSecretKey(secretKey: string): boolean {
  return /^S[A-Z2-7]{55}$/.test(secretKey);
}

export function isValidContractId(contractId: string): boolean {
  return /^C[A-Z2-7]{55}$/.test(contractId);
}

// ✅ Time formatting utilities
export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInMs = now.getTime() - then.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return then.toLocaleDateString();
}

// ✅ Array utilities
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

// ✅ Object utilities
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

// ✅ Async utilities
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await delay(delayMs * attempt);
      }
    }
  }
  
  throw lastError!;
}

// ✅ Local storage utilities (client-safe)
export function getStoredValue<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStoredValue<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to store value:', error);
  }
}

export function removeStoredValue(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to remove stored value:', error);
  }
}

// ✅ Error handling utilities
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function createErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  errorMessage: string = 'Operation failed'
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(errorMessage, error);
      return null;
    }
  };
}

// ✅ URL utilities
export function buildApiUrl(endpoint: string, params?: Record<string, string>): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  let url = `${baseUrl}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }
  
  return url;
}

// ✅ Type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}
