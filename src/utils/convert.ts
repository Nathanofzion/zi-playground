import BigNumber from "bignumber.js";

/**
 * Serialize ScVal (or base64 XDR string) to a base64 XDR string for transport.
 * - If the value is a ScVal instance (has toXDR), we encode to base64 XDR.
 * - If it's already a base64 string, we validate and pass through.
 */
function serializeScValForJSON(scVal: any): string {
  // Handle ScVal objects with toXDR method
  if (scVal && typeof scVal.toXDR === "function") {
    try {
      // Try base64 encoding first (most common)
      return scVal.toXDR("base64");
    } catch (error: any) {
      // If base64 fails, try raw XDR
      try {
        const rawXdr = scVal.toXDR();
        // Convert Buffer to base64 if needed
        if (Buffer.isBuffer(rawXdr)) {
          return rawXdr.toString('base64');
        }
        if (typeof rawXdr === 'string') {
          return rawXdr;
        }
        throw new Error(`Unexpected XDR format: ${typeof rawXdr}`);
      } catch (fallbackError: any) {
        throw new Error(`Failed to serialize ScVal to XDR: ${error.message} (fallback also failed: ${fallbackError.message})`);
      }
    }
  }

  // Handle base64 strings
  if (typeof scVal === "string" && scVal.length > 0) {
    // Basic base64 validation
    if (!/^[A-Za-z0-9+/=]+$/.test(scVal)) {
      throw new Error("Invalid base64 XDR string format");
    }
    return scVal;
  }

  // Handle BigInt or number directly
  if (typeof scVal === 'bigint' || typeof scVal === 'number') {
    throw new Error(`Cannot serialize ${typeof scVal} directly - ScVal expected`);
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
// Always use API to avoid "Bad union switch" errors from SDK XDR parsing
export async function scValToNumber(scVal: any): Promise<number> {
  try {
    // Always serialize to XDR and use API - this is more reliable than direct SDK conversion
    // The "Bad union switch" error occurs when SDK tries to parse certain ScVal formats
    let scValBase64: string;
    
    try {
      // If it's already a base64 string, use it directly
      if (typeof scVal === 'string' && scVal.length > 0) {
        // Validate it looks like base64
        if (/^[A-Za-z0-9+/=]+$/.test(scVal)) {
          scValBase64 = scVal;
        } else {
          throw new Error('Invalid base64 string format');
        }
      } else if (scVal && typeof scVal.toXDR === 'function') {
        // ScVal object with toXDR method - serialize to base64
        try {
          scValBase64 = scVal.toXDR('base64');
        } catch (xdrError: any) {
          console.error('ScVal.toXDR failed:', xdrError);
          throw new Error(`Failed to serialize ScVal to XDR: ${xdrError.message || 'Unknown error'}`);
        }
      } else {
        // Try the serializeScValForJSON helper
        scValBase64 = serializeScValForJSON(scVal);
      }
    } catch (serializeError: any) {
      console.error('ScVal serialization error:', serializeError);
      throw new Error(`Failed to serialize ScVal for conversion: ${serializeError.message || 'Unknown error'}`);
    }

    // Always use API for conversion to avoid SDK parsing issues
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
  } catch (error: any) {
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
