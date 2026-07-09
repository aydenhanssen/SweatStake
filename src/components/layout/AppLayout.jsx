import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Activity, User, Dumbbell } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/feed', icon: Activity, label: 'Feed' },
  { path: '/checkin', icon: Dumbbell, label: 'Check In' },
  { path: '/leaderboard', icon: Trophy, label: 'Ranks' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function AppLayout() {
  const location = useLocation();
  const isCheckinFlow = location.pathname === '/checkin';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className={`flex-1 overflow-y-auto ${isCheckinFlow ? 'pb-4' : 'pb-20'}`}>
        <Outlet />
      </div>
      {!isCheckinFlow && (
        <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
            const isCheckin = path === '/checkin';
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isCheckin
                    ? 'relative -mt-6'
                    : isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {isCheckin ? (
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                ) : (
                  <Icon className="w-5 h-5" />
                )}
                <span className={`text-[10px] font-medium ${isCheckin ? 'text-primary mt-1' : ''}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      )}
    </div>
  );
}