"use client";
import { useRef } from "react";
import { usePhysicsSimulation } from "@/hooks/usePhysicsSimulation";

export default function Home() {
  const physicsRef = usePhysicsSimulation();
  const nextSectionRef = useRef<HTMLElement>(null);

  const scrollToNextSection = () => {
    nextSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black">
      {/* Hero Section with LED Strip */}
      <section className="relative h-screen flex flex-col items-center justify-center bg-black overflow-hidden snap-start snap-always">
        {/* LED Strip Canvas - positioned on top, allows scroll but captures mouse */}
        <div
          ref={physicsRef}
          className="absolute inset-0 w-full h-full z-40"
          style={{ pointerEvents: "auto", touchAction: "pan-y" }}
        />

        {/* Text content - above chain */}
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
          <div className="pointer-events-auto text-center text-white">
            <h1 className="text-9xl font-bold mb-4 text-white">Joseph Baker</h1>
            <p className="text-2xl">Full Stack Developer</p>
          </div>
        </div>

        {/* Scroll down indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none animate-bounce">
          <button
            onClick={scrollToNextSection}
            className="pointer-events-auto group relative flex items-center justify-center w-14 h-14 rounded-full border-2 border-white/40 hover:border-white transition-all duration-300 hover:scale-110"
            aria-label="Scroll to next section"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-white/60 group-hover:text-white transition-colors duration-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
              />
            </svg>
          </button>
        </div>
      </section>

      {/* Additional Content Section */}
      <section
        ref={nextSectionRef}
        className="h-screen flex items-center justify-center bg-black snap-start snap-always"
      >
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4">Your Name</h1>
          <p className="text-2xl">Full Stack Developer</p>
        </div>
      </section>
    </main>
  );
}
