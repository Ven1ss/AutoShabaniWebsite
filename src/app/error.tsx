"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-as-snow flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold text-as-dark tracking-tight">
          Diçka shkoi keq
        </h1>
        <p className="text-sm text-as-secondary">
          {error.message || "Një gabim i papritur ndodhi. Provo përsëri."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center rounded-control bg-accent px-5 text-sm font-medium text-white hover:bg-accent-deep transition-colors"
        >
          Provo përsëri
        </button>
      </div>
    </main>
  );
}
