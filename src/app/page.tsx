"use client";
export const dynamic = "force-dynamic";
import { useContext, useEffect, useState } from "react";

import { Grid } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import Viewer from "@/components/EarthClient";
import { Theme } from "@/enums";
import { AppContext } from "@/providers/AppProvider";
import { toaster } from "@/components/ui/toaster";

export default function Home() {
  const { theme, openRewardsModal } = useContext(AppContext);
  const { address } = useSorobanReact();
  const [isClient, setIsClient] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("zi_referrer", ref);
    }

    const verified = params.get("verified");
    const reason = params.get("reason");
    if (verified === "success") {
      window.history.replaceState({}, "", "/");
      setVerifiedSuccess(true);
      toaster.create({ type: "success", title: "Email verified! You can now claim rewards." });
    } else if (verified === "already") {
      window.history.replaceState({}, "", "/");
      toaster.create({ type: "info", title: "Email already verified." });
    } else if (verified === "error") {
      window.history.replaceState({}, "", "/");
      toaster.create({ type: "error", title: `Verification failed: ${reason ?? "invalid or expired link"}` });
    }
  }, []);

  // After successful verification, open the RewardsModal once user + address are ready
  useEffect(() => {
    if (verifiedSuccess && address && openRewardsModal) {
      openRewardsModal();
      setVerifiedSuccess(false);
    }
  }, [verifiedSuccess, address, openRewardsModal]);

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
