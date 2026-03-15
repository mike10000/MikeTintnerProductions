"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 100;
const MOUSE_RADIUS = 150;

export function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      density: number;
      velocity: { x: number; y: number };
      draw: () => void;
      update: () => void;
    }[] = [];
    let animationId: number;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function handleMouseMove(e: MouseEvent) {
      mouseRef.current.x = e.x;
      mouseRef.current.y = e.y;
    }

    class Particle {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      density: number;
      velocity: { x: number; y: number };

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.baseX = this.x;
        this.baseY = this.y;
        this.size = Math.random() * 2 + 1;
        this.density = Math.random() * 30 + 1;
        this.velocity = {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5,
        };
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }

      update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        if (this.x < 0 || this.x > canvas!.width) this.velocity.x *= -1;
        if (this.y < 0 || this.y > canvas!.height) this.velocity.y *= -1;

        const mouse = mouseRef.current;
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < MOUSE_RADIUS) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
          const directionX = forceDirectionX * force * this.density;
          const directionY = forceDirectionY * force * this.density;

          this.x -= directionX;
          this.y -= directionY;
        }
      }
    }

    function init() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }
    }

    function connect() {
      if (!ctx) return;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const distance =
            (particles[a].x - particles[b].x) * (particles[a].x - particles[b].x) +
            (particles[a].y - particles[b].y) * (particles[a].y - particles[b].y);

          if (distance < (canvas!.width / 7) * (canvas!.height / 7)) {
            const opacity = 1 - distance / 20000;
            ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.2})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
        particles[i].update();
      }
      connect();
      animationId = requestAnimationFrame(animate);
    }

    resize();
    init();
    animate();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div id="hero-canvas-container">
      <canvas ref={canvasRef} id="hero-canvas" className="block" />
    </div>
  );
}
