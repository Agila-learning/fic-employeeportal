import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  Settings,
  Menu,
  X,
  CalendarClock,
  HardDrive,
  Receipt,
  FileText,
  IndianRupee
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ficLogo from '@/assets/fic-logo.jpeg';
import { ThemeToggle } from '@/components/ThemeToggle';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);

  // Fetch pending leave requests count for admin
  useEffect(() => {
    if (user?.role !== 'admin') return;
    const fetchCount = async () => {
      const { count } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      setPendingLeaveCount(count || 0);
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user?.role]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/employees', icon: Users, label: 'Employees' },
    { to: '/admin/leads', icon: FileSpreadsheet, label: 'All Leads' },
    { to: '/admin/followups', icon: CalendarClock, label: 'Follow-ups' },
    { to: '/admin/tasks', icon: ClipboardList, label: 'Tasks' },
    { to: '/admin/reports', icon: FileText, label: 'Reports' },
    { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/admin/attendance', icon: CalendarCheck, label: 'Attendance' },
    { to: '/admin/leave-requests', icon: CalendarClock, label: 'Leave Requests' },
    { to: '/admin/storage', icon: HardDrive, label: 'Storage' },
    { to: '/admin/invoice', icon: Receipt, label: 'Invoice' },
    { to: '/admin/expenses', icon: IndianRupee, label: 'Expenses' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const employeeLinks = [
    { to: '/employee', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/employee/leads', icon: FileSpreadsheet, label: 'My Leads' },
    { to: '/employee/followups', icon: CalendarClock, label: 'Follow-ups' },
    { to: '/employee/add-lead', icon: UserPlus, label: 'Add Lead' },
    { to: '/employee/reports', icon: FileText, label: 'Reports' },
    { to: '/employee/attendance', icon: CalendarCheck, label: 'Attendance' },
    { to: '/employee/tasks', icon: ClipboardList, label: 'Tasks' },
    { to: '/employee/leave', icon: CalendarClock, label: 'Leave Request' },
    { to: '/employee/expenses', icon: IndianRupee, label: 'Expenses' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const links = user?.role === 'admin' ? adminLinks : employeeLinks;

  return (
    <>
      {/* Mobile hamburger button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-4 z-50 md:hidden bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-xl shadow-amber-500/40 transition-all duration-300 border-2 border-white/30 h-10 w-10",
          isOpen ? "left-[216px]" : "left-4"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl transition-transform duration-300 ease-in-out",
        isMobile && !isOpen && "-translate-x-full",
        isMobile && isOpen && "translate-x-0",
        !isMobile && "translate-x-0"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white overflow-hidden shadow-md">
              <img src={ficLogo} alt="FIC Logo" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">FIC Employee Portal</h1>
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
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                      : 'text-amber-100/90 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 hover:text-white hover:pl-5'
                  )}
                >
                  <link.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-amber-400")} />
                  <span className="flex-1">{link.label}</span>
                  {link.to === '/admin/leave-requests' && pendingLeaveCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white animate-pulse">
                      {pendingLeaveCount}
                    </span>
                  )}
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
    </>
  );
};

export default Sidebar;