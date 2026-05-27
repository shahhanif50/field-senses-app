import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MasterDataProvider } from "./contexts/MasterDataContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import SalesPortal from "./pages/SalesPortal";
import NotFound from "./pages/NotFound";

// FIX: Use curly braces because you are now using a Named Export
import { EmployeePortalTab } from "./components/tabs/EmployeePortalTab";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = sessionStorage.getItem("isAdminLoggedIn") === "true";
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
};

const SalesProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const userRole = sessionStorage.getItem("userRole");
  const isLoggedIn = userRole === "sales";
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MasterDataProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />

            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <EmployeePortalTab />
                </ProtectedRoute>
              }
            />

            <Route
              path="/sales-portal"
              element={
                <SalesProtectedRoute>
                  <SalesPortal />
                </SalesProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </MasterDataProvider>
  </QueryClientProvider>
);

export default App;