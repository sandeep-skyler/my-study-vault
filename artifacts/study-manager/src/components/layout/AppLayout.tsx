import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";
import { useLocation } from "wouter";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [location] = useLocation();

  // Close mobile sidebar on navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  return (
    <div className="min-h-[100dvh] flex bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-50">
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out md:hidden ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="bg-background h-full shadow-2xl relative">
          <button 
            className="absolute top-4 right-4 p-2 bg-sidebar rounded-full text-foreground/50 hover:text-foreground"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
          <Sidebar />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <header className="h-16 border-b border-border bg-background flex items-center px-4 md:hidden sticky top-0 z-30">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 text-foreground/70 hover:text-foreground hover:bg-accent rounded-md transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-4 font-bold text-lg">Study Manager</span>
        </header>

        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}