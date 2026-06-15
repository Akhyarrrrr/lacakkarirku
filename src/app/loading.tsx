export default function Loading() {
  return (
    <div className="min-h-screen bg-navy px-6 py-8 text-cream">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 animate-pulse rounded bg-primary/30" />
          <div className="h-11 w-32 animate-pulse rounded-lg bg-cream/10" />
        </div>
        <div className="grid min-h-[70vh] grid-cols-1 items-center gap-12 py-16 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="h-4 w-36 animate-pulse rounded bg-primary/30" />
            <div className="mt-6 h-14 w-full max-w-xl animate-pulse rounded bg-cream/10" />
            <div className="mt-4 h-14 w-full max-w-lg animate-pulse rounded bg-cream/10" />
            <div className="mt-6 h-5 w-full max-w-2xl animate-pulse rounded bg-cream/10" />
            <div className="mt-10 flex gap-3">
              <div className="h-12 w-36 animate-pulse rounded-lg bg-primary/30" />
              <div className="h-12 w-36 animate-pulse rounded-lg bg-cream/10" />
            </div>
          </div>
          <div className="hidden rounded-xl border border-cream/10 bg-cream/10 p-5 lg:block">
            <div className="h-8 w-40 animate-pulse rounded bg-cream/10" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-lg bg-cream/10" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
