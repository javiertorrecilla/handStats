import React, { useRef, useEffect, useCallback } from "react";

/**
 * Paleta de gradiente térmico continuo de alta fidelidad:
 * Transparente -> Verde-Lima -> Amarillo -> Naranja -> Rojo -> Carmesí
 */
const DEFAULT_HEAT_GRADIENT = [
  { stop: 0.00, color: "rgba(0, 0, 0, 0)" },
  { stop: 0.12, color: "rgba(163, 230, 53, 0.50)" }, // #a3e635 Lima / Amarillo-verde
  { stop: 0.28, color: "rgba(250, 204, 21, 0.72)" }, // #facc15 Amarillo brillante
  { stop: 0.52, color: "rgba(249, 115, 22, 0.86)" }, // #f97316 Naranja cálido
  { stop: 0.75, color: "rgba(239, 68, 68, 0.94)" },  // #ef4444 Rojo intenso
  { stop: 0.90, color: "rgba(185, 28, 28, 0.98)" },  // #b91c1c Carmesí
  { stop: 1.00, color: "rgba(127, 29, 29, 1.00)" }   // #7f1d1d Burdeos profundo
];

/**
 * Crea una tabla de búsqueda (LUT) de 256 colores a partir del gradiente.
 */
function createGradientPalette(gradientStops = DEFAULT_HEAT_GRADIENT) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  gradientStops.forEach(({ stop, color }) => {
    grad.addColorStop(stop, color);
  });

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 1);

  return ctx.getImageData(0, 0, 256, 1).data;
}

/**
 * Componente Canvas 2D de alta densidad para renderizar mapas de calor continuos.
 */
export function ContinuousHeatmapCanvas({
  points = [],
  radius = 34,
  blur = 0.85,
  opacity = 0.88,
  minAlphaCutoff = 4,
  className = "",
  style = {}
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const paletteRef = useRef(null);

  if (!paletteRef.current) {
    paletteRef.current = createGradientPalette(DEFAULT_HEAT_GRADIENT);
  }

  const renderHeatmap = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!points || points.length === 0) return;

    // 1. Crear Canvas auxiliar de intensidad / sombras
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = canvas.width;
    shadowCanvas.height = canvas.height;
    const sCtx = shadowCanvas.getContext("2d", { willReadFrequently: true });
    if (!sCtx) return;

    // Escalar radio según dimensiones
    const scaleFactor = (canvas.width / 400);
    const scaledRadius = Math.max(16, Math.round(radius * scaleFactor));
    const rBlur = scaledRadius * blur;

    // Normalizar intensidad de puntos
    const pointWeight = points.length < 5 ? 1.0 : points.length < 15 ? 0.8 : points.length < 30 ? 0.6 : 0.45;

    points.forEach((pt) => {
      if (typeof pt.x !== "number" || typeof pt.y !== "number") return;

      const px = (pt.x / 100) * canvas.width;
      const py = (pt.y / 100) * canvas.height;
      const weight = (pt.weight || 1) * pointWeight;

      const radGrad = sCtx.createRadialGradient(px, py, 0, px, py, scaledRadius);
      radGrad.addColorStop(0, `rgba(0, 0, 0, ${Math.min(1, 0.45 * weight)})`);
      radGrad.addColorStop(Math.min(0.9, blur), `rgba(0, 0, 0, ${Math.min(0.8, 0.25 * weight)})`);
      radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      sCtx.fillStyle = radGrad;
      sCtx.beginPath();
      sCtx.arc(px, py, scaledRadius, 0, Math.PI * 2);
      sCtx.fill();
    });

    // 2. Extraer datos de píxeles y colorear mediante la paleta LUT
    const imgData = sCtx.getImageData(0, 0, shadowCanvas.width, shadowCanvas.height);
    const pixels = imgData.data;
    const palette = paletteRef.current;
    if (!palette) return;

    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3];

      if (alpha > minAlphaCutoff) {
        const lutIndex = alpha * 4;
        pixels[i] = palette[lutIndex];         // R
        pixels[i + 1] = palette[lutIndex + 1]; // G
        pixels[i + 2] = palette[lutIndex + 2]; // B
        pixels[i + 3] = Math.round(palette[lutIndex + 3] * opacity * (alpha / 255)); // Alpha con transparencia suave
      } else {
        pixels[i + 3] = 0;
      }
    }

    // 3. Volcar imagen procesada al canvas visible
    ctx.putImageData(imgData, 0, 0);
  }, [points, radius, blur, opacity, minAlphaCutoff]);

  useEffect(() => {
    renderHeatmap();

    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      renderHeatmap();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [renderHeatmap]);

  return (
    <div
      ref={containerRef}
      className={`continuous-heatmap-canvas-container ${className}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2,
        ...style
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block"
        }}
      />
    </div>
  );
}
