export default function CatalogueLoading() {
  return (
    <main className="min-h-screen bg-as-snow text-as-dark">
      <section className="pt-[max(6.5rem,calc(env(safe-area-inset-top)+5rem))] pb-14 sm:pb-16 md:pb-20">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="mb-6 sm:mb-10 space-y-3">
            <div className="h-3 w-24 bg-as-mist animate-pulse rounded-sm" />
            <div className="h-5 w-72 max-w-full bg-as-mist animate-pulse rounded-sm" />
          </div>
          <div className="mb-6 h-14 w-full bg-white border border-as-mist animate-pulse rounded-card" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-12 bg-white border border-as-mist animate-pulse rounded-card"
              />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[clamp(0.55rem,0.4rem+0.7vw,1rem)]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="border border-as-mist bg-white rounded-card overflow-hidden"
              >
                <div className="aspect-[4/3] bg-as-mist/80 animate-pulse" />
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="h-3 w-16 bg-as-mist animate-pulse rounded-sm" />
                  <div className="h-4 w-full bg-as-mist animate-pulse rounded-sm" />
                  <div className="h-4 w-14 bg-as-mist animate-pulse rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
