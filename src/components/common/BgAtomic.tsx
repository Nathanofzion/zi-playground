"use client";
import { FC, useCallback, useEffect, useRef } from "react";

interface GradientBubble {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  color: string;
  opacity: number;
}

interface Props {
  bubbleCount?: number;
  minRadius?: number;
  maxRadius?: number;
  opacityRange?: [number, number];
  speed?: number;
  colors?: string[];
}

const BgAtomic: FC<Props> = ({
  bubbleCount = 10,
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const bubblesRef = useRef<GradientBubble[]>([]);
  const dimensionsRef = useRef({ width: 0, height: 0 });

  const createBubble = useCallback(
    (
      width: number,
      height: number,
      defaultValues?: {
        x?: number;
        y?: number;
      }
    ) => {
      return {
        x: defaultValues?.x ?? Math.random() * width,
        y: defaultValues?.y ?? Math.random() * height,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        radius: minRadius + Math.random() * (maxRadius - minRadius),
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity:
          opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0]),
      };
    },
    [colors, maxRadius, minRadius, opacityRange]
  );

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const { width, height } = canvas.getBoundingClientRect();

        canvas.width = width;
        canvas.height = height;
        dimensionsRef.current = { width, height };

        bubblesRef.current = Array.from({ length: bubbleCount }, () =>
          createBubble(width, height)
        );
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [bubbleCount, createBubble]);

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

  useEffect(() => {
    const handlePCAddBubble = (e: MouseEvent) => {
      bubblesRef.current.push(
        createBubble(
          dimensionsRef.current.width,
          dimensionsRef.current.height,
          {
            x: e.clientX,
            y: e.clientY,
          }
        )
      );
    };
    const handleMobileAddBubble = (e: TouchEvent) => {
      bubblesRef.current.push(
        createBubble(
          dimensionsRef.current.width,
          dimensionsRef.current.height,
          {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          }
        )
      );
    };
    window.addEventListener("click", handlePCAddBubble);
    window.addEventListener("touchstart", handleMobileAddBubble);
    return () => {
      window.removeEventListener("click", handlePCAddBubble);
      window.removeEventListener("touchstart", handleMobileAddBubble);
    };
  }, [createBubble]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
};

export default BgAtomic;
