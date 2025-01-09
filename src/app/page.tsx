"use client";
import { useContext } from "react";

import { Grid } from "@chakra-ui/react";

import Viewer from "@/components/Earth";
import { AppContext } from "@/providers";

export default function Home() {
  const { startAnimation } = useContext(AppContext);

  return (
    <Grid flex='1 1 0' templateColumns={{ lg: 'repeat(2, minmax(0, 1fr))' }}>
      <Viewer startAnimation={startAnimation} />
    </Grid>
  );
}
