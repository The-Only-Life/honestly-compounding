import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthConfirm from "./pages/AuthConfirm";
import CompleteProfile from "./pages/CompleteProfile";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Themes from "./pages/Themes";
import Buckets from "./pages/Buckets";
import Stocks from "./pages/Stocks";
import ContentManagement from "./pages/ContentManagement";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import { PostHogProvider } from "posthog-js/react";
import type { ConfigDefaults } from "posthog-js";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const queryClient = new QueryClient();

const postHogOptions = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: "2025-05-24" as ConfigDefaults,
};

const App = () => (
  <HelmetProvider>
    <GoogleReCaptchaProvider
      reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ""}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "head",
      }}
    >
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
              <Route path="/auth/confirm" element={<AuthConfirm />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRoles={["admin", "sponsor", "subscriber"]}>
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
                  <ProtectedRoute requiredRoles={["admin", "sponsor", "subscriber"]}>
                    <DashboardLayout>
                      <Themes />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/buckets"
                element={
                  <ProtectedRoute requiredRoles={["admin", "sponsor", "subscriber"]}>
                    <DashboardLayout>
                      <Buckets />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/stocks"
                element={
                  <ProtectedRoute requiredRoles={["admin", "sponsor", "subscriber"]}>
                    <DashboardLayout>
                      <Stocks />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/content-management"
                element={
                  <ProtectedRoute requiredRoles={["admin", "sponsor", "subscriber"]}>
                    <DashboardLayout>
                      <ContentManagement />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/account"
                element={
                  <ProtectedRoute requiredRoles={["admin", "sponsor", "subscriber"]}>
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
  </GoogleReCaptchaProvider>
  </HelmetProvider>
);

export default App;
