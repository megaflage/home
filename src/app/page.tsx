"use client";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import Matter from "matter-js";

export default function Home() {
  const physicsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!physicsRef.current) return;

    // module aliases
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const Runner = Matter.Runner;
    const Body = Matter.Body;
    const Bodies = Matter.Bodies;
    const Composite = Matter.Composite;
    const Composites = Matter.Composites;
    const Constraint = Matter.Constraint;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;

    // create an engine
    const engine = Engine.create();

    const width = physicsRef.current.clientWidth || 800;
    const height = physicsRef.current.clientHeight || 600;

    // create a renderer
    const render = Render.create({
      element: physicsRef.current,
      engine: engine,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: "#000000",
        showAngleIndicator: true,
        showCollisions: true,
        showVelocity: true,
      },
    });

    // create chain with rectangular bodies styled as COB LED strip
    const group = Body.nextGroup(true);

    // Calculate center position at top
    const startX = width / 2;
    const anchorY = 0; // Anchor at the very top
    const startY = 10; // First body center (body is 20px tall, so top edge aligns with anchor)

    // Create chain starting at top center
    // Bodies are 50 wide with 10 spacing, so distance between centers is 60
    const ropeA = Composites.stack(
      startX, // First body center at top center
      startY,
      6, // Reduced from 8 to 6 for shorter chain
      1,
      10,
      10,
      function (x: number, y: number) {
        return Bodies.rectangle(x, y, 50, 20, {
          collisionFilter: { group: group },
          render: {
            visible: false, // Hide individual segments to create seamless snake appearance
          },
        });
      }
    );

    Composites.chain(ropeA, 0.5, 0, -0.5, 0, {
      stiffness: 0.8,
      length: 0, // No gap for seamless COB LED appearance
      render: {
        visible: false, // Hide default constraint rendering, we'll draw custom smooth lines
      },
    });

    // Anchor the first body's top edge to the very top center
    Composite.add(
      ropeA,
      Constraint.create({
        bodyB: ropeA.bodies[0],
        pointB: { x: 0, y: -10 }, // Top edge of first body relative to its center
        pointA: { x: startX, y: anchorY }, // Anchor at very top (y=0)
        stiffness: 0.9, // Higher stiffness to keep it at the top
        render: {
          visible: false,
        },
      })
    );

    // create ground
    const ground = Bodies.rectangle(width / 2, height - 30, width, 60, {
      isStatic: true,
    });

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
    Composite.add(engine.world, [ropeA, ground, mouseConstraint]);

    // keep the mouse in sync with rendering
    render.mouse = mouse;

    // fit the render viewport to the scene
    Render.lookAt(render, {
      min: { x: 0, y: 0 },
      max: { x: width, y: height },
    });

    // Subtle canvas glow for additional realism - warm white, reduced intensity
    render.canvas.style.filter =
      "drop-shadow(0 0 10px rgba(255, 248, 225, 0.2))";
    render.canvas.style.imageRendering = "smooth";

    // Custom rendering to draw clean LED strip with individual chips
    const Events = Matter.Events;
    Events.on(render, "afterRender", () => {
      const context = render.canvas.getContext("2d");
      if (!context) return;

      if (ropeA.bodies.length === 0) return;

      // Enable shadow rendering for glow effects
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;

      context.save();

      // Calculate path points - start from anchor point at top
      const anchorConstraint = ropeA.constraints.find(
        (c: any) => c.pointA && c.pointA.y === 0
      );
      const anchorPoint = anchorConstraint
        ? { x: anchorConstraint.pointA.x, y: anchorConstraint.pointA.y }
        : { x: width / 2, y: 0 };

      const pathPoints: { x: number; y: number; angle: number }[] = [];

      // Start path from anchor point at the very top
      if (ropeA.bodies.length > 0) {
        const firstBody = ropeA.bodies[0];
        const angleToFirst = Math.atan2(
          firstBody.position.y - anchorPoint.y,
          firstBody.position.x - anchorPoint.x
        );
        pathPoints.push({
          x: anchorPoint.x,
          y: anchorPoint.y,
          angle: angleToFirst,
        });
      }

      // Add body positions
      for (let i = 0; i < ropeA.bodies.length; i++) {
        const body = ropeA.bodies[i];
        let angle = 0;
        if (i === 0 && pathPoints.length > 0) {
          // Use angle from anchor to first body
          angle = pathPoints[0].angle;
        } else if (i < ropeA.bodies.length - 1) {
          const nextBody = ropeA.bodies[i + 1];
          angle = Math.atan2(
            nextBody.position.y - body.position.y,
            nextBody.position.x - body.position.x
          );
        } else if (i > 0) {
          const prevBody = ropeA.bodies[i - 1];
          angle = Math.atan2(
            body.position.y - prevBody.position.y,
            body.position.x - prevBody.position.x
          );
        }
        pathPoints.push({ x: body.position.x, y: body.position.y, angle });
      }

      // Draw background illumination first (light hitting the surface)
      // This creates the effect of the background being lit by the LED strip
      context.globalCompositeOperation = "screen"; // Light blending to illuminate dark background

      // Draw illuminated background areas along the path
      // This simulates the LED light hitting and illuminating the dark surface
      const backgroundGlowSpacing = 25;

      for (let i = 0; i < pathPoints.length - 1; i++) {
        const current = pathPoints[i];
        const next = pathPoints[i + 1];
        const segmentLength = Math.sqrt(
          Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2)
        );
        const steps = Math.ceil(segmentLength / backgroundGlowSpacing);

        for (let step = 0; step <= steps; step++) {
          const t = step / steps;
          const glowX = current.x + (next.x - current.x) * t;
          const glowY = current.y + (next.y - current.y) * t;

          // Create radial gradient for background illumination
          // This simulates light hitting a dark surface and making it visible
          const bgGradient = context.createRadialGradient(
            glowX,
            glowY,
            0,
            glowX,
            glowY,
            140
          );

          // Realistic surface illumination: warm white glow
          bgGradient.addColorStop(0, "rgba(180, 170, 150, 0.15)"); // Warm white where light hits
          bgGradient.addColorStop(0.25, "rgba(140, 130, 115, 0.1)"); // Medium warm gray
          bgGradient.addColorStop(0.5, "rgba(100, 95, 85, 0.06)"); // Fading warm gray
          bgGradient.addColorStop(0.75, "rgba(60, 55, 50, 0.03)"); // Very faint warm
          bgGradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Transparent (no light)

          context.fillStyle = bgGradient;
          context.fillRect(glowX - 140, glowY - 140, 280, 280);
        }
      }

      // Draw additional soft background illumination for ambient lighting
      // This creates a much wider, softer glow that illuminates most of the page
      for (let i = 0; i < pathPoints.length - 1; i++) {
        const current = pathPoints[i];
        const next = pathPoints[i + 1];
        const segmentLength = Math.sqrt(
          Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2)
        );
        const steps = Math.ceil(segmentLength / 60);

        for (let step = 0; step <= steps; step++) {
          const t = step / steps;
          const glowX = current.x + (next.x - current.x) * t;
          const glowY = current.y + (next.y - current.y) * t;

          // Much larger ambient glow to light up most of the page
          const ambientBgGradient = context.createRadialGradient(
            glowX,
            glowY,
            150,
            glowX,
            glowY,
            Math.max(width, height) * 0.8 // Scale to canvas size
          );

          // Warm white page-wide illumination
          ambientBgGradient.addColorStop(0, "rgba(150, 140, 125, 0.08)");
          ambientBgGradient.addColorStop(0.3, "rgba(120, 110, 100, 0.05)");
          ambientBgGradient.addColorStop(0.5, "rgba(85, 80, 70, 0.03)");
          ambientBgGradient.addColorStop(0.7, "rgba(55, 50, 45, 0.015)");
          ambientBgGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

          const radius = Math.max(width, height) * 0.8;
          context.fillStyle = ambientBgGradient;
          context.fillRect(
            glowX - radius,
            glowY - radius,
            radius * 2,
            radius * 2
          );
        }
      }

      // Draw realistic glow using radial gradients along the path
      // This creates natural light falloff with realistic physics
      context.globalCompositeOperation = "screen"; // Light blending mode for realistic light mixing

      // Draw continuous glow along the path with overlapping radial gradients
      const glowSpacing = 20; // Distance between glow points for smooth coverage

      for (let i = 0; i < pathPoints.length - 1; i++) {
        const current = pathPoints[i];
        const next = pathPoints[i + 1];
        const segmentLength = Math.sqrt(
          Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2)
        );
        const steps = Math.ceil(segmentLength / glowSpacing);

        // Draw multiple overlapping glows along each segment for continuity
        for (let step = 0; step <= steps; step++) {
          const t = step / steps;
          const glowX = current.x + (next.x - current.x) * t;
          const glowY = current.y + (next.y - current.y) * t;

          // Create radial gradient for realistic light emission
          const gradient = context.createRadialGradient(
            glowX,
            glowY,
            0,
            glowX,
            glowY,
            70
          );

          // Warm white glow: bright warm center fading to transparent
          // Uses inverse square law approximation for natural light decay
          gradient.addColorStop(0, "rgba(255, 245, 230, 0.25)"); // Warm white center
          gradient.addColorStop(0.25, "rgba(240, 230, 210, 0.15)"); // Light warm white
          gradient.addColorStop(0.5, "rgba(200, 190, 175, 0.08)"); // Fading warm
          gradient.addColorStop(0.75, "rgba(150, 140, 125, 0.03)"); // Very faint warm
          gradient.addColorStop(1, "rgba(255, 255, 255, 0)"); // Transparent edge

          context.fillStyle = gradient;
          context.fillRect(glowX - 70, glowY - 70, 140, 140);
        }
      }

      // Draw additional ambient glow for longer range illumination
      // This creates the soft ambient lighting effect
      for (let i = 0; i < pathPoints.length - 1; i++) {
        const current = pathPoints[i];
        const next = pathPoints[i + 1];
        const segmentLength = Math.sqrt(
          Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2)
        );
        const steps = Math.ceil(segmentLength / 40);

        for (let step = 0; step <= steps; step++) {
          const t = step / steps;
          const glowX = current.x + (next.x - current.x) * t;
          const glowY = current.y + (next.y - current.y) * t;

          const ambientGradient = context.createRadialGradient(
            glowX,
            glowY,
            50,
            glowX,
            glowY,
            180
          );

          // Soft warm ambient light that extends further
          ambientGradient.addColorStop(0, "rgba(220, 210, 195, 0.04)");
          ambientGradient.addColorStop(0.4, "rgba(180, 170, 155, 0.02)");
          ambientGradient.addColorStop(0.7, "rgba(140, 130, 120, 0.008)");
          ambientGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

          context.fillStyle = ambientGradient;
          context.fillRect(glowX - 180, glowY - 180, 360, 360);
        }
      }

      // Draw clean main strip (base layer) with smooth appearance
      context.globalCompositeOperation = "source-over";
      context.shadowBlur = 0;

      // Draw a subtle inner highlight for depth - warm white
      context.strokeStyle = "#FFF8E1";
      context.lineWidth = 16;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.globalAlpha = 0.6;

      context.beginPath();
      context.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) {
        context.lineTo(pathPoints[i].x, pathPoints[i].y);
      }
      context.stroke();

      // Draw main strip body - warm white
      context.strokeStyle = "#FFF8E1";
      context.lineWidth = 20;
      context.globalAlpha = 1;
      context.shadowBlur = 2;
      context.shadowColor = "rgba(0, 0, 0, 0.3)";

      context.beginPath();
      context.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) {
        context.lineTo(pathPoints[i].x, pathPoints[i].y);
      }
      context.stroke();

      // Reset shadow
      context.shadowBlur = 0;
      context.shadowColor = "transparent";

      // Draw clean, evenly spaced LED chips
      const ledSpacing = 40; // Slightly more spacing for cleaner look
      let distanceTraveled = 0;

      for (let i = 0; i < pathPoints.length - 1; i++) {
        const current = pathPoints[i];
        const next = pathPoints[i + 1];
        const segmentLength = Math.sqrt(
          Math.pow(next.x - current.x, 2) + Math.pow(next.y - current.y, 2)
        );
        const segmentAngle = Math.atan2(next.y - current.y, next.x - current.x);

        // Draw LEDs along this segment
        while (distanceTraveled < segmentLength) {
          const t = distanceTraveled / segmentLength;
          const ledX = current.x + (next.x - current.x) * t;
          const ledY = current.y + (next.y - current.y) * t;

          // Draw clean LED chip
          context.save();
          context.translate(ledX, ledY);
          context.rotate(segmentAngle);

          // Use screen blend mode for realistic light emission
          context.globalCompositeOperation = "screen";

          // Cleaner, more subtle LED chip gradient - warm white
          const ledGradient = context.createRadialGradient(0, 0, 0, 0, 0, 20);
          ledGradient.addColorStop(0, "rgba(255, 248, 225, 0.95)"); // Bright warm white core
          ledGradient.addColorStop(0.3, "rgba(250, 240, 220, 0.7)"); // Light warm white
          ledGradient.addColorStop(0.6, "rgba(240, 230, 210, 0.4)"); // Soft warm white
          ledGradient.addColorStop(1, "rgba(255, 255, 255, 0)"); // Transparent edge

          context.fillStyle = ledGradient;
          context.fillRect(-20, -20, 40, 40);

          // Clean bright warm center
          context.globalCompositeOperation = "source-over";
          context.fillStyle = "#FFF8E1";
          context.globalAlpha = 1;
          context.fillRect(-5, -1.5, 10, 3);

          context.restore();

          distanceTraveled += ledSpacing;
        }

        distanceTraveled -= segmentLength;
      }

      context.restore();
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
