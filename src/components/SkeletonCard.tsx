

export function SkeletonCard() {
  return (
    <div className="card p-5 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          <div className="w-14 h-14 rounded-xl bg-surface-hover" />
          <div className="space-y-2 pt-1">
            <div className="h-5 w-32 rounded-lg bg-surface-hover" />
            <div className="h-3 w-20 rounded-lg bg-surface-hover" />
          </div>
        </div>
        <div className="w-6 h-6 rounded-md bg-surface-hover" />
      </div>
      <div className="space-y-2 mt-2">
        <div className="h-3 w-full rounded-lg bg-surface-hover" />
        <div className="h-3 w-3/4 rounded-lg bg-surface-hover" />
      </div>
      <div className="mt-auto pt-4 flex justify-between">
        <div className="h-3 w-10 rounded-lg bg-surface-hover" />
        <div className="flex gap-2">
          <div className="h-6 w-14 rounded-md bg-surface-hover" />
          <div className="h-6 w-16 rounded-md bg-surface-hover" />
        </div>
      </div>
    </div>
  );
}

interface SkeletonGridProps {
  count?: number;
}

export function SkeletonGrid({ count = 8 }: SkeletonGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
