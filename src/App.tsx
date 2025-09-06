import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

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
import Test from "./test";

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
        if (process.env.NODE_ENV === 'development') {
          console.error('Mutation error:', error);
        }
      },
    },
  },
});

const App = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('App component loaded');
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Routes légères */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/old-index" element={<Index />} />
              <Route path="/test" element={<Test />} />
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
              <Route path="/dashboard/livreur" element={<LivreurDashboard />} />
              <Route path="/dashboard/client" element={<ClientDashboard />} />
              
              {/* Redirections pour compatibilité */}
              <Route path="/merchant-dashboard" element={<Navigate to="/dashboard/marchand" replace />} />
              <Route path="/driver-dashboard" element={<Navigate to="/dashboard/livreur" replace />} />
              <Route path="/client-dashboard" element={<Navigate to="/dashboard/client" replace />} />
              
              {/* 404 - doit être en dernier */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          
          {/* DevTools uniquement en développement */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
