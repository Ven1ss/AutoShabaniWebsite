export default function HomeLoading() {
  return (
    <main className="min-h-[100svh] bg-ink">
      <div className="container mx-auto px-6 md:px-8 lg:px-12 pt-32 pb-16">
        <div className="h-6 w-48 bg-white/10 animate-pulse mb-6" />
        <div className="h-16 w-full max-w-xl bg-white/15 animate-pulse mb-4" />
        <div className="h-16 w-2/3 max-w-md bg-white/10 animate-pulse mb-8" />
        <div className="flex gap-3">
          <div className="h-12 w-40 bg-signal/40 animate-pulse" />
          <div className="h-12 w-36 bg-white/10 animate-pulse" />
        </div>
      </div>
    </main>
  );
}
