function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />;
}

export default function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-primary/20 bg-primary/5 p-6">
        <SkeletonBlock className="h-4 w-32" />
        <SkeletonBlock className="mt-4 h-9 w-full max-w-md" />
        <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <SkeletonBlock className="h-12 w-full sm:w-40" />
          <SkeletonBlock className="h-12 w-full sm:w-44" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card flex items-center gap-4">
            <SkeletonBlock className="h-12 w-12" />
            <div className="flex-1">
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="mt-3 h-7 w-16" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="mt-4 h-8 w-full max-w-sm" />
          <SkeletonBlock className="mt-3 h-4 w-full max-w-xl" />
          <SkeletonBlock className="mt-6 h-12 w-full md:w-44" />
        </div>
        <div className="card">
          <SkeletonBlock className="h-5 w-36" />
          <SkeletonBlock className="mt-4 h-8 w-20" />
          <SkeletonBlock className="mt-5 h-2 w-full" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-11 w-full" />
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <SkeletonBlock className="h-6 w-48" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-24 w-full" />
            ))}
          </div>
        </div>
        <div className="card">
          <SkeletonBlock className="h-6 w-40" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
