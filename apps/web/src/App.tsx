import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CompleteProfile from "./pages/CompleteProfile";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Themes from "./pages/Themes";
import RiskBuckets from "./pages/RiskBuckets";
import Stocks from "./pages/Stocks";
import ContentManagement from "./pages/ContentManagement";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import { PostHogProvider } from "posthog-js/react";
import type { ConfigDefaults } from "posthog-js";

const queryClient = new QueryClient();

const postHogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: "2025-05-24" as ConfigDefaults,
};

const App = () => (
  <PostHogProvider
    apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
    options={postHogOptions}
  >
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRoles={["admin", "analyst"]}>
                    <DashboardLayout>
                      <Dashboard />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/users"
                element={
                  <ProtectedRoute requiredRoles={["admin"]}>
                    <DashboardLayout>
                      <Users />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/themes"
                element={
                  <ProtectedRoute requiredRoles={["admin", "analyst"]}>
                    <DashboardLayout>
                      <Themes />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/risk-buckets"
                element={
                  <ProtectedRoute requiredRoles={["admin", "analyst"]}>
                    <DashboardLayout>
                      <RiskBuckets />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/stocks"
                element={
                  <ProtectedRoute requiredRoles={["admin", "analyst"]}>
                    <DashboardLayout>
                      <Stocks />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/content-management"
                element={
                  <ProtectedRoute requiredRoles={["admin", "analyst"]}>
                    <DashboardLayout>
                      <ContentManagement />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/account"
                element={
                  <ProtectedRoute requiredRoles={["admin", "analyst"]}>
                    <DashboardLayout>
                      <Account />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </PostHogProvider>
);

export default App;
