import { Building2, Mail, Globe } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="ml-0 md:ml-64 border-t border-border bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
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
                  <a href="/employee" className="text-white/60 hover:text-amber-400 transition-colors cursor-pointer">Dashboard</a>
                </li>
                <li>
                  <a href="/employee/leads" className="text-white/60 hover:text-amber-400 transition-colors cursor-pointer">Manage Leads</a>
                </li>
                <li>
                  <a href="/employee/add-lead" className="text-white/60 hover:text-amber-400 transition-colors cursor-pointer">Add Lead</a>
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
    </footer>
  );
};

export default Footer;
