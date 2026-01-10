import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, X } from 'lucide-react';
import { Button } from './button';

const MobileDesktopPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Only show on mobile and if not already dismissed this session
    const hasSeenPopup = sessionStorage.getItem('desktop-popup-dismissed');
    
    if (isMobile && !hasSeenPopup) {
      // Show after a short delay
      const showTimer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);

      // Auto-hide after 6 seconds
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 7000);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isMobile]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('desktop-popup-dismissed', 'true');
  };

  if (!isMobile) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 right-4 z-[100] bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl shadow-2xl border border-white/20 backdrop-blur-sm"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="absolute top-2 right-2 h-6 w-6 text-white/70 hover:text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-3 pr-6">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">For Better Experience</p>
              <p className="text-white/80 text-xs">Use Desktop View for full features</p>
            </div>
          </div>
          
          {/* Progress bar for auto-dismiss */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 6, ease: 'linear' }}
            className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 origin-left rounded-b-xl"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileDesktopPopup;
