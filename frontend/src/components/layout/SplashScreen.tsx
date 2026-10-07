"use client";

import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function SplashScreen() {
  const { isLoading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Enforce a minimum display time so the progress bar can be seen
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1200); // 1.2 seconds artificial minimum load time
    return () => clearTimeout(timer);
  }, []);

  const showSplash = isLoading || !minTimeElapsed;

  return (
    <AnimatePresence>
      {showSplash && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f1118]"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-8 w-full max-w-xs px-6"
          >
            {/* Logo */}
            <motion.img 
              src="/logo.png" 
              alt="GrowSpin" 
              className="h-16 w-auto object-contain drop-shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              animate={{ 
                y: [0, -5, 0],
              }}
              transition={{ 
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut"
              }}
            />

            {/* Progress Bar Container */}
            <div className="w-full flex flex-col gap-3">
              <div className="w-full h-1.5 bg-[#1b202e] rounded-full overflow-hidden shadow-inner">
                {/* Progress Bar Fill */}
                <motion.div
                  className="h-full bg-gradient-to-r from-accent-blue via-[#60a5fa] to-accent-blue rounded-full relative"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ 
                    duration: 1.2, 
                    ease: "anticipate",
                  }}
                >
                  {/* Subtle shine effect on the progress bar */}
                  <motion.div 
                    className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear"
                    }}
                  />
                </motion.div>
              </div>
              
              <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-[#626983] uppercase">
                <span>Connecting</span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  100%
                </motion.span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
