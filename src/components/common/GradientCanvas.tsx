"use client";

import { Box, BoxProps } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

interface GradientBubble {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
  opacity: number;
}

interface GradientCanvasProps extends BoxProps {
  bubbleCount?: number;
  minRadius?: number;
  maxRadius?: number;
  opacityRange?: [number, number];
  speed?: number;
  colors?: string[];
}

export function GradientCanvas({
  className,
  bubbleCount = 5,
  minRadius = 40,
  maxRadius = 60,
  opacityRange = [0.3, 0.7],
  speed = 0.2,
  colors = [
    "255, 100, 100",
    "100, 100, 255",
    "100, 255, 100",
    "255, 255, 100",
    "255, 100, 255",
  ],
  ...props
}: GradientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const bubblesRef = useRef<GradientBubble[]>([]);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  const initializeBubbles = (width: number, height: number) => {
    const bubbles: GradientBubble[] = [];

    for (let i = 0; i < bubbleCount; i++) {
      const radius = minRadius + Math.random() * (maxRadius - minRadius);

      bubbles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        radius: radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity:
          opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0]),
      });
    }

    return bubbles;
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const { width, height } = canvas.getBoundingClientRect();

        canvas.width = width;
        canvas.height = height;
        dimensionsRef.current = { width, height };

        bubblesRef.current = initializeBubbles(width, height);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [bubbleCount, minRadius, maxRadius, opacityRange, colors]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      if (!canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bubblesRef.current.forEach((bubble) => {
        bubble.x += (bubble.dx * speed * canvas.width) / 100;
        bubble.y += (bubble.dy * speed * canvas.height) / 100;

        if (bubble.x < 0 || bubble.x > canvas.width) {
          bubble.dx *= -1;
          bubble.dy += (Math.random() - 0.5) * 0.5;
        }
        if (bubble.y < 0 || bubble.y > canvas.height) {
          bubble.dy *= -1;
          bubble.dx += (Math.random() - 0.5) * 0.5;
        }

        const velocity = Math.sqrt(
          bubble.dx * bubble.dx + bubble.dy * bubble.dy
        );
        if (velocity > 2) {
          bubble.dx = (bubble.dx / velocity) * 2;
          bubble.dy = (bubble.dy / velocity) * 2;
        }

        const radiusPixels = Math.max(
          0.1,
          (bubble.radius / 100) * Math.min(canvas.width, canvas.height)
        );

        const gradient = ctx.createRadialGradient(
          bubble.x,
          bubble.y,
          0.1,
          bubble.x,
          bubble.y,
          radiusPixels
        );

        gradient.addColorStop(0, `rgba(${bubble.color}, ${bubble.opacity})`);
        gradient.addColorStop(1, `rgba(${bubble.color}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [speed]);

  return (
    <Box {...props}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </Box>
  );
}
