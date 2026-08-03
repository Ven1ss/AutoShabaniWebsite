export default function CatalogueLoading() {
  return (
    <main className="min-h-screen bg-surface bg-surface-noise">
      <section className="pt-28 md:pt-32 pb-16 md:pb-20">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="mb-10 md:mb-12 space-y-3">
            <div className="h-3 w-24 bg-steel-light/60 animate-pulse" />
            <div className="h-5 w-72 max-w-full bg-steel-light/50 animate-pulse" />
          </div>
          <div className="mb-8 h-14 w-full max-w-3xl bg-steel-light/40 animate-pulse" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-steel-light/35 animate-pulse" />
            ))}
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="border border-steel-light/70 bg-surface-white"
              >
                <div className="aspect-[4/3] bg-steel-light/30 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 w-16 bg-steel-light/40 animate-pulse" />
                  <div className="h-5 w-full bg-steel-light/45 animate-pulse" />
                  <div className="h-3 w-24 bg-steel-light/35 animate-pulse" />
                  <div className="h-4 w-14 bg-steel-light/40 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
