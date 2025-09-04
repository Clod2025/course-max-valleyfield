import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Home from "./pages/Home";
import Stores from "./pages/Stores";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OrderCheckout from "./pages/OrderCheckout";
import OrderSuccess from "./pages/OrderSuccess";
import MerchantDashboard from "./pages/MerchantDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import MarchandDashboard from "./pages/dashboards/MarchandDashboard";
import LivreurDashboard from "./pages/dashboards/LivreurDashboard";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import Test from "./test";

const queryClient = new QueryClient();

const App = () => {
  console.log('App component loaded');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/stores" element={<Stores />} />
              <Route path="/order-checkout" element={<OrderCheckout />} />
              <Route path="/order-success/:orderId" element={<OrderSuccess />} />
              
              {/* Nouvelles routes dashboard avec protection de rôle */}
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/marchand" element={<MarchandDashboard />} />
              <Route path="/dashboard/livreur" element={<LivreurDashboard />} />
              <Route path="/dashboard/client" element={<ClientDashboard />} />
              <Route path="/auth/unauthorized" element={<UnauthorizedPage />} />
              
              {/* Anciennes routes (maintenues pour compatibilité) */}
              <Route path="/merchant-dashboard" element={<Navigate to="/dashboard/marchand" replace />} />
              <Route path="/driver-dashboard" element={<Navigate to="/dashboard/livreur" replace />} />
              <Route path="/client-dashboard" element={<Navigate to="/dashboard/client" replace />} />
              
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/old-index" element={<Index />} />
              <Route path="/test" element={<Test />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
