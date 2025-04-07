"use client";
import { useContext } from "react";

import { Grid } from "@chakra-ui/react";
import { useSorobanReact } from "@soroban-react/core";

import Viewer from "@/components/Earth";
import { Theme } from "@/enums";
import { AppContext } from "@/providers";

export default function Home() {
  const { theme } = useContext(AppContext);
  const { address } = useSorobanReact();

  return (
    <Grid flex='1 1 0' templateColumns={{ lg: 'repeat(2, minmax(0, 1fr))' }}>
      {theme != Theme.SpaceInvaders && (
        <Viewer startAnimation={!!address} />
      )}
    </Grid>
  );
}
