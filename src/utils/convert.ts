import BigNumber from "bignumber.js";

/**
 * Serialize ScVal (or base64 XDR string) to a base64 XDR string for transport.
 * - If the value is a ScVal instance (has toXDR), we encode to base64 XDR.
 * - If it's already a base64 string, we validate and pass through.
 */
function serializeScValForJSON(scVal: any): string {
  if (scVal && typeof scVal.toXDR === "function") {
    try {
      return scVal.toXDR("base64");
    } catch (error: any) {
      throw new Error(`Failed to serialize ScVal to XDR: ${error.message}`);
    }
  }

  if (typeof scVal === "string" && scVal.length > 0) {
    // Basic base64 validation
    if (!/^[A-Za-z0-9+/=]+$/.test(scVal)) {
      throw new Error("Invalid base64 XDR string format");
    }
    return scVal;
  }

  throw new Error(
    `Invalid ScVal format. Expected ScVal with toXDR or base64 string; got ${typeof scVal}${
      scVal?.constructor ? ` (${scVal.constructor.name})` : ""
    }`
  );
}

// ✅ Server-side API call to replace nativeToScVal
export async function accountToScVal(account: string): Promise<any> {
  try {
    // Use addressToScVal operation to create proper Address ScVal
    const response = await fetch('/api/stellar/parse-xdr/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: 'addressToScVal', 
        value: account 
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Account conversion failed');
    }

    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error('accountToScVal error:', error);
    throw error;
  }
}

// ✅ Server-side API call to replace scValToBigInt
export async function scValToNumber(scVal: any): Promise<number> {
  try {
    const scValBase64 = serializeScValForJSON(scVal);

    const response = await fetch('/api/stellar/parse-xdr/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: 'scValToBigInt', 
        scVal: scValBase64
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'ScVal conversion failed');
    }

    const result = await response.json();
    return Number(result.result);
  } catch (error) {
    console.error('scValToNumber error:', error);
    throw error;
  }
}

// ✅ This function is safe - no Stellar SDK needed
export function formatBalance(
  balance: bigint | undefined | null,
  decimals: bigint | number | undefined | null
): string {
  if (!balance || !decimals) return "0";

  return BigNumber(balance.toString())
    .div(Math.pow(10, Number(decimals)))
    .toString();
}

// ✅ Additional utility functions using API calls
export async function nativeToScVal(value: any): Promise<any> {
  try {
    const response = await fetch('/api/stellar/parse-xdr/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: 'nativeToScVal', 
        value 
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Native to ScVal conversion failed');
    }

    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error('nativeToScVal error:', error);
    throw error;
  }
}

export async function scValToNative(scVal: any): Promise<any> {
  try {
    const scValBase64 = serializeScValForJSON(scVal);

    const response = await fetch('/api/stellar/parse-xdr/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        operation: 'scValToNative', 
        scVal: scValBase64
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'ScVal to native conversion failed');
    }

    const result = await response.json();
    return result.result;
  } catch (error) {
    console.error('scValToNative error:', error);
    throw error;
  }
}

// ✅ Client-safe validation functions
export function isValidPublicKey(publicKey: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(publicKey);
}

export function isValidSecretKey(secretKey: string): boolean {
  return /^S[A-Z2-7]{55}$/.test(secretKey);
}

export function formatAddress(address: string, length: number = 6): string {
  if (!address || address.length <= length * 2) return address;
  return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
}

// ✅ Error handling helper
export class StellarConversionError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'StellarConversionError';
  }
}
