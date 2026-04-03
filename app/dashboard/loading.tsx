export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-10 w-48 bg-secondary rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-80 bg-secondary rounded animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`bg-card border border-border rounded-xl p-4 ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-16 bg-secondary rounded animate-pulse" />
                <div className="h-7 w-10 bg-secondary rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search bar skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 max-w-md h-10 bg-secondary rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-secondary rounded-lg animate-pulse" />
      </div>

      {/* List skeleton */}
      <div className="grid gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-40 bg-secondary rounded animate-pulse" />
              <div className="h-3 w-64 bg-secondary rounded animate-pulse" />
            </div>
            <div className="w-5 h-5 bg-secondary rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
