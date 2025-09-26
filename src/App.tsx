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

// Imports directs pour les pages légères
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OrderSuccess from "./pages/OrderSuccess";
import MerchantDashboard from "./pages/MerchantDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import UnauthorizedPage from "./pages/UnauthorizedPage";

// Imports lazy pour les composants lourds
import {
  AdminDashboard,
  MarchandDashboard,
  LivreurDashboard,
  ClientDashboard,
  Stores,
  OrderCheckout,
} from "./components/LazyRoutes";

// Pages supplémentaires
import PaymentPage from "./pages/PaymentPage";
import StoreProducts from "./pages/StoreProducts";
import ClientSettings from "./pages/ClientSettings";

// Import conditionnel des DevTools
let ReactQueryDevtools: any = null;
if (import.meta.env.DEV && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  import("@tanstack/react-query-devtools").then((module) => {
    ReactQueryDevtools = module.ReactQueryDevtools;
  });
}

// Configuration optimisée de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
      onError: (error: any) => {
        if (import.meta.env.DEV) {
          console.error('Mutation error:', error);
        }
      },
    },
  },
});

const App = () => {
  // Hook pour la mise à jour silencieuse
  const { isUpdateAvailable, isUpdating, checkForUpdates, forceSilentUpdate } = useSilentUpdate();

  if (import.meta.env.DEV) {
    console.log('App component loaded');
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ 
            v7_startTransition: true,
            v7_relativeSplatPath: true 
          }}>
            <Routes>
              {/* Routes légères */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/old-index" element={<Index />} />
              <Route path="/auth/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/order-success/:orderId" element={<OrderSuccess />} />
              
              {/* Routes lourdes - avec lazy loading */}
              <Route path="/stores" element={<Stores />} />
              <Route path="/order-checkout" element={<OrderCheckout />} />
              
              {/* Pages supplémentaires */}
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/store/:storeId/products" element={<StoreProducts />} />
              
              {/* Dashboards avec protection de rôle */}
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/marchand" element={<MarchandDashboard />} />
              
              {/* Routes Livreur avec sous-pages */}
              <Route path="/dashboard/livreur" element={<LivreurDashboard />} />
              <Route path="/dashboard/livreur/finance" element={<LivreurDashboard />} />
              <Route path="/dashboard/livreur/pourboires" element={<LivreurDashboard />} />
              <Route path="/dashboard/livreur/aide" element={<LivreurDashboard />} />
              <Route path="/dashboard/livreur/parametres" element={<LivreurDashboard />} />
              
              <Route path="/dashboard/client" element={<ClientDashboard />} />
              <Route path="/dashboard/client/settings" element={<ClientSettings />} />
              
              {/* Redirections pour compatibilité */}
              <Route path="/merchant-dashboard" element={<Navigate to="/dashboard/marchand" replace />} />
              <Route path="/driver-dashboard" element={<Navigate to="/dashboard/livreur" replace />} />
              <Route path="/client-dashboard" element={<Navigate to="/dashboard/client" replace />} />
              
              {/* 404 - doit être en dernier */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BrowserRouter>
          
          {/* PWA Install Prompt */}
          <PWAInstallPrompt />
          
          {/* Gestionnaire d'erreurs global */}
          <GlobalErrorHandler />
          
          {/* DevTools UNIQUEMENT en développement local */}
          {import.meta.env.DEV && 
           typeof window !== 'undefined' && 
           window.location.hostname === 'localhost' && 
           ReactQueryDevtools && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
          
          {/* Indicateur de mise à jour silencieuse */}
          {isUpdating && (
            <div className="fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm">
              🔄 Mise à jour en cours...
            </div>
          )}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
