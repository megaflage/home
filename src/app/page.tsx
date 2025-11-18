export default function Home() {
  return (
    <main className="h-screen overflow-y-scroll snap-y snap-mandatory">
      {/* Hero Section */}
      <section className="h-screen snap-start flex items-center justify-center bg-blue-500">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4">Your Name</h1>
          <p className="text-2xl">Full Stack Developer</p>
        </div>
      </section>

      <section className="h-screen snap-start flex items-center justify-center bg-blue-500">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4">Your Name</h1>
          <p className="text-2xl">Full Stack Developer</p>
        </div>
      </section>
    </main>
  );
}
