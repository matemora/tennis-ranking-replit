import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Rankings from "@/pages/rankings";
import MyMatches from "@/pages/my-matches";
import Statistics from "@/pages/statistics";
import Profile from "@/pages/profile";
import AdminDashboard from "@/pages/admin/index";
import AdminPlayers from "@/pages/admin/players";
import AdminRankings from "@/pages/admin/rankings";
import AdminLocations from "@/pages/admin/locations";
import Header from "@/components/layout/header";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useEffect } from "react";

function PrivateRoute({ component: Component, adminRequired = false, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && adminRequired && user?.role !== 'admin') {
      setLocation("/rankings");
    }
  }, [user, isLoading, adminRequired, setLocation]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null; // Redirect handled in useEffect
  }

  if (adminRequired && user.role !== 'admin') {
    return null; // Redirect handled in useEffect
  }

  return <Component {...rest} />;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();

  // Don't show layout on login/register pages
  if (location === '/login' || location === '/register') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {user && <Header />}
      <main className="flex-grow pb-20">{children}</main>
      {user && <BottomNavigation />}
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/">
        <AppLayout>
          <PrivateRoute component={Rankings} />
        </AppLayout>
      </Route>
      <Route path="/rankings">
        <AppLayout>
          <PrivateRoute component={Rankings} />
        </AppLayout>
      </Route>
      <Route path="/matches">
        <AppLayout>
          <PrivateRoute component={MyMatches} />
        </AppLayout>
      </Route>
      <Route path="/statistics">
        <AppLayout>
          <PrivateRoute component={Statistics} />
        </AppLayout>
      </Route>
      <Route path="/profile">
        <AppLayout>
          <PrivateRoute component={Profile} />
        </AppLayout>
      </Route>
      <Route path="/admin">
        <AppLayout>
          <PrivateRoute component={AdminDashboard} adminRequired={true} />
        </AppLayout>
      </Route>
      <Route path="/admin/players">
        <AppLayout>
          <PrivateRoute component={AdminPlayers} adminRequired={true} />
        </AppLayout>
      </Route>
      <Route path="/admin/rankings">
        <AppLayout>
          <PrivateRoute component={AdminRankings} adminRequired={true} />
        </AppLayout>
      </Route>
      <Route path="/admin/locations">
        <AppLayout>
          <PrivateRoute component={AdminLocations} adminRequired={true} />
        </AppLayout>
      </Route>
      <Route>
        <AppLayout>
          <NotFound />
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
