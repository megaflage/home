/**
 * Utility functions for physics simulation and rendering
 */

/**
 * Converts a hex color string to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace("#", "");
  return {
    r: parseInt(cleanHex.substr(0, 2), 16),
    g: parseInt(cleanHex.substr(2, 2), 16),
    b: parseInt(cleanHex.substr(4, 2), 16),
  };
}

/**
 * Creates a radial gradient with the given color stops
 */
export function createColoredGradient(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  rgb: { r: number; g: number; b: number },
  stops: Array<{ offset: number; alpha: number }>
): CanvasGradient {
  const gradient = context.createRadialGradient(
    x,
    y,
    innerRadius,
    x,
    y,
    outerRadius
  );

  stops.forEach((stop) => {
    gradient.addColorStop(
      stop.offset,
      `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${stop.alpha})`
    );
  });

  return gradient;
}

/**
 * Draws a glow effect at the specified position
 */
export function drawGlow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  gradient: CanvasGradient
): void {
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

