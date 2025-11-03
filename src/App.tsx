import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { useSilentUpdate } from "@/hooks/useSilentUpdate";
import GlobalErrorHandler from "@/components/GlobalErrorHandler";

// Pages légères
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SignupConfirmation from "./pages/SignupConfirmation";
import ForgotPassword from "./pages/ForgotPassword";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OrderSuccess from "./pages/OrderSuccess";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import CommisChangePassword from "./pages/CommisChangePassword";
import InterfacePharmacie from "./pages/InterfacePharmacie";
import InterfaceRestaurant from "./pages/InterfaceRestaurant";
import InterfaceEpicerie from "./pages/InterfaceEpicerie";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeeDashboard from "./pages/dashboards/EmployeeDashboard";

// Pages supplémentaires
import PaymentPage from "./pages/PaymentPage";
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
      retry: (failureCount, error: any) => (error?.status === 401 || error?.status === 403 ? false : failureCount < 3),
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
              {/* Routes légères */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/signup-confirmation" element={<SignupConfirmation />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/old-index" element={<Index />} />
              <Route path="/auth/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/order-success/:orderId" element={<OrderSuccess />} />
              <Route path="/commis-change-password" element={<CommisChangePassword />} />
              
              {/* Routes Employés */}
              <Route path="/employe" element={<EmployeeLogin />} />
              <Route path="/dashboard/employee/orders" element={<EmployeeDashboard />} />

              {/* Pages supplémentaires */}
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/help" element={<Help />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/store/:storeId/products" element={<StoreProducts />} />

              {/* Routes lourdes */}
              <Route path="/stores" element={<Stores />} />
              <Route path="/order-checkout" element={<OrderCheckout />} />

              {/* Dashboards */}
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/marchand" element={<MarchandDashboard />} />
              <Route path="/dashboard/livreur" element={<LivreurDashboard />} />
              <Route path="/dashboard/livreur/finance" element={<LivreurDashboard />} />
              <Route path="/dashboard/livreur/pourboires" element={<LivreurDashboard />} />
              <Route path="/dashboard/livreur/aide" element={<LivreurDashboard />} />
              <Route path="/dashboard/livreur/parametres" element={<LivreurDashboard />} />
              <Route path="/dashboard/client" element={<ClientDashboard />} />
              <Route path="/dashboard/client/settings" element={<ClientSettings />} />

              {/* Redirections */}
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