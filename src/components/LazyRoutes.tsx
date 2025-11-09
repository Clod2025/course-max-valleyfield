import { lazy, Suspense } from 'react';
import { DashboardSkeleton, ProductCardSkeleton } from './LoadingSkeleton';

// Lazy loading des composants lourds
export const AdminDashboardLazy = lazy(() => 
  import('../pages/dashboards/AdminDashboard').then(module => ({
    default: module.default
  }))
);

export const MarchandDashboardLazy = lazy(() => 
  import('../pages/dashboards/MarchandDashboard').then(module => ({
    default: module.default
  }))
);

export const LivreurDashboardLazy = lazy(() => 
  import('../pages/dashboards/LivreurDashboard').then(module => ({
    default: module.default
  }))
);

export const ClientDashboardLazy = lazy(() => 
  import('../pages/ClientDashboard').then(module => ({
    default: module.default
  }))
);

export const StoresLazy = lazy(() => 
  import('../pages/Stores').then(module => ({
    default: module.default
  }))
);

export const OrderCheckoutLazy = lazy(() => 
  import('../pages/OrderCheckout').then(module => ({
    default: module.default
  }))
);

// Composants merchants lourds
export const MerchantAnalyticsLazy = lazy(() => 
  import('../components/merchant/MerchantAnalytics').then(module => ({
    default: module.default
  }))
);

// Composants admin lourds
export const UserManagementLazy = lazy(() => 
  import('../components/admin/UserManagement').then(module => ({
    default: module.default
  }))
);

export const AdminAnalyticsLazy = lazy(() => 
  import('../components/admin/AdminAnalytics').then(module => ({
    default: module.default
  }))
);

// Wrappers avec Suspense pour chaque composant
export const AdminDashboard = () => (
  <Suspense fallback={<DashboardSkeleton />}>
    <AdminDashboardLazy />
  </Suspense>
);

export const MarchandDashboard = () => (
  <Suspense fallback={<DashboardSkeleton />}>
    <MarchandDashboardLazy />
  </Suspense>
);

export const LivreurDashboard = () => (
  <Suspense fallback={<DashboardSkeleton />}>
    <LivreurDashboardLazy />
  </Suspense>
);

export const ClientDashboard = () => (
  <Suspense fallback={<DashboardSkeleton />}>
    <ClientDashboardLazy />
  </Suspense>
);

export const Stores = () => (
  <Suspense fallback={
    <div className="container mx-auto py-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="h-12 w-96 mx-auto bg-gray-200 animate-pulse rounded" />
        <div className="h-6 w-128 mx-auto bg-gray-200 animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  }>
    <StoresLazy />
  </Suspense>
);

export const OrderCheckout = () => (
  <Suspense fallback={
    <div className="container mx-auto py-6">
      <DashboardSkeleton />
    </div>
  }>
    <OrderCheckoutLazy />
  </Suspense>
);

// Wrapper pour les composants merchant
export const MerchantAnalytics = () => (
  <Suspense fallback={<DashboardSkeleton />}>
    <MerchantAnalyticsLazy />
  </Suspense>
);
