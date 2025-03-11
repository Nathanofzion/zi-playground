"use client";

import { Grid } from "@chakra-ui/react";

import Viewer from "@/components/Earth";
import { useSorobanReact } from "@soroban-react/core";

export default function Home() {
  const { address } = useSorobanReact();

  return (
    <Grid flex='1 1 0' templateColumns={{ lg: 'repeat(2, minmax(0, 1fr))' }}>
      <Viewer startAnimation={!!address} />
    </Grid>
  );
}
