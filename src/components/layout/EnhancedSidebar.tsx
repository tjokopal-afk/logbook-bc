// =========================================
// ENHANCED SIDEBAR - Professional Design v3.0
// Collapsible with Profile Box & Grouped Navigation
// =========================================

import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import {
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  Home,
  Briefcase,
  GraduationCap,
  Users,
  BarChart3,
  BookOpen,
  Eye,
  UserCheck,
  FileCheck,
  LayoutDashboard,
  ScrollText,
  Database,
  UserPlus,
  FileText,
  CheckSquare,
  Star,
  TrendingUp,
  Shield,
  ListChecks,
  ClipboardList,
  Combine,
  Building2,
} from 'lucide-react';
import { ROLE_MENUS, ROLES } from '@/utils/roleConfig';

const ICONS = {
  Home,
  BookOpen,
  Briefcase,
  CheckSquare,
  Star,
  TrendingUp,
  Users,
  Shield,
  ListChecks,
  FileCheck,
  LayoutDashboard,
  ScrollText,
  Database,
  UserPlus,
  FileText,
  BarChart3,
  ClipboardList,
  Eye,
  GraduationCap,
  UserCheck,
  Combine,
  Building2,
};

// Navigation items dengan grouping

interface EnhancedSidebarProps {
  isCollapsed: boolean;
}

export function EnhancedSidebar({ isCollapsed }: EnhancedSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside profile area
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Check if click is outside both button and dropdown
      const clickedOutsideButton = profileButtonRef.current && !profileButtonRef.current.contains(event.target as Node);
      const clickedOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target as Node);
      
      if (clickedOutsideButton && clickedOutsideDropdown && showProfileDropdown) {
        setShowProfileDropdown(false);
      }
    }

    if (showProfileDropdown && !isCollapsed) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileDropdown, isCollapsed]);

  // Close dropdown when sidebar collapses
  useEffect(() => {
    if (isCollapsed) {
      setShowProfileDropdown(false);
    }
  }, [isCollapsed]);

  const role = profile?.role ?? ROLES.INTERN;
  const menus = ROLE_MENUS[role];
  const navigationSections = menus.map((section) => ({
    title: section.section,
    items: section.items.map((item) => ({
      href: item.path,
      label: item.label,
      icon: ICONS[item.icon as keyof typeof ICONS] || Home,
    })),
  }));

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileAction = (action: 'profile' | 'settings') => {
    void action; // keep signature stable; settings navigates to profile for now
    setShowProfileDropdown(false);
    navigate('/profile');
  };

  // Get user display name
  const userName = profile?.full_name || profile?.username || 'User';
  const userEmail = profile?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <nav 
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 shadow-sm z-40 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-[280px]'
      }`}
    >
      {/* Profile Section - Always Visible with Accordion Style Dropdown */}
      <div className="border-b border-gray-200 bg-gradient-to-br from-[#6B8E23]/10 to-[#556B2F]/5 overflow-hidden">
        {/* Profile Button */}
        <div className={`px-4 py-4 ${
          isCollapsed ? 'px-0 py-4 flex justify-center' : 'px-4 py-4'
        }`}>
          <button
            ref={profileButtonRef}
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className={`flex items-center gap-3 rounded-lg hover:bg-[#6B8E23]/10 transition-all duration-200 group border border-transparent hover:border-[#6B8E23]/20 ${
              isCollapsed ? 'p-2' : 'w-full p-3'
            }`}
            aria-label="Profile menu"
            aria-expanded={showProfileDropdown}
            disabled={isCollapsed}
          >
            {/* Avatar - Always Visible */}
            <div className={`rounded-full bg-gradient-to-br from-[#6B8E23] to-[#556B2F] flex items-center justify-center text-white font-bold shadow-md ${
              isCollapsed ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg'
            }`}>
              {userInitial}
            </div>
            
            {/* User Info - Only when expanded */}
            {!isCollapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                </div>

                {/* Dropdown Icon */}
                <ChevronDown 
                  className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                    showProfileDropdown ? 'rotate-180' : ''
                  }`} 
                />
              </>
            )}
          </button>
        </div>

        {/* Inline Accordion Dropdown - Slides down pushing content */}
        <div 
          ref={dropdownRef}
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showProfileDropdown && !isCollapsed ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-4 space-y-1">
            <button
              onClick={() => handleProfileAction('profile')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/70 transition-colors text-left"
            >
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700 font-medium">View Profile</span>
            </button>
            <div className="border-t border-gray-300 my-2" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600 font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {navigationSections.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
            {/* Section Title */}
            {!isCollapsed && (
              <div className="px-6 mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>
            )}

            {/* Section Items */}
            <ul className="space-y-1 px-3">
              {section.items.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      preventScrollReset
                      className={`
                        group relative flex items-center gap-3 rounded-lg
                        transition-all duration-200
                        ${
                          isCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
                        }
                        ${
                          isActive
                            ? 'bg-[#6B8E23] text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                      aria-current={isActive ? 'page' : undefined}
                      title={isCollapsed ? item.label : undefined}
                    >
                      {/* Left Border Indicator */}
                      {isActive && !isCollapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                      )}

                      <Icon 
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isActive ? 'text-white scale-110' : 'text-gray-500 group-hover:scale-110'
                        } ${
                          isCollapsed ? 'mx-auto' : ''
                        }`} 
                      />
                      
                      {!isCollapsed && (
                        <>
                          <span className="font-medium">{item.label}</span>
                          {isActive && (
                            <ChevronRight className="w-4 h-4 ml-auto" />
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Account Section (Bottom) */}
      <div className="border-t border-gray-200 p-4">
        {!isCollapsed && (
          <div className="px-3 mb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Account
            </h3>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 group ${
            isCollapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
          }`}
          aria-label="Logout"
          title={isCollapsed ? 'Keluar' : undefined}
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          {!isCollapsed && <span className="font-medium">Keluar</span>}
        </button>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-center text-gray-500">
            © 2025 Log Book System v3.0
          </p>
        </div>
      )}
    </nav>
  );
}
