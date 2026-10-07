"use client";

import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

export function SplashScreen() {
  const { isLoading } = useAuth();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f1118]"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <img src="/logo.png" alt="GrowSpin" className="h-16 w-auto object-contain drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
            <div className="flex items-center gap-3 text-[#878eab] font-bold tracking-widest text-sm uppercase">
              <Loader2 size={16} className="animate-spin text-accent-blue" />
              Loading Session
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
