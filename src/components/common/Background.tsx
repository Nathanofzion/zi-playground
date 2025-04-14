"use client";
import { useContext } from "react";

import { Box } from "@chakra-ui/react";

import { Theme } from "@/enums";
import { AppContext } from "@/providers";
import { useColorModeValue } from "../ui/color-mode";
import BgAtomic from "./BgAtomic";
import BgParticles from "./BgParticles";
import BgSpaceInvaders from "./BgSpaceInvaders";

const Background = () => {
  const { theme } = useContext(AppContext);

  return (
    <Box
      position='fixed'
      inset={0}
      bg={useColorModeValue("#fff", "#000")}
    >
      {theme == Theme.Atomic && (
        <BgAtomic />
      )}
      {/* {theme == Theme.Particle && (
        <BgParticles />
      )} */}
      {theme == Theme.SpaceInvaders && (
        <BgSpaceInvaders />
      )}
    </Box>
  )
}

export default Background;
