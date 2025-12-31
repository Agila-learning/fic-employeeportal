import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  FileSpreadsheet, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ficLogo from '@/assets/fic-logo.jpeg';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/employees', icon: Users, label: 'Employees' },
    { to: '/admin/leads', icon: FileSpreadsheet, label: 'All Leads' },
  ];

  const employeeLinks = [
    { to: '/employee', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/employee/leads', icon: FileSpreadsheet, label: 'My Leads' },
    { to: '/employee/add-lead', icon: UserPlus, label: 'Add Lead' },
  ];

  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card overflow-hidden shadow-md">
            <img src={ficLogo} alt="FIC Logo" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-primary">FIC Sales Portal</h1>
            <p className="text-xs text-sidebar-foreground/60">Shaping Future</p>
          </div>
        </div>

        {/* User Info */}
        <div className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent p-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-secondary shadow-md">
              <span className="text-sm font-bold text-secondary-foreground">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-sidebar-foreground/40">
            Navigation
          </p>
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
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
        <div className="border-t border-sidebar-border p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-xl text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive"
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
