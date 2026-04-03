export default function StudentDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <div className="h-8 w-20 bg-secondary rounded animate-pulse mb-4" />

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-secondary animate-pulse shrink-0" />
        <div className="space-y-3 flex-1">
          <div className="h-9 w-64 bg-secondary rounded animate-pulse" />
          <div className="flex gap-3">
            <div className="h-4 w-16 bg-secondary rounded animate-pulse" />
            <div className="h-4 w-16 bg-secondary rounded animate-pulse" />
            <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
          </div>
          <div className="h-4 w-80 bg-secondary rounded animate-pulse" />
        </div>
      </div>

      {/* Tabs */}
      <div className="h-10 w-80 bg-secondary rounded-lg animate-pulse mb-6" />

      {/* Content */}
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-secondary rounded animate-pulse" />
                <div className="h-3 w-48 bg-secondary rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
