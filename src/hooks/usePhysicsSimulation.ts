import { useEffect, useRef } from "react";
import Matter from "matter-js";
import {
  PHYSICS_CONFIG,
  BADGER_CONFIG,
  BADGER_COLORS,
  GLOW_CONFIG,
} from "@/lib/physics-config";
import {
  hexToRgb,
  createColoredGradient,
  drawGlow,
} from "@/lib/physics-utils";

/**
 * Custom hook for managing the Matter.js physics simulation with floating badgers
 */
export function usePhysicsSimulation() {
  const physicsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!physicsRef.current) return;

    // Load badger SVG
    const badgerImg = new Image();
    badgerImg.src = "/badger.svg";
    let imageLoaded = false;
    badgerImg.onload = () => {
      imageLoaded = true;
    };

    // Module aliases
    const { Engine, Render, Runner, Body, Bodies, Composite, Mouse, MouseConstraint, Events } = Matter;

    // Create engine with no gravity for floating effect
    const engine = Engine.create({
      gravity: PHYSICS_CONFIG.gravity,
    });

    const width = physicsRef.current.clientWidth || 800;
    const height = physicsRef.current.clientHeight || 600;
    const pixelRatio = window.devicePixelRatio || 1;

    // Create renderer
    const render = Render.create({
      element: physicsRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: "#000000",
        showAngleIndicator: false,
        showCollisions: false,
        showVelocity: false,
        pixelRatio,
      },
    });

    // Create badger bodies
    const badgerBodies = createBadgerBodies(width, height);

    // Create walls
    const walls = createWalls(width, height);

    // Create mouse interaction
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false,
        },
      },
    });

    // Add all bodies to the world
    Composite.add(engine.world, [...badgerBodies, ...walls, mouseConstraint]);

    // Keep the mouse in sync with rendering
    render.mouse = mouse;

    // Fit the render viewport to the scene
    Render.lookAt(render, {
      min: { x: 0, y: 0 },
      max: { x: width, y: height },
    });

    // Setup canvas rendering
    render.canvas.style.imageRendering = "auto";
    render.canvas.style.imageRendering = "-webkit-optimize-contrast";

    // Custom rendering for badgers with glowing effects
    Events.on(render, "afterRender", () => {
      renderBadgers(render, badgerBodies, badgerImg, imageLoaded, width, height);
    });

    // Maintain minimum velocity for continuous floating
    Events.on(engine, "afterUpdate", () => {
      maintainBadgerVelocity(badgerBodies);
    });

    // Allow scroll wheel to work on the canvas
    const handleWheel = (e: WheelEvent) => {
      const scrollContainer = physicsRef.current?.closest("main");
      if (scrollContainer) {
        scrollContainer.scrollBy({
          top: e.deltaY,
          behavior: "auto",
        });
      }
    };

    render.canvas.addEventListener("wheel", handleWheel, { passive: true });

    // Start the simulation
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Cleanup
    return () => {
      render.canvas.removeEventListener("wheel", handleWheel);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  }, []);

  return physicsRef;
}

/**
 * Creates badger bodies with random positions and velocities
 */
function createBadgerBodies(width: number, height: number): Matter.Body[] {
  const badgerBodies: Matter.Body[] = [];

  BADGER_COLORS.forEach((color) => {
    const x = 100 + Math.random() * (width - 200);
    const y = 100 + Math.random() * (height - 200);
    const size = BADGER_CONFIG.sizeRange.min + Math.random() * (BADGER_CONFIG.sizeRange.max - BADGER_CONFIG.sizeRange.min);

    const body = Matter.Bodies.circle(x, y, size, {
      restitution: BADGER_CONFIG.restitution,
      frictionAir: BADGER_CONFIG.frictionAir,
      friction: BADGER_CONFIG.friction,
      density: BADGER_CONFIG.density,
      render: {
        visible: false,
      },
    });

    // Give each badger a random initial velocity
    const speed = PHYSICS_CONFIG.initialSpeedRange.min + Math.random() * (PHYSICS_CONFIG.initialSpeedRange.max - PHYSICS_CONFIG.initialSpeedRange.min);
    const angle = Math.random() * Math.PI * 2;
    Matter.Body.setVelocity(body, {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    });

    // Store metadata
    (body as any).color = color;
    (body as any).size = size;

    badgerBodies.push(body);
  });

  return badgerBodies;
}

/**
 * Creates invisible walls around the screen
 */
function createWalls(width: number, height: number): Matter.Body[] {
  const wallThickness = PHYSICS_CONFIG.wallThickness;
  const wallOptions = {
    isStatic: true,
    restitution: 1,
    friction: 0,
    render: { visible: false },
  };

  return [
    // Top wall
    Matter.Bodies.rectangle(
      width / 2,
      -wallThickness / 2,
      width + wallThickness * 2,
      wallThickness,
      wallOptions
    ),
    // Bottom wall
    Matter.Bodies.rectangle(
      width / 2,
      height + wallThickness / 2,
      width + wallThickness * 2,
      wallThickness,
      wallOptions
    ),
    // Left wall
    Matter.Bodies.rectangle(
      -wallThickness / 2,
      height / 2,
      wallThickness,
      height + wallThickness * 2,
      wallOptions
    ),
    // Right wall
    Matter.Bodies.rectangle(
      width + wallThickness / 2,
      height / 2,
      wallThickness,
      height + wallThickness * 2,
      wallOptions
    ),
  ];
}

/**
 * Renders badgers with glow effects
 */
function renderBadgers(
  render: Matter.Render,
  badgerBodies: Matter.Body[],
  badgerImg: HTMLImageElement,
  imageLoaded: boolean,
  width: number,
  height: number
): void {
  const context = render.canvas.getContext("2d");
  if (!context) return;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.save();

  // First pass: Draw ambient background illumination
  context.globalCompositeOperation = "screen";
  badgerBodies.forEach((body) => {
    drawAmbientGlow(context, body, width, height);
  });

  // Second pass: Draw close-range glows
  badgerBodies.forEach((body) => {
    drawCloseGlow(context, body);
  });

  // Third pass: Draw the actual badgers
  context.globalCompositeOperation = "source-over";
  badgerBodies.forEach((body) => {
    drawBadger(context, body, badgerImg, imageLoaded);
  });

  context.restore();
}

/**
 * Draws ambient and medium range glow for a badger
 */
function drawAmbientGlow(
  context: CanvasRenderingContext2D,
  body: Matter.Body,
  width: number,
  height: number
): void {
  const color = (body as any).color;
  const size = (body as any).size || 40;
  const { x, y } = body.position;
  const rgb = hexToRgb(color);

  // Large ambient glow
  const ambientRadius = Math.max(width, height) * GLOW_CONFIG.ambient.radiusMultiplier;
  const ambientGradient = createColoredGradient(
    context,
    x,
    y,
    size * 2,
    ambientRadius,
    rgb,
    GLOW_CONFIG.ambient.stops
  );
  drawGlow(context, x, y, ambientRadius, ambientGradient);

  // Medium range glow
  const mediumRadius = size * GLOW_CONFIG.medium.radiusMultiplier;
  const mediumGradient = createColoredGradient(
    context,
    x,
    y,
    size,
    mediumRadius,
    rgb,
    GLOW_CONFIG.medium.stops
  );
  drawGlow(context, x, y, mediumRadius, mediumGradient);
}

/**
 * Draws close-range glow around a badger
 */
function drawCloseGlow(
  context: CanvasRenderingContext2D,
  body: Matter.Body
): void {
  const color = (body as any).color;
  const size = (body as any).size || 40;
  const { x, y } = body.position;
  const rgb = hexToRgb(color);

  const closeGlowRadius = size * GLOW_CONFIG.close.radiusMultiplier;
  const closeGradient = createColoredGradient(
    context,
    x,
    y,
    0,
    closeGlowRadius,
    rgb,
    GLOW_CONFIG.close.stops
  );
  drawGlow(context, x, y, closeGlowRadius, closeGradient);
}

/**
 * Draws a single badger with image and overlay
 */
function drawBadger(
  context: CanvasRenderingContext2D,
  body: Matter.Body,
  badgerImg: HTMLImageElement,
  imageLoaded: boolean
): void {
  const color = (body as any).color;
  const size = (body as any).size || 40;
  const { x, y } = body.position;
  const angle = body.angle;
  const rgb = hexToRgb(color);

  context.save();
  context.translate(x, y);
  context.rotate(angle);

  const badgerSize = size * BADGER_CONFIG.renderScale;

  // Draw badger image
  if (imageLoaded && badgerImg.complete) {
    context.drawImage(
      badgerImg,
      -badgerSize / 2,
      -badgerSize / 2,
      badgerSize,
      badgerSize
    );
  }

  // Add colored glow overlay
  const brightSpot = createColoredGradient(
    context,
    0,
    0,
    0,
    badgerSize,
    rgb,
    GLOW_CONFIG.overlay.stops
  );

  context.globalCompositeOperation = "screen";
  context.fillStyle = brightSpot;
  context.beginPath();
  context.arc(0, 0, badgerSize, 0, Math.PI * 2);
  context.fill();
  context.globalCompositeOperation = "source-over";

  context.restore();
}

/**
 * Maintains minimum velocity for badgers to keep them floating
 */
function maintainBadgerVelocity(badgerBodies: Matter.Body[]): void {
  badgerBodies.forEach((body) => {
    const velocity = body.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const minSpeed = PHYSICS_CONFIG.minSpeed;

    if (speed < minSpeed && speed > 0.01) {
      const scale = minSpeed / speed;
      Matter.Body.setVelocity(body, {
        x: velocity.x * scale,
        y: velocity.y * scale,
      });
    } else if (speed < 0.01) {
      const angle = Math.random() * Math.PI * 2;
      Matter.Body.setVelocity(body, {
        x: Math.cos(angle) * minSpeed,
        y: Math.sin(angle) * minSpeed,
      });
    }
  });
}

