import { useContext } from "react";

import { Theme } from "@/enums";
import { AppContext } from "@/providers";
import { BgAtomic } from "./BgAtomic";
import BgParticles from "./BgParticles";

const Background = () => {
  const { theme } = useContext(AppContext);

  if (theme == Theme.Atomic) {
    return <BgAtomic />
  }

  if (theme == Theme.Particle) {
    return <BgParticles />
  }

  return <></>
}

export default Background;
