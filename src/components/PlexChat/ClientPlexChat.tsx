"use client";

import dynamic from "next/dynamic";

// Next 15 disallows `next/dynamic` with `ssr: false` in Server Components.
// Root layout is a Server Component, so the client-only PlexChat load lives here.
const PlexChat = dynamic(() => import("@/components/PlexChat"), { ssr: false });

export default function ClientPlexChat() {
  return <PlexChat />;
}
