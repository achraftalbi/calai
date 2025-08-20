import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import History from "@/pages/History";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import { Camera, Home as HomeIcon, BarChart3, Settings as SettingsIcon, Clock } from "lucide-react";
import { useLocation } from "wouter";

function AppHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800" data-testid="text-app-title">CalAI</h1>
        </div>
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" data-testid="button-profile">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-full"></div>
        </button>
      </div>
    </header>
  );
}

function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: HomeIcon, label: "Home" },
    { path: "/history", icon: Clock, label: "History" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/settings", icon: SettingsIcon, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-pb z-40">
      <div className="max-w-lg mx-auto px-4 py-2">
        <div className="flex justify-around items-center">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location === path;
            return (
              <a
                key={path}
                href={path}
                className={`flex flex-col items-center space-y-1 py-2 px-3 ${
                  isActive ? "text-indigo-600" : "text-slate-500"
                } hover:text-indigo-600 transition-colors`}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/history" component={History} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="bg-slate-50 min-h-screen">
          <AppHeader />
          <Router />
          <BottomNavigation />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
