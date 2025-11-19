"use client";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import Matter from "matter-js";

export default function Home() {
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

    // module aliases
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const Runner = Matter.Runner;
    const Body = Matter.Body;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;

    // create an engine with no gravity for floating effect
    const engine = Engine.create({
      gravity: {
        x: 0,
        y: 0, // No gravity - badgers float freely
        scale: 0.001,
      },
    });

    const width = physicsRef.current.clientWidth || 800;
    const height = physicsRef.current.clientHeight || 600;

    // Get device pixel ratio for high DPI displays
    const pixelRatio = window.devicePixelRatio || 1;

    // create a renderer
    const render = Render.create({
      element: physicsRef.current,
      engine: engine,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: "#000000",
        showAngleIndicator: false,
        showCollisions: false,
        showVelocity: false,
        pixelRatio: pixelRatio,
      },
    });

    // Create badger objects with different colors
    const badgerBodies: Matter.Body[] = [];
    const badgerColors = [
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
    ];

    // Create badgers scattered all around the screen
    badgerColors.forEach((color, index) => {
      const x = 100 + Math.random() * (width - 200);
      const y = 100 + Math.random() * (height - 200);
      const size = 40 + Math.random() * 12;

      // Use circular bodies to prevent stretching
      const body = Bodies.circle(x, y, size, {
        restitution: 1, // Perfect bounce to keep energy
        frictionAir: 0.02, // No air friction - perpetual motion
        friction: 0.02, // No friction with other objects
        density: 0.0008,
        render: {
          visible: false,
        },
      });

      // Give each badger a random initial velocity to start floating
      const speed = 1 + Math.random() * 2; // Increased speed range
      const angle = Math.random() * Math.PI * 2;
      Body.setVelocity(body, {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      });

      // Store metadata
      (body as any).color = color;
      (body as any).size = size;

      badgerBodies.push(body);
    });

    // Create invisible walls around the screen to keep badgers bouncing
    const wallThickness = 50;
    const wallOptions = {
      isStatic: true,
      restitution: 1, // Perfect bounce - no energy loss
      friction: 0, // No friction
      render: { visible: false },
    };

    const walls = [
      // Top wall
      Bodies.rectangle(
        width / 2,
        -wallThickness / 2,
        width + wallThickness * 2,
        wallThickness,
        wallOptions
      ),
      // Bottom wall
      Bodies.rectangle(
        width / 2,
        height + wallThickness / 2,
        width + wallThickness * 2,
        wallThickness,
        wallOptions
      ),
      // Left wall
      Bodies.rectangle(
        -wallThickness / 2,
        height / 2,
        wallThickness,
        height + wallThickness * 2,
        wallOptions
      ),
      // Right wall
      Bodies.rectangle(
        width + wallThickness / 2,
        height / 2,
        wallThickness,
        height + wallThickness * 2,
        wallOptions
      ),
    ];

    // create mouse
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

    // add all of the bodies to the world
    Composite.add(engine.world, [...badgerBodies, ...walls, mouseConstraint]);

    // keep the mouse in sync with rendering
    render.mouse = mouse;

    // fit the render viewport to the scene
    Render.lookAt(render, {
      min: { x: 0, y: 0 },
      max: { x: width, y: height },
    });

    // Clean rendering without filters
    render.canvas.style.imageRendering = "auto";
    render.canvas.style.imageRendering = "-webkit-optimize-contrast";

    // Setup event listeners for rendering and physics updates
    const Events = Matter.Events;

    // Custom rendering to draw badgers with glowing effects
    Events.on(render, "afterRender", () => {
      const context = render.canvas.getContext("2d");
      if (!context) return;

      // Enable high quality image smoothing for crisp SVGs
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      context.save();

      // First pass: Draw background illumination from all badgers
      context.globalCompositeOperation = "screen";

      badgerBodies.forEach((body) => {
        const color = (body as any).color;
        const size = (body as any).size || 40;
        const x = body.position.x;
        const y = body.position.y;

        // Convert hex color to RGB for glow effects
        const hex = color.replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Large ambient glow that lights up the page
        const ambientRadius = Math.max(width, height) * 0.6;
        const ambientGradient = context.createRadialGradient(
          x,
          y,
          size * 2,
          x,
          y,
          ambientRadius
        );

        ambientGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.12)`);
        ambientGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.06)`);
        ambientGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.03)`);
        ambientGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        context.fillStyle = ambientGradient;
        context.fillRect(
          x - ambientRadius,
          y - ambientRadius,
          ambientRadius * 2,
          ambientRadius * 2
        );

        // Medium range glow
        const mediumRadius = size * 8;
        const mediumGradient = context.createRadialGradient(
          x,
          y,
          size,
          x,
          y,
          mediumRadius
        );

        mediumGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.2)`);
        mediumGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.1)`);
        mediumGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, 0.04)`);
        mediumGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        context.fillStyle = mediumGradient;
        context.fillRect(
          x - mediumRadius,
          y - mediumRadius,
          mediumRadius * 2,
          mediumRadius * 2
        );
      });

      // Second pass: Draw object glows
      badgerBodies.forEach((body) => {
        const color = (body as any).color;
        const size = (body as any).size || 40;
        const x = body.position.x;
        const y = body.position.y;

        // Convert hex color to RGB
        const hex = color.replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Close-range glow around object
        const closeGlowRadius = size * 3;
        const closeGradient = context.createRadialGradient(
          x,
          y,
          0,
          x,
          y,
          closeGlowRadius
        );

        closeGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.4)`);
        closeGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.25)`);
        closeGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.1)`);
        closeGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        context.fillStyle = closeGradient;
        context.fillRect(
          x - closeGlowRadius,
          y - closeGlowRadius,
          closeGlowRadius * 2,
          closeGlowRadius * 2
        );
      });

      // Third pass: Draw the actual badgers
      context.globalCompositeOperation = "source-over";

      badgerBodies.forEach((body) => {
        const color = (body as any).color;
        const size = (body as any).size || 40;
        const x = body.position.x;
        const y = body.position.y;
        const angle = body.angle;

        context.save();
        context.translate(x, y);
        context.rotate(angle);

        // Convert hex to RGB for gradients
        const hex = color.replace("#", "");
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Draw badger image - use square size to maintain aspect ratio
        const badgerSize = size * 1.9;

        if (imageLoaded && badgerImg.complete) {
          // Draw the badger image without stretching
          context.drawImage(
            badgerImg,
            -badgerSize / 2,
            -badgerSize / 2,
            badgerSize,
            badgerSize
          );
        }

        // Add subtle colored glow overlay for luminosity
        const brightSpot = context.createRadialGradient(
          0,
          0,
          0,
          0,
          0,
          badgerSize
        );
        brightSpot.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
        brightSpot.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.15)`);
        brightSpot.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        context.globalCompositeOperation = "screen";
        context.fillStyle = brightSpot;
        context.beginPath();
        context.arc(0, 0, badgerSize, 0, Math.PI * 2);
        context.fill();
        context.globalCompositeOperation = "source-over";

        context.restore();
      });

      context.restore();
    });

    // Maintain minimum velocity for continuous floating
    Events.on(engine, "afterUpdate", () => {
      badgerBodies.forEach((body) => {
        const velocity = body.velocity;
        const speed = Math.sqrt(
          velocity.x * velocity.x + velocity.y * velocity.y
        );
        const minSpeed = 0.8; // Minimum speed to maintain

        // If badger is moving too slowly, give it a gentle push
        if (speed < minSpeed && speed > 0.01) {
          const scale = minSpeed / speed;
          Body.setVelocity(body, {
            x: velocity.x * scale,
            y: velocity.y * scale,
          });
        } else if (speed < 0.01) {
          // If completely stopped, give random direction
          const angle = Math.random() * Math.PI * 2;
          Body.setVelocity(body, {
            x: Math.cos(angle) * minSpeed,
            y: Math.sin(angle) * minSpeed,
          });
        }
      });
    });

    // run the renderer
    Render.run(render);

    // create runner
    const runner = Runner.create();

    // run the engine
    Runner.run(runner, engine);

    // cleanup
    return () => {
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  }, []);

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section with LED Strip */}
      <section className="relative min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden">
        {/* LED Strip Canvas - positioned on top */}
        <div ref={physicsRef} className="absolute inset-0 w-full h-full z-40" />

        {/* Text content - above chain */}
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
          <div className="pointer-events-auto text-center text-white">
            <h1 className="text-9xl font-bold mb-4 text-white">Joseph Baker</h1>
            <p className="text-2xl">Full Stack Developer</p>
          </div>
        </div>
      </section>

      {/* Additional Content Section */}
      <section className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4">Your Name</h1>
          <p className="text-2xl">Full Stack Developer</p>
        </div>
      </section>
    </main>
  );
}
