import { NextRequest, NextResponse } from 'next/server';
import { stellarServer } from '@/lib/stellar-server-only';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper function to serialize ScVal objects to XDR strings
function serializeScVal(scVal: any): any {
  // Handle BigInt - convert to string for JSON serialization
  if (typeof scVal === 'bigint') {
    return scVal.toString();
  }
  
  if (!scVal || typeof scVal !== 'object') {
    return scVal;
  }

  // Check if it's a Stellar ScVal object with toXDR method
  if (typeof scVal.toXDR === 'function') {
    try {
      return scVal.toXDR('base64');
    } catch (serializationError) {
      console.warn('Failed to serialize ScVal to XDR:', serializationError);
      return scVal;
    }
  }

  // Handle arrays of ScVals
  if (Array.isArray(scVal)) {
    return scVal.map(serializeScVal);
  }

  // Handle nested objects
  if (scVal.constructor === Object) {
    const serialized: any = {};
    for (const [key, value] of Object.entries(scVal)) {
      serialized[key] = serializeScVal(value);
    }
    return serialized;
  }

  return scVal;
}

// Robust deserialize function: reconstruct ScVal from base64 XDR or pass-through valid ScVal
async function deserializeScVal(data: any): Promise<any> {
  if (!data) {
    throw new Error('ScVal data is required');
  }

  // If already a proper ScVal (has switch & toXDR), pass through
  if (
    data &&
    typeof data.switch === 'function' &&
    typeof data.toXDR === 'function'
  ) {
    return data;
  }

  // If base64 XDR string, parse to ScVal
  if (typeof data === 'string' && data.length > 0) {
    // Basic base64 validation
    if (!/^[A-Za-z0-9+/=]+$/.test(data)) {
      throw new Error('Invalid base64 format for ScVal');
    }

    await stellarServer.initialize();
    const sdk = (stellarServer as any).sdk;

    try {
      const buffer = Buffer.from(data, 'base64');
      const scVal = sdk.xdr.ScVal.fromXDR(buffer);

      if (!scVal || typeof scVal.switch !== 'function') {
        throw new Error('Parsed object is not a valid ScVal instance');
      }

      return scVal;
    } catch (error: any) {
      if (error.message?.includes('XDR')) {
        throw new Error(`Failed to parse ScVal from XDR: ${error.message}`);
      }
      throw new Error(`ScVal deserialization failed: ${error.message}`);
    }
  }

  throw new Error(
    `Invalid ScVal format. Expected base64 XDR string or ScVal instance; received ${typeof data}${
      data?.constructor ? ` (${data.constructor.name})` : ''
    }`
  );
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid or empty JSON body', details: `${parseError}` },
        { status: 400 }
      );
    }

    const { operation, value, scVal, options } = body || {};
    
    if (!operation) {
      return NextResponse.json(
        { error: 'Missing operation parameter' }, 
        { status: 400 }
      );
    }

    let result;

    switch (operation) {
      case 'nativeToScVal':
        if (value === undefined) {
          return NextResponse.json(
            { error: 'Missing value for nativeToScVal operation' },
            { status: 400 }
          );
        }
        
        // Handle type options for specialized conversions
        if (options?.type === 'u32') {
          result = await stellarServer.nativeToScValU32(value);
        } else if (options?.type === 'i128') {
          result = await stellarServer.nativeToScValI128(value);
        } else if (options?.type === 'address') {
          result = await stellarServer.nativeToScValAddress(value);
        } else {
          result = await stellarServer.nativeToScVal(value);
        }
        break;

      case 'scValToNative':
        if (!scVal) {
          return NextResponse.json(
            { error: 'Missing scVal for scValToNative operation' },
            { status: 400 }
          );
        }
        
        // Deserialize ScVal (base64 XDR or valid ScVal instance)
        const deserializedScVal = await deserializeScVal(scVal);
        result = await stellarServer.scValToNative(deserializedScVal);
        break;

      case 'scValToBigInt':
        if (!scVal) {
          return NextResponse.json(
            { error: 'Missing scVal for scValToBigInt operation' },
            { status: 400 }
          );
        }
        
        const deserializedScValBigInt = await deserializeScVal(scVal);
        result = await stellarServer.scValToBigInt(deserializedScValBigInt);
        break;

      case 'addressToScVal':
        if (!value) {
          return NextResponse.json(
            { error: 'Missing address for addressToScVal operation' },
            { status: 400 }
          );
        }
        result = await stellarServer.addressToScVal(value);
        break;

      case 'stringToScVal':
        if (value === undefined) {
          return NextResponse.json(
            { error: 'Missing string for stringToScVal operation' },
            { status: 400 }
          );
        }
        result = await stellarServer.stringToScVal(value);
        break;

      case 'numberToScVal':
        if (typeof value !== 'number') {
          return NextResponse.json(
            { error: 'Missing or invalid number for numberToScVal operation' },
            { status: 400 }
          );
        }
        result = await stellarServer.numberToScVal(value);
        break;

      case 'objectToScVal':
        // Handle converting JS objects back to proper ScVal
        if (!value && !scVal) {
          return NextResponse.json(
            { error: 'Missing object for objectToScVal operation' },
            { status: 400 }
          );
        }
        
        const objectToConvert = value || scVal;
        result = await stellarServer.nativeToScVal(objectToConvert);
        break;

      default:
        return NextResponse.json(
          { 
            error: 'Invalid operation',
            message: 'Supported operations: nativeToScVal, scValToNative, scValToBigInt, addressToScVal, stringToScVal, numberToScVal, objectToScVal',
            supportedOperations: [
              'nativeToScVal',
              'scValToNative', 
              'scValToBigInt',
              'addressToScVal',
              'stringToScVal',
              'numberToScVal',
              'objectToScVal'
            ]
          },
          { status: 400 }
        );
    }

    // Serialize the result to handle ScVal objects properly
    const serializedResult = serializeScVal(result);

    return NextResponse.json({
      success: true,
      operation,
      result: serializedResult,
      options: options || null,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Stellar conversion error:', error);
    
    return NextResponse.json({
      error: 'Conversion failed',
      message: error.message || 'An unexpected error occurred during conversion',
      code: 'CONVERSION_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Stellar conversion API is running normally',
    supportedOperations: [
      {
        operation: 'nativeToScVal',
        description: 'Convert native JavaScript value to Stellar ScVal',
        options: ['u32', 'i128', 'address']
      },
      {
        operation: 'scValToNative',
        description: 'Convert Stellar ScVal to native JavaScript value'
      },
      {
        operation: 'scValToBigInt',
        description: 'Convert Stellar ScVal to BigInt'
      },
      {
        operation: 'addressToScVal',
        description: 'Convert Stellar address to ScVal'
      },
      {
        operation: 'stringToScVal',
        description: 'Convert string to ScVal'
      },
      {
        operation: 'numberToScVal',
        description: 'Convert number to ScVal'
      },
      {
        operation: 'objectToScVal',
        description: 'Convert JavaScript object to ScVal'
      }
    ],
    version: '1.0.2',
    timestamp: new Date().toISOString()
  });
}