/**
 * JWT verification helper for Next.js API routes.
 *
 * Tokens are issued by the `auth` Supabase edge function using HS256
 * (jsonwebtoken default) with the SECRET_KEY env var.
 * Payload shape: { id: string }  — `id` is the user's wallet contract address.
 */

import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  console.warn("[api-auth] SECRET_KEY env var is not set — all authenticated routes will reject requests.");
}

const encodedSecret = new TextEncoder().encode(SECRET_KEY ?? "");

export interface AuthPayload {
  /** User's Stellar smart-wallet contract address (C-address) */
  id: string;
  iat?: number;
  exp?: number;
}

/**
 * Extracts and verifies the Bearer JWT from the Authorization header.
 * Returns the decoded payload on success, or a 401 NextResponse on failure.
 */
export async function requireAuth(
  req: NextRequest
): Promise<AuthPayload | NextResponse> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ["HS256"],
    });

    if (!payload.id || typeof payload.id !== "string") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return payload as unknown as AuthPayload;
  } catch {
    return NextResponse.json({ error: "Unauthorized — invalid or expired token" }, { status: 401 });
  }
}

/** Type-guard to distinguish a successful auth result from a 401 response. */
export function isAuthError(result: AuthPayload | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
