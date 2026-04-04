// ============================================================
// Ultimate Powerflow Card – Weather Overlay
// ============================================================
// Returns SVG/CSS overlay markup for weather conditions.

import type { WeatherCondition } from "../types";

export type OverlayType = "rain" | "snow" | "none";

/**
 * Map a weather condition string to an overlay type.
 */
export function getOverlayType(condition: WeatherCondition | undefined | null): OverlayType {
  if (!condition) return "none";
  const c = condition.toLowerCase();
  if (c === "rainy" || c === "pouring" || c === "lightning-rainy") return "rain";
  if (c === "snowy" || c === "snowy-rainy" || c === "hail") return "snow";
  return "none";
}

/**
 * Return the HTML/SVG string for a weather overlay to be placed
 * on top of the background image inside a positioned container.
 */
export function buildWeatherOverlayHtml(overlayType: OverlayType): string {
  if (overlayType === "rain") {
    return `<div class="upfc-weather-overlay upfc-rain">
      <canvas class="upfc-rain-canvas"></canvas>
    </div>`;
  }
  if (overlayType === "snow") {
    return `<div class="upfc-weather-overlay upfc-snow">
      <canvas class="upfc-snow-canvas"></canvas>
    </div>`;
  }
  return "";
}

/**
 * CSS for rain/snow overlays.
 */
export function getWeatherOverlayStyles(): string {
  return `
    .upfc-weather-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      border-radius: inherit;
      overflow: hidden;
      z-index: 2;
    }
    .upfc-rain-canvas,
    .upfc-snow-canvas {
      width: 100%;
      height: 100%;
      opacity: 0.45;
    }
  `;
}

interface Particle {
  x: number;
  y: number;
  len: number;
  speed: number;
  opacity: number;
}

/**
 * Animate rain on a canvas element.
 */
export function animateRain(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const drops: Particle[] = [];
  const COUNT = 80;

  const resize = () => {
    canvas.width = canvas.clientWidth || canvas.offsetWidth;
    canvas.height = canvas.clientHeight || canvas.offsetHeight;
  };
  resize();

  for (let i = 0; i < COUNT; i++) {
    drops.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      len: 10 + Math.random() * 20,
      speed: 8 + Math.random() * 10,
      opacity: 0.3 + Math.random() * 0.5,
    });
  }

  let rafId = 0;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drops.forEach((d) => {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 1, d.y + d.len);
      ctx.strokeStyle = `rgba(174, 214, 241, ${d.opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      d.y += d.speed;
      if (d.y > canvas.height) {
        d.y = -d.len;
        d.x = Math.random() * canvas.width;
      }
    });
    rafId = requestAnimationFrame(draw);
  };
  draw();
  return () => cancelAnimationFrame(rafId);
}

/**
 * Animate snow on a canvas element.
 */
export function animateSnow(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const flakes: Particle[] = [];
  const COUNT = 60;

  const resize = () => {
    canvas.width = canvas.clientWidth || canvas.offsetWidth;
    canvas.height = canvas.clientHeight || canvas.offsetHeight;
  };
  resize();

  for (let i = 0; i < COUNT; i++) {
    flakes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      len: 2 + Math.random() * 4,
      speed: 1 + Math.random() * 2,
      opacity: 0.5 + Math.random() * 0.5,
    });
  }

  let rafId = 0;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    flakes.forEach((f) => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.len, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${f.opacity})`;
      ctx.fill();
      f.y += f.speed;
      f.x += Math.sin(f.y / 30) * 0.5;
      if (f.y > canvas.height) {
        f.y = -f.len * 2;
        f.x = Math.random() * canvas.width;
      }
    });
    rafId = requestAnimationFrame(draw);
  };
  draw();
  return () => cancelAnimationFrame(rafId);
}
