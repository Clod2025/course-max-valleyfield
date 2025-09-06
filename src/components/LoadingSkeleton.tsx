import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'default' | 'card' | 'list' | 'dashboard' | 'table';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  variant = 'default',
  count = 1,
}) => {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div key={i} className={getSkeletonClasses(variant, className)} />
  ));

  if (count === 1) {
    return skeletons[0];
  }

  return <>{skeletons}</>;
};

const getSkeletonClasses = (variant: string, className?: string) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded';
  
  const variantClasses = {
    default: 'h-4 w-full',
    card: 'h-48 w-full rounded-lg',
    list: 'h-16 w-full rounded-md',
    dashboard: 'h-32 w-full rounded-xl',
    table: 'h-12 w-full rounded-sm',
  };

  return cn(baseClasses, variantClasses[variant as keyof typeof variantClasses], className);
};

// Skeletons spécialisés pour différents cas d'usage
export const ProductCardSkeleton = () => (
  <div className="border rounded-lg p-4 space-y-4">
    <LoadingSkeleton variant="card" className="h-32" />
    <div className="space-y-2">
      <LoadingSkeleton className="h-4 w-3/4" />
      <LoadingSkeleton className="h-4 w-1/2" />
      <LoadingSkeleton className="h-6 w-1/4" />
    </div>
  </div>
);

export const OrderCardSkeleton = () => (
  <div className="border rounded-lg p-6 space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1">
        <LoadingSkeleton className="h-5 w-32" />
        <LoadingSkeleton className="h-4 w-48" />
      </div>
      <LoadingSkeleton className="h-6 w-20 rounded-full" />
    </div>
    <div className="space-y-2">
      <LoadingSkeleton className="h-4 w-full" />
      <LoadingSkeleton className="h-4 w-2/3" />
    </div>
    <div className="flex justify-between">
      <LoadingSkeleton className="h-4 w-24" />
      <LoadingSkeleton className="h-4 w-16" />
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <LoadingSkeleton className="h-8 w-64" />
        <LoadingSkeleton className="h-4 w-96" />
      </div>
      <LoadingSkeleton className="h-10 w-24 rounded-md" />
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="h-5 w-5 rounded" />
          </div>
          <LoadingSkeleton className="h-8 w-16" />
          <LoadingSkeleton className="h-3 w-32" />
        </div>
      ))}
    </div>

    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <LoadingSkeleton variant="dashboard" className="h-96" />
      <LoadingSkeleton variant="dashboard" className="h-96" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-4">
    {/* Table Header */}
    <div className="grid grid-cols-4 gap-4 pb-4 border-b">
      {Array.from({ length: columns }, (_, i) => (
        <LoadingSkeleton key={i} className="h-4 w-20" />
      ))}
    </div>
    
    {/* Table Rows */}
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="grid grid-cols-4 gap-4 py-3">
        {Array.from({ length: columns }, (_, j) => (
          <LoadingSkeleton key={j} className="h-4 w-full" />
        ))}
      </div>
    ))}
  </div>
);

export const StoreCardSkeleton = () => (
  <div className="border rounded-lg overflow-hidden">
    <LoadingSkeleton className="h-48 w-full rounded-none" />
    <div className="p-4 space-y-3">
      <LoadingSkeleton className="h-5 w-3/4" />
      <LoadingSkeleton className="h-4 w-full" />
      <div className="flex justify-between items-center">
        <LoadingSkeleton className="h-4 w-20" />
        <LoadingSkeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  </div>
);

export default LoadingSkeleton;
