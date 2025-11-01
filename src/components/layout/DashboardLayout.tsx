// =========================================
// DASHBOARD LAYOUT - Professional v4.0
// With Header & Collapsible Sidebar
// =========================================

import { useState, useEffect, type ReactNode } from 'react';
import { EnhancedSidebar } from './EnhancedSidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string; // Optional, not displayed
  breadcrumb?: { label: string; href?: string }[]; // Optional, not displayed
}

export function DashboardLayout({ children, breadcrumb }: DashboardLayoutProps) {
  // Initialize state from localStorage, default to false if not found
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Fixed Top */}
      <Header 
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        breadcrumb={breadcrumb}
      />

      {/* Enhanced Sidebar - Collapsible */}
      <EnhancedSidebar isCollapsed={isSidebarCollapsed} />

      {/* Main Content Area */}
      <div 
        className={`pt-16 transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-[280px]'
        }`}
      >
        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
