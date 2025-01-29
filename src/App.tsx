import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FocusZone from "./pages/FocusZone";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setIsAuthenticated(!!session);

        // Set up real-time auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", event, !!session);
          setIsAuthenticated(!!session);

          if (event === 'SIGNED_OUT') {
            // Clear any auth-related state/storage
            await supabase.auth.signOut();
            setIsAuthenticated(false);
          } else if (event === 'SIGNED_IN') {
            setIsAuthenticated(true);
          } else if (event === 'TOKEN_REFRESHED') {
            setIsAuthenticated(true);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth error:', error);
        toast({
          title: "Authentication Error",
          description: error instanceof Error ? error.message : "Failed to authenticate",
          variant: "destructive",
        });
        // On error, sign out and redirect to login
        await supabase.auth.signOut();
        setIsAuthenticated(false);
      }
    };

    checkSession();
  }, [toast]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Index />
              } 
            />
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Login />
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated === false ? 
                <Navigate to="/login" replace /> : 
                <Dashboard />
              } 
            />
            <Route 
              path="/focus-zone/:id" 
              element={
                isAuthenticated === false ? 
                <Navigate to="/login" replace /> : 
                <FocusZone />
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;