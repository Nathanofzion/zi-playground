"use client";

import dynamic from "next/dynamic";

// The 3D Earth pulls in react-three-fiber / react-reconciler, which crash at
// module-eval during SSR under Next 15 (they read React internals not present
// in the server render). Loading it via a client-only dynamic import keeps the
// whole react-three stack out of the server bundle. ssr:false is allowed here
// because this wrapper is a Client Component.
const Viewer = dynamic(() => import("@/components/Earth"), { ssr: false });

export default function EarthClient(props: { startAnimation?: boolean }) {
  return <Viewer {...props} />;
}
