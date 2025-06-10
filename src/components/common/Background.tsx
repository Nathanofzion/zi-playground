"use client";
import { useContext } from "react";

import { Box } from "@chakra-ui/react";

import { useColorModeValue } from "@/components/ui/color-mode";
import { Theme } from "@/enums";
import { AppContext } from "@/providers/AppProvider";
import BgAtomic from "./BgAtomic";
import BgParticles from "./BgParticles";
import BgTetris from "./BgTetris";
import BgSpaceInvaders from "./space-invaders";

const Background = () => {
  const { theme } = useContext(AppContext);

  return (
    <Box position="fixed" inset={0} bg={useColorModeValue("#fff", "#000")}>
      {theme == Theme.Atomic && <BgAtomic />}
      {theme == Theme.Particle && <BgParticles />}
      {theme == Theme.SpaceInvaders && <BgSpaceInvaders />}
      {theme == Theme.Tetris && <BgTetris />}
    </Box>
  );
};

export default Background;
