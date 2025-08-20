import { Home, ScanLine, Clock, Heart, User } from "lucide-react";
import { Link, useLocation } from "wouter";

export function BottomNavigation() {
  const [location] = useLocation();
  
  const navItems = [
    {
      id: 'home',
      icon: Home,
      label: 'Home',
      href: '/',
      testId: 'nav-home'
    },
    {
      id: 'scan',
      icon: ScanLine,
      label: 'Scan',
      href: '/scan',
      testId: 'nav-scan'
    },
    {
      id: 'history',
      icon: Clock,
      label: 'History',
      href: '/history',
      testId: 'nav-history'
    },
    {
      id: 'coach',
      icon: Heart,
      label: 'Coach',
      href: '/coach',
      testId: 'nav-coach'
    },
    {
      id: 'profile',
      icon: User,
      label: 'Profile',
      href: '/profile',
      testId: 'nav-profile'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location === '/';
    }
    return location.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.id} href={item.href}>
              <button
                className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-lg transition-colors ${
                  active
                    ? 'text-emerald-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                data-testid={item.testId}
              >
                <Icon 
                  className={`w-5 h-5 ${active ? 'fill-current' : ''}`}
                />
                <span className={`text-xs font-medium ${active ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}