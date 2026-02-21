import { Building2, Mail, Globe, Link2, LayoutDashboard, FileSpreadsheet, UserPlus, Smartphone, FolderOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="md:ml-64 p-4 sm:p-6">
      <Card className="border-0 shadow-xl bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
              {/* Company Info */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-white">Forge India Connect</h3>
                    <p className="text-amber-400 text-xs sm:text-sm font-medium">Shaping Future</p>
                  </div>
                </div>
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                  Empowering businesses with innovative solutions and connecting talent with opportunities.
                </p>
              </div>

              {/* Quick Links */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-semibold text-white text-sm sm:text-base">Quick Links</h4>
                <ul className="space-y-2 text-xs sm:text-sm">
                  <li>
                    <Link to="/employee" className="flex items-center gap-2 text-white/60 hover:text-amber-400 transition-all duration-300 hover:translate-x-1 group">
                      <LayoutDashboard className="h-3.5 w-3.5 text-amber-500 group-hover:text-amber-400 transition-colors" />
                      <span>Dashboard</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/employee/leads" className="flex items-center gap-2 text-white/60 hover:text-amber-400 transition-all duration-300 hover:translate-x-1 group">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-amber-500 group-hover:text-amber-400 transition-colors" />
                      <span>Manage Leads</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/employee/add-lead" className="flex items-center gap-2 text-white/60 hover:text-amber-400 transition-all duration-300 hover:translate-x-1 group">
                      <UserPlus className="h-3.5 w-3.5 text-amber-500 group-hover:text-amber-400 transition-colors" />
                      <span>Add Lead</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-semibold text-white text-sm sm:text-base">Contact Us</h4>
                <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <li className="flex items-center gap-2 text-white/60">
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 flex-shrink-0" />
                    <a href="mailto:info@forgeindiaconnect.com" className="truncate hover:text-amber-400 transition-colors">info@forgeindiaconnect.com</a>
                  </li>
                  <li className="flex items-center gap-2 text-white/60">
                    <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 flex-shrink-0" />
                    <a href="https://www.forgeindiaconnect.com" target="_blank" rel="noopener noreferrer" className="truncate hover:text-amber-400 transition-colors">www.forgeindiaconnect.com</a>
                  </li>
                </ul>
              </div>
            </div>

            {/* FIC Career Portal */}
            <div className="flex items-center justify-center gap-2 mb-4 py-3 px-4 rounded-lg bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20">
              <Link2 className="h-4 w-4 text-green-400" />
              <span className="text-white/80 text-xs sm:text-sm">FIC Career Portal Access</span>
              <span className="text-green-400">|</span>
              <a 
                href="https://ficchatsupport.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 transition-colors text-xs sm:text-sm font-medium"
              >
                🔗 ficchatsupport.vercel.app
              </a>
            </div>

            {/* FIC Connect App */}
            <div className="flex items-center justify-center gap-2 mb-4 py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20">
              <Smartphone className="h-4 w-4 text-blue-400" />
              <span className="text-white/80 text-xs sm:text-sm">Explore FIC Connect App</span>
              <span className="text-blue-400">|</span>
              <a 
                href="https://connectapp.forgeindiaconnect.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors text-xs sm:text-sm font-medium"
              >
                🔗 connectapp.forgeindiaconnect.com
              </a>
            </div>

            {/* Candidate Screening Portal */}
            <div className="flex items-center justify-center gap-2 mb-4 py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20">
              <Link2 className="h-4 w-4 text-amber-400" />
              <span className="text-white/80 text-xs sm:text-sm">Candidate Screening & Tracking Portal</span>
              <span className="text-amber-400">|</span>
              <a 
                href="https://job-path-guard.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 transition-colors text-xs sm:text-sm font-medium"
              >
                🔗 https://job-path-guard.vercel.app/
              </a>
            </div>

            {/* Employee Details Drive */}
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6 py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20">
              <FolderOpen className="h-4 w-4 text-purple-400" />
              <span className="text-white/80 text-xs sm:text-sm">Employee Details Drive</span>
              <span className="text-purple-400">|</span>
              <a 
                href="https://drive.google.com/drive/folders/1-7PHoUruvtXV6JdKgXK8dE-xhfZaTz9l?usp=sharing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition-colors text-xs sm:text-sm font-medium"
              >
                🔗 Open Drive
              </a>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4 sm:mb-6" />

            {/* Copyright */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-center sm:text-left">
              <p className="text-white/50 text-[10px] sm:text-xs">
                © 2026 Forge India Connect Pvt. Ltd. - Shaping Future
              </p>
              <p className="text-white/40 text-[10px] sm:text-xs">
                All Rights Reserved | Designed by IT Team
              </p>
            </div>
          </div>
        </div>
      </Card>
    </footer>
  );
};

export default Footer;
