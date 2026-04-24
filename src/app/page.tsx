"use client";
export const dynamic = "force-dynamic";
import { useContext, useEffect, useState } from "react";

import { Grid } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import Viewer from "@/components/Earth";
import { Theme } from "@/enums";
import { AppContext } from "@/providers/AppProvider";

export default function Home() {
  const { theme } = useContext(AppContext);
  const { address } = useSorobanReact();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("zi_referrer", ref);
    }
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <Grid flex="1 1 0" templateColumns={{ lg: "repeat(2, minmax(0, 1fr))" }}>
      {(theme == Theme.Particle ||
        theme == Theme.Atomic ||
        theme == Theme.NightDay) && <Viewer startAnimation={!!address} />}
    </Grid>
  );
}
