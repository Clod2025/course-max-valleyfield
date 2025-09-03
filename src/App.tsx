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
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OrderCheckout from "./pages/OrderCheckout";
import OrderSuccess from "./pages/OrderSuccess";
import MerchantDashboard from "./pages/MerchantDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import ClientDashboard from "./pages/ClientDashboard";
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
              <Route path="/merchant-dashboard" element={<MerchantDashboard />} />
              <Route path="/driver-dashboard" element={<DriverDashboard />} />
              <Route path="/client-dashboard" element={<ClientDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
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
