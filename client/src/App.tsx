import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, AdminProvider, useAuth, useAdmin } from "@/lib/auth";
import { LanguageProvider } from "@/lib/language";
import LoginPage from "@/pages/login";
import WorkerDashboard from "@/pages/worker-dashboard";
import AdminLoginPage from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

function WorkerApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-28 w-28 mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <Skeleton className="h-48 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <WorkerDashboard />;
}

function AdminApp() {
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-28 w-28 mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-48 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLoginPage />;
  }

  return <AdminDashboard />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <AdminProvider>
              <Toaster />
              <Switch>
                <Route path="/admin" component={AdminApp} />
                <Route path="/" component={WorkerApp} />
                <Route component={WorkerApp} />
              </Switch>
            </AdminProvider>
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
