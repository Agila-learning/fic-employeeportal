import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  LogOut,
  ChevronRight,
  ClipboardList,
  Megaphone,
  CalendarCheck,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ficLogo from '@/assets/fic-logo.jpeg';
import { ThemeToggle } from '@/components/ThemeToggle';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/employees', icon: Users, label: 'Employees' },
    { to: '/admin/leads', icon: FileSpreadsheet, label: 'All Leads' },
    { to: '/admin/tasks', icon: ClipboardList, label: 'Tasks' },
    { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/admin/attendance', icon: CalendarCheck, label: 'Attendance' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const employeeLinks = [
    { to: '/employee', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/employee/leads', icon: FileSpreadsheet, label: 'My Leads' },
    { to: '/employee/add-lead', icon: UserPlus, label: 'Add Lead' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white overflow-hidden shadow-md">
            <img src={ficLogo} alt="FIC Logo" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">FIC Portal</h1>
            <p className="text-xs text-amber-400 font-medium">Building Future</p>
          </div>
        </div>

        {/* User Info */}
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 backdrop-blur-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-md">
              <span className="text-sm font-bold text-white">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
              <p className="text-xs text-amber-400/80 capitalize font-medium">{user?.role}</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <link.icon className="h-5 w-5" />
                <span className="flex-1">{link.label}</span>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-400"
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;