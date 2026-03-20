import { NextRequest, NextResponse } from "next/server";

// Proxy for OZ relayer — bypasses browser CORS, converts FormData→JSON for OZ channels API
export async function POST(req: NextRequest) {
  const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL;
  const relayerApiKey = process.env.NEXT_PUBLIC_RELAYER_API_KEY;

  if (!relayerUrl) {
    return NextResponse.json({ error: "Relayer not configured" }, { status: 500 });
  }

  // passkey-kit sends FormData with an `xdr` field; OZ channels API expects JSON
  const formData = await req.formData();
  const xdr = formData.get("xdr");
  const fee = formData.get("fee");

  if (!xdr) {
    return NextResponse.json({ error: "Missing xdr field" }, { status: 400 });
  }

  const body: Record<string, unknown> = { xdr };
  if (fee) body.fee = fee;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-Name": "zi-playground",
  };

  if (relayerApiKey) {
    headers["Authorization"] = `Bearer ${relayerApiKey}`;
  }

  const response = await fetch(relayerUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('[relay] OZ relayer error:', response.status, JSON.stringify(data));
  } else {
    console.log('[relay] OZ relayer success:', response.status, JSON.stringify(data));
  }

  return NextResponse.json(data, { status: response.status });
}
