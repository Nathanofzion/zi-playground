import { NextRequest, NextResponse } from "next/server";

// Proxy for OZ Channels relayer — bypasses browser CORS
// ChannelsClient (axios) sends: POST / with JSON body { params: { xdr: "..." } }
// We forward that body as-is to the real OZ channels URL with our API key
export async function POST(req: NextRequest) {
  const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL;
  const relayerApiKey = process.env.NEXT_PUBLIC_RELAYER_API_KEY;

  if (!relayerUrl) {
    return NextResponse.json({ success: false, error: "Relayer not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (relayerApiKey) {
    headers["Authorization"] = `Bearer ${relayerApiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(relayerUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err: any) {
    console.error('[relay] Failed to reach OZ relayer:', err.message);
    return NextResponse.json({ success: false, error: `Relay fetch failed: ${err.message}` }, { status: 502 });
  }

  const rawText = await response.text();
  let data: any = {};
  try { data = JSON.parse(rawText); } catch { data = { raw: rawText }; }

  if (!response.ok) {
    console.error('[relay] OZ relayer error:', response.status, 'body:', rawText);
  } else {
    console.log('[relay] OZ relayer success:', response.status);
  }

  return NextResponse.json(data, { status: response.status });
}
