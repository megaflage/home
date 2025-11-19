/**
 * Configuration and constants for the physics simulation
 */

export const PHYSICS_CONFIG = {
  gravity: {
    x: 0,
    y: 0,
    scale: 0.001,
  },
  wallThickness: 50,
  minSpeed: 0.8,
  initialSpeedRange: {
    min: 1,
    max: 3,
  },
} as const;

export const BADGER_CONFIG = {
  sizeRange: {
    min: 40,
    max: 52,
  },
  restitution: 1,
  frictionAir: 0.02,
  friction: 0.02,
  density: 0.0008,
  renderScale: 1.9,
} as const;

export const BADGER_COLORS = [
  "#FFFFFF", // White
  "#F5F5F5", // Very light grey
  "#E0E0E0", // Light grey
  "#CCCCCC", // Light-medium grey
  "#B0B0B0", // Medium-light grey
  "#999999", // Medium grey
  "#808080", // True grey
  "#666666", // Dark grey
  "#4D4D4D", // Darker grey
  "#333333", // Very dark grey
  "#1A1A1A", // Almost black
  "#000000", // Black
] as const;

export const GLOW_CONFIG = {
  ambient: {
    radiusMultiplier: 0.6,
    stops: [
      { offset: 0, alpha: 0.12 },
      { offset: 0.3, alpha: 0.06 },
      { offset: 0.6, alpha: 0.03 },
      { offset: 1, alpha: 0 },
    ],
  },
  medium: {
    radiusMultiplier: 8,
    stops: [
      { offset: 0, alpha: 0.2 },
      { offset: 0.4, alpha: 0.1 },
      { offset: 0.7, alpha: 0.04 },
      { offset: 1, alpha: 0 },
    ],
  },
  close: {
    radiusMultiplier: 3,
    stops: [
      { offset: 0, alpha: 0.4 },
      { offset: 0.3, alpha: 0.25 },
      { offset: 0.6, alpha: 0.1 },
      { offset: 1, alpha: 0 },
    ],
  },
  overlay: {
    stops: [
      { offset: 0, alpha: 0.3 },
      { offset: 0.5, alpha: 0.15 },
      { offset: 1, alpha: 0 },
    ],
  },
} as const;

