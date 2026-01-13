import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import MobileDesktopPopup from "@/components/ui/MobileDesktopPopup";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEmployees from "./pages/admin/AdminEmployees";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminFollowups from "./pages/admin/AdminFollowups";
import AdminStorage from "./pages/admin/AdminStorage";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeLeads from "./pages/employee/EmployeeLeads";
import EmployeeFollowups from "./pages/employee/EmployeeFollowups";
import EmployeeAttendance from "./pages/employee/EmployeeAttendance";
import EmployeeTasks from "./pages/employee/EmployeeTasks";
import AddLead from "./pages/employee/AddLead";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="fic-bda-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <MobileDesktopPopup />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/employees" element={<AdminEmployees />} />
              <Route path="/admin/leads" element={<AdminLeads />} />
              <Route path="/admin/tasks" element={<AdminTasks />} />
              <Route path="/admin/announcements" element={<AdminAnnouncements />} />
              <Route path="/admin/attendance" element={<AdminAttendance />} />
              <Route path="/admin/followups" element={<AdminFollowups />} />
              <Route path="/admin/storage" element={<AdminStorage />} />
              
              {/* Employee Routes */}
              <Route path="/employee" element={<EmployeeDashboard />} />
              <Route path="/employee/leads" element={<EmployeeLeads />} />
              <Route path="/employee/add-lead" element={<AddLead />} />
              <Route path="/employee/followups" element={<EmployeeFollowups />} />
              <Route path="/employee/attendance" element={<EmployeeAttendance />} />
              <Route path="/employee/tasks" element={<EmployeeTasks />} />
              
              {/* Common Routes */}
              <Route path="/settings" element={<Settings />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
