import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import MobileDesktopPopup from "@/components/ui/MobileDesktopPopup";
import { lazy, Suspense } from "react";

import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminEmployees = lazy(() => import("./pages/admin/AdminEmployees"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminTasks = lazy(() => import("./pages/admin/AdminTasks"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements"));
const AdminAttendance = lazy(() => import("./pages/admin/AdminAttendance"));
const AdminFollowups = lazy(() => import("./pages/admin/AdminFollowups"));
const AdminStorage = lazy(() => import("./pages/admin/AdminStorage"));
const AdminInvoice = lazy(() => import("./pages/admin/AdminInvoice"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminLeaveRequestsPage = lazy(() => import("./pages/admin/AdminLeaveRequests"));
const AdminExpenses = lazy(() => import("./pages/admin/AdminExpenses"));
const AdminPayroll = lazy(() => import("./pages/admin/AdminPayroll"));
const AdminOfferLetter = lazy(() => import("./pages/admin/AdminOfferLetter"));

// Lazy load employee pages
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));
const EmployeeLeads = lazy(() => import("./pages/employee/EmployeeLeads"));
const EmployeeFollowups = lazy(() => import("./pages/employee/EmployeeFollowups"));
const EmployeeAttendance = lazy(() => import("./pages/employee/EmployeeAttendance"));
const EmployeeTasks = lazy(() => import("./pages/employee/EmployeeTasks"));
const EmployeeReports = lazy(() => import("./pages/employee/EmployeeReports"));
const AddLead = lazy(() => import("./pages/employee/AddLead"));
const EmployeeLeave = lazy(() => import("./pages/employee/EmployeeLeave"));
const EmployeeExpenses = lazy(() => import("./pages/employee/EmployeeExpenses"));
const EmployeePayslips = lazy(() => import("./pages/employee/EmployeePayslips"));
const Settings = lazy(() => import("./pages/Settings"));

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="fic-bda-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <MobileDesktopPopup />
          <BrowserRouter>
            <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Navigate to="/auth" replace />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/employees" element={<AdminEmployees />} />
                <Route path="/admin/leads" element={<AdminLeads />} />
                <Route path="/admin/tasks" element={<AdminTasks />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/announcements" element={<AdminAnnouncements />} />
                <Route path="/admin/attendance" element={<AdminAttendance />} />
                <Route path="/admin/followups" element={<AdminFollowups />} />
                <Route path="/admin/storage" element={<AdminStorage />} />
                <Route path="/admin/invoice" element={<AdminInvoice />} />
                <Route path="/admin/leave-requests" element={<AdminLeaveRequestsPage />} />
                <Route path="/admin/expenses" element={<AdminExpenses />} />
                <Route path="/admin/payroll" element={<AdminPayroll />} />
                <Route path="/admin/offer-letter" element={<AdminOfferLetter />} />
                
                {/* Employee Routes */}
                <Route path="/employee" element={<EmployeeDashboard />} />
                <Route path="/employee/leads" element={<EmployeeLeads />} />
                <Route path="/employee/add-lead" element={<AddLead />} />
                <Route path="/employee/followups" element={<EmployeeFollowups />} />
                <Route path="/employee/reports" element={<EmployeeReports />} />
                <Route path="/employee/attendance" element={<EmployeeAttendance />} />
                <Route path="/employee/tasks" element={<EmployeeTasks />} />
                <Route path="/employee/leave" element={<EmployeeLeave />} />
                <Route path="/employee/expenses" element={<EmployeeExpenses />} />
                <Route path="/employee/payslips" element={<EmployeePayslips />} />
                
                {/* Common Routes */}
                <Route path="/settings" element={<Settings />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
