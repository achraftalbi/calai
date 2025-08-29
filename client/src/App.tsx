import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/Home";
import History from "@/pages/History";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import Scan from "@/pages/Scan";
import Coach from "@/pages/Coach";
import Profile from "@/pages/Profile";
import Subscribe from "@/pages/Subscribe";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import NotFound from "@/pages/not-found";
import { Home as HomeIcon, BarChart3, Settings as SettingsIcon, Clock, ScanLine, Heart, User } from "lucide-react";
import { CalAILogo } from "@/components/CalAILogo";
import { useLocation } from "wouter";

function AppHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CalAILogo size={32} />
          <h1 className="text-xl font-bold text-slate-800" data-testid="text-app-title">CalAI</h1>
        </div>
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" data-testid="button-profile">
          <div className="w-6 h-6 bg-gradient-to-br from-calai-primary to-calai-secondary rounded-full"></div>
        </button>
      </div>
    </header>
  );
}

function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: HomeIcon, label: "Home" },
    { path: "/scan", icon: ScanLine, label: "Scan" },
    { path: "/history", icon: Clock, label: "History" },
    { path: "/coach", icon: Heart, label: "Coach" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-pb z-40">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location === path;
            return (
              <a
                key={path}
                href={path}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-lg transition-colors ${
                  isActive ? "text-calai-secondary" : "text-slate-500 hover:text-slate-700"
                }`}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-calai-secondary' : 'text-slate-500'}`}>
                  {label}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="bg-slate-50 min-h-screen">
      {isAuthenticated && !isLoading && <AppHeader />}
      <Switch>
        {isLoading || !isAuthenticated ? (
          <>
            <Route path="/login" component={Login} />
            <Route path="/auth/callback" component={AuthCallback} />
            <Route path="/" component={Landing} />
          </>
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/scan" component={Scan} />
            <Route path="/history" component={History} />
            <Route path="/coach" component={Coach} />
            <Route path="/profile" component={Profile} />
            <Route path="/subscribe" component={Subscribe} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/settings" component={Settings} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      {isAuthenticated && !isLoading && <BottomNavigation />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}


export default App;
