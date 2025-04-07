"use client"
import { useCallback } from "react";
import Particles from "react-particles";
import { loadImageShape } from "tsparticles-shape-image";
import { loadSlim } from "tsparticles-slim";

import { useColorModeValue } from "../ui/color-mode";

const BgParticles = () => {
  const particlesInit = useCallback(async (engine: any) => {
    await loadSlim(engine);
    await loadImageShape(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={async () => { }}
      options={{
        background: {
          color: {
            value: useColorModeValue("#fff", "#0F1016"),
          },
        },
        fpsLimit: 120,
        interactivity: {
          events: {
            onClick: {
              enable: true,
              mode: "push",
            },
            onHover: {
              enable: true,
              mode: "repulse",
            },
            resize: true,
          },
          modes: {
            push: {
              quantity: 4,
            },
            repulse: {
              distance: 200,
              duration: 0.4,
            },
          },
        },
        particles: {
          color: {
            value: useColorModeValue("#fff", "#000"),
          },
          links: {
            color: useColorModeValue("#000", "#fff"),
            distance: 150,
            enable: true,
            opacity: 0.5,
            width: 1,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: false,
            speed: 2.5,
            straight: false,
          },
          rotate: {
            value: 0,
            random: true,
            direction: "clockwise",
            animation: {
              enable: true,
              speed: 12,
              sync: false,
            },
          },
          number: {
            density: {
              enable: true,
              area: 800,
            },
            value: 80,
          },
          opacity: {
            value: 1,
          },
          shape: {
            type: "image",
            image: {
              src: "https://res.cloudinary.com/dttrs30gt/image/upload/v1698163629/products/IMG_6020_hszal1.webp",
            },
          },
          size: {
            value: { min: 2.5, max: 6.5 },
          },
        },
        detectRetina: true,
      }}
    />
  )
}

export default BgParticles;
