"use client"
import { useCallback, useMemo, useRef } from "react";
import { Particles, ParticlesProvider } from "@tsparticles/react";
import type { Container, Engine } from "@tsparticles/engine";

import { useColorModeValue } from "../ui/color-mode";

const CLICK_LIMIT = 40;

async function initEngine(engine: Engine) {
  const { loadSlim } = await import("@tsparticles/slim");
  const { loadImageShape } = await import("@tsparticles/shape-image");
  await loadSlim(engine as any);
  await loadImageShape(engine as any);
}

const BgParticles = () => {
  // Match Chakra UI defaultSystem dark bg.DEFAULT → colors.black = #09090b
  // Light bg.DEFAULT → colors.white = #ffffff
  const bgColor = useColorModeValue("#ffffff", "#09090b");
  const particleColor = useColorModeValue("#09090b", "#ffffff");
  const linkColor = useColorModeValue("#09090b", "#ffffff");

  const clickCountRef = useRef(0);
  const containerRef = useRef<Container | null>(null);

  const handleParticlesLoaded = useCallback((container?: Container) => {
    containerRef.current = container ?? null;
  }, []);

  // Track clicks on the canvas; after CLICK_LIMIT resets particle count to base
  const handleClick = useCallback(() => {
    clickCountRef.current += 1;
    if (clickCountRef.current >= CLICK_LIMIT) {
      clickCountRef.current = 0;
      containerRef.current?.refresh();
    }
  }, []);

  const options = useMemo(() => ({
    background: { color: { value: bgColor } },
    fpsLimit: 60,
    interactivity: {
      events: {
        onClick: { enable: true, mode: "push" },
        onHover: { enable: true, mode: "repulse" },
        resize: true,
      },
      modes: {
        push: { quantity: 4 },
        repulse: { distance: 200, duration: 0.4 },
      },
    },
    particles: {
      color: { value: particleColor },
      links: { color: linkColor, distance: 150, enable: true, opacity: 0.5, width: 1 },
      move: {
        direction: "none" as const,
        enable: true,
        outModes: { default: "bounce" as const },
        random: false,
        speed: 2.5,
        straight: false,
      },
      rotate: {
        value: 0,
        random: true,
        direction: "clockwise" as const,
        animation: { enable: true, speed: 12, sync: false },
      },
      number: { density: { enable: true, area: 800 }, value: 80 },
      opacity: { value: 1 },
      shape: {
        type: "image",
        image: { src: "https://res.cloudinary.com/dttrs30gt/image/upload/v1698163629/products/IMG_6020_hszal1.webp" },
      },
      size: { value: { min: 2.5, max: 6.5 } },
    },
    detectRetina: true,
  }), [bgColor, particleColor, linkColor]);

  return (
    <ParticlesProvider init={initEngine}>
      <div onClick={handleClick} style={{ position: "absolute", inset: 0 }}>
        <Particles
          id="tsparticles"
          options={options}
          particlesLoaded={handleParticlesLoaded}
        />
      </div>
    </ParticlesProvider>
  );
}

export default BgParticles;
