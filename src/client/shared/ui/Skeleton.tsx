/* Skeleton loaders — показываются пока данные грузятся */

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`card animate-pulse ${className}`}>
      <div className="h-4 bg-muted rounded w-1/3 mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-5/6" />
        <div className="h-3 bg-muted rounded w-4/6" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 3 }: { rows?: number; cols?: number }) {
  return (
    <div className="card animate-pulse">
      {/* Header */}
      <div className="flex gap-4 mb-4 pb-3 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-muted rounded flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex gap-4 py-3 border-b border-border last:border-0">
          {Array.from({ length: cols }).map((_, ci) => (
            <div key={ci} className="h-3 bg-muted rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 page-enter">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CardSkeleton className="h-64" />
        <CardSkeleton className="h-64" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 page-enter">
      <div className="h-8 bg-muted rounded w-48 animate-pulse" />
      <CardSkeleton />
      <TableSkeleton />
    </div>
  );
}
