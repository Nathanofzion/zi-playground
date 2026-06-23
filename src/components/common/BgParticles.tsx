"use client"
import { useMemo } from "react";
import { Particles, ParticlesProvider } from "@tsparticles/react";
import type { Engine } from "@tsparticles/engine";

async function initEngine(engine: Engine) {
  const { loadSlim } = await import("@tsparticles/slim");
  const { loadImageShape } = await import("@tsparticles/shape-image");
  await loadSlim(engine as any);
  await loadImageShape(engine as any);
}

const BgParticles = () => {
  const options = useMemo(() => ({
    background: { color: { value: "#000000" } },
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
      color: { value: "#ffffff" },
      links: { color: "#ffffff", distance: 150, enable: true, opacity: 0.5, width: 1 },
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
  }), []);

  return (
    <ParticlesProvider init={initEngine}>
      <Particles id="tsparticles" options={options} />
    </ParticlesProvider>
  );
}

export default BgParticles;
