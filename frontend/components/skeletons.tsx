export function SkeletonScoreCard() {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center">
      <div className="w-48 h-48 rounded-full border-8 border-muted/50 border-t-primary/20 animate-spin mx-auto md:mx-0"></div>
      <div className="flex-1 space-y-4">
        <div className="h-8 bg-muted rounded w-3/4 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-4/6 animate-pulse"></div>
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="h-10 bg-muted rounded w-full sm:w-32 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-full sm:w-32 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGapList() {
  return (
    <div className="space-y-4">
      <div className="h-6 bg-muted rounded w-48 animate-pulse mb-6"></div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border rounded-lg space-y-3">
          <div className="flex justify-between">
            <div className="h-5 bg-muted rounded w-32 animate-pulse"></div>
            <div className="h-5 bg-muted rounded w-20 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-muted rounded w-full animate-pulse"></div>
            <div className="h-16 bg-muted rounded w-full animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonBulletCard() {
  return (
    <div className="flex flex-col border rounded-lg overflow-hidden bg-card">
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
          <div className="h-12 bg-muted rounded w-full animate-pulse"></div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
          <div className="h-12 bg-muted rounded w-full animate-pulse"></div>
        </div>
      </div>
      <div className="bg-muted/30 p-3 border-t">
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
      </div>
    </div>
  );
}
