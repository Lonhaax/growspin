"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type LayoutContextType = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

const LayoutContext = createContext<LayoutContextType>({
  isSidebarOpen: true,
  toggleSidebar: () => {},
});

export const LayoutProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // Auto-collapse on small screens
    const checkSize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <LayoutContext.Provider value={{ isSidebarOpen, toggleSidebar }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => useContext(LayoutContext);
