import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { useSilentUpdate } from "@/hooks/useSilentUpdate";
import GlobalErrorHandler from "@/components/GlobalErrorHandler";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages légères
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SignupConfirmation from "./pages/SignupConfirmation";
import ForgotPassword from "./pages/ForgotPassword";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OrderSuccess from "./pages/OrderSuccess";
import Unauthorized from "./pages/Unauthorized";
import CommisLogin from "./pages/CommisLogin";
import CommisOrders from "./pages/CommisOrders";
import CommisChangePassword from "./pages/CommisChangePassword";
import InterfacePharmacie from "./pages/InterfacePharmacie";
import InterfaceRestaurant from "./pages/InterfaceRestaurant";
import InterfaceEpicerie from "./pages/InterfaceEpicerie";

// Pages supplémentaires
import StoreProducts from "./pages/StoreProducts";
import ClientSettings from "./pages/ClientSettings";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Help from "./pages/Help";

// Lazy loading pour composants lourds
import {
  AdminDashboard,
  MarchandDashboard,
  LivreurDashboard,
  ClientDashboard,
  Stores,
  OrderCheckout,
} from "./components/LazyRoutes";

// React Query DevTools (dev uniquement)
let ReactQueryDevtools: any = null;
if (import.meta.env.DEV && typeof window !== "undefined" && window.location.hostname === "localhost") {
  import("@tanstack/react-query-devtools").then((module) => {
    ReactQueryDevtools = module.ReactQueryDevtools;
  });
}

// Configuration React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) =>
        error?.status === 401 || error?.status === 403 ? false : failureCount < 3,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        if (import.meta.env.DEV) console.error("Mutation error:", error);
      },
    },
  },
});

const App = () => {
  const { isUpdating } = useSilentUpdate();

  useEffect(() => {
    const isInitialized = sessionStorage.getItem("app_initialized");
    if (!isInitialized) {
      console.log("🧹 Nettoyage des anciennes données de session");
      sessionStorage.setItem("app_initialized", "true");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Routes publiques */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/signup-confirmation" element={<SignupConfirmation />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/old-index" element={<Index />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/auth/unauthorized" element={<Navigate to="/unauthorized" replace />} />
              <Route path="/order-success/:orderId" element={<OrderSuccess />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/help" element={<Help />} />
              <Route path="/store/:storeId/products" element={<StoreProducts />} />

              {/* Commis */}
              <Route path="/commis/login" element={<CommisLogin />} />
              <Route
                path="/commis/orders"
                element={
                  <ProtectedRoute requiredRole="commis">
                    <CommisOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/commis/change-password"
                element={
                  <ProtectedRoute requiredRole="commis">
                    <CommisChangePassword />
                  </ProtectedRoute>
                }
              />

              {/* Dashboards */}
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/client"
                element={
                  <ProtectedRoute requiredRole="client">
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/client/settings"
                element={
                  <ProtectedRoute requiredRole="client">
                    <ClientSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/livreur"
                element={
                  <ProtectedRoute allowedRoles={['livreur', 'driver']}>
                    <LivreurDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/livreur/finance"
                element={
                  <ProtectedRoute allowedRoles={['livreur', 'driver']}>
                    <LivreurDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/livreur/pourboires"
                element={
                  <ProtectedRoute allowedRoles={['livreur', 'driver']}>
                    <LivreurDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/livreur/aide"
                element={
                  <ProtectedRoute allowedRoles={['livreur', 'driver']}>
                    <LivreurDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/livreur/parametres"
                element={
                  <ProtectedRoute allowedRoles={['livreur', 'driver']}>
                    <LivreurDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/marchand"
                element={
                  <ProtectedRoute allowedRoles={['marchand', 'store_manager']}>
                    <MarchandDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Interfaces spécifiques aux types de marchands */}
              <Route
                path="/interface-pharmacie"
                element={
                  <ProtectedRoute allowedRoles={['marchand', 'store_manager']}>
                    <InterfacePharmacie />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interface-restaurant"
                element={
                  <ProtectedRoute allowedRoles={['marchand', 'store_manager']}>
                    <InterfaceRestaurant />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interface-epicerie"
                element={
                  <ProtectedRoute allowedRoles={['marchand', 'store_manager']}>
                    <InterfaceEpicerie />
                  </ProtectedRoute>
                }
              />

              {/* Routes supplémentaires */}
              <Route path="/stores" element={<Stores />} />
              <Route
                path="/order-checkout"
                element={
                  <ProtectedRoute allowedRoles={['client', 'marchand', 'store_manager']}>
                    <OrderCheckout />
                  </ProtectedRoute>
                }
              />

              {/* Redirections legacy */}
              <Route path="/merchant-dashboard" element={<Navigate to="/dashboard/marchand" replace />} />
              <Route path="/driver-dashboard" element={<Navigate to="/dashboard/livreur" replace />} />
              <Route path="/client-dashboard" element={<Navigate to="/dashboard/client" replace />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>

          <PWAInstallPrompt />
          <GlobalErrorHandler />

          {isUpdating && (
            <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm">
              🔄 Mise à jour en cours...
            </div>
          )}

          {/* DevTools */}
          {import.meta.env.DEV &&
            typeof window !== "undefined" &&
            window.location.hostname === "localhost" &&
            ReactQueryDevtools && <ReactQueryDevtools initialIsOpen={false} />}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;