import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiCelebrationProps {
  show: boolean;
  onComplete?: () => void;
}

const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

const Confetti = ({ delay, color, startX }: { delay: number; color: string; startX: number }) => (
  <motion.div
    className="absolute w-3 h-3 rounded-sm"
    style={{ backgroundColor: color, left: `${startX}%` }}
    initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
    animate={{
      y: '100vh',
      x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50],
      rotate: [0, 360, 720, 1080],
      opacity: [1, 1, 1, 0],
    }}
    transition={{
      duration: 3,
      delay,
      ease: 'easeOut',
    }}
  />
);

const ConfettiCelebration = ({ show, onComplete }: ConfettiCelebrationProps) => {
  const [confettiPieces, setConfettiPieces] = useState<{ id: number; delay: number; color: string; startX: number }[]>([]);

  useEffect(() => {
    if (show) {
      const pieces = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        delay: Math.random() * 0.5,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        startX: Math.random() * 100,
      }));
      setConfettiPieces(pieces);

      const timer = setTimeout(() => {
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          
          {/* Confetti */}
          {confettiPieces.map((piece) => (
            <Confetti key={piece.id} delay={piece.delay} color={piece.color} startX={piece.startX} />
          ))}

          {/* Center Message */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-auto px-4"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          >
            <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-1 rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl px-6 sm:px-8 py-6 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-5xl sm:text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent mb-2"
                >
                  Congratulations!
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg sm:text-xl text-white font-semibold"
                >
                  You won ₹10K! 🏆
                </motion.p>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                  className="mt-4 text-3xl sm:text-4xl"
                >
                  💰💸🎊
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfettiCelebration;