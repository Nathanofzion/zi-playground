import React, { useEffect, useState } from "react";
import { useCallback } from "react";
import Particles from "react-particles";
import { loadSlim } from "tsparticles-slim";
import { loadImageShape } from "tsparticles-shape-image";

const BgParticles = ({ isDarkMode }) => {
  const [width, setWidth] = useState(window.innerWidth);

  function handleWindowSizeChange() {
    setWidth(window.innerWidth);
  }

  useEffect(() => {
    window.addEventListener("resize", handleWindowSizeChange);
    return () => {
      window.removeEventListener("resize", handleWindowSizeChange);
    };
  }, []);

  const isMobile = width <= 768;

  const particlesInit = useCallback(async (engine) => {
    // console.log(engine);
    await loadSlim(engine);
    await loadImageShape(engine);
  }, []);

  const particlesLoaded = useCallback(async (container) => {
    await null;
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={{
        background: {
          color: {
            value: isDarkMode ? "#0F1016" : "#ffffff",
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
            value: isDarkMode ? "#000000" : "#ffffff",
          },
          links: {
            color: isDarkMode ? "#fff" : "#000",
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
            value: isMobile ? 35 : 80,
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
            value: { min: 4, max: 12.5 },
          },
        },
        detectRetina: true,
      }}
    />
  );
};

export default BgParticles;
