export default function HomeLoading() {
  return (
    <main className="min-h-[100svh] bg-as-snow text-as-dark">
      <div className="relative min-h-[min(58svh,28rem)] sm:min-h-[min(72svh,36rem)] bg-as-dark">
        <div className="absolute inset-0 bg-gradient-to-t from-as-dark via-as-dark/70 to-as-dark/35" />
        <div className="relative z-10 container-as pb-8 pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))] sm:pb-10">
          <div className="h-3 w-28 bg-white/25 animate-pulse mb-4" />
          <div className="h-10 w-full max-w-xl bg-white/20 animate-pulse mb-3" />
          <div className="h-10 w-2/3 max-w-md bg-white/15 animate-pulse mb-6" />
          <div className="h-12 w-40 rounded-control bg-accent/50 animate-pulse" />
        </div>
      </div>
      <div className="container-as py-10 space-y-4">
        <div className="h-12 w-full max-w-2xl bg-as-mist/80 animate-pulse rounded-card" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-as-mist/70 animate-pulse rounded-card" />
          ))}
        </div>
      </div>
    </main>
  );
}
