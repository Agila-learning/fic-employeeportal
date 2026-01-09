import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'employee';
}

const DashboardLayout = ({ children, requiredRole }: DashboardLayoutProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admin can access both dashboards, but employees can only access employee dashboard
  if (requiredRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/employee" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar />
      <main className="ml-64 flex-1 p-6">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardLayout;