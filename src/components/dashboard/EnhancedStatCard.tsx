// =========================================
// ENHANCED STAT CARD - Professional v2.0
// With Hover Effects & Better Typography
// =========================================

import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface EnhancedStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
  trend?: {
    value: string;
    isUp: boolean;
  };
  subtitle?: string;
}

const colorClasses = {
  green: {
    bg: 'from-green-500 to-emerald-600',
    light: 'bg-green-50',
    text: 'text-green-600',
    ring: 'ring-green-100',
  },
  blue: {
    bg: 'from-blue-500 to-cyan-600',
    light: 'bg-blue-50',
    text: 'text-blue-600',
    ring: 'ring-blue-100',
  },
  yellow: {
    bg: 'from-yellow-500 to-amber-600',
    light: 'bg-yellow-50',
    text: 'text-yellow-600',
    ring: 'ring-yellow-100',
  },
  red: {
    bg: 'from-red-500 to-rose-600',
    light: 'bg-red-50',
    text: 'text-red-600',
    ring: 'ring-red-100',
  },
  purple: {
    bg: 'from-purple-500 to-indigo-600',
    light: 'bg-purple-50',
    text: 'text-purple-600',
    ring: 'ring-purple-100',
  },
};

export function EnhancedStatCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend,
  subtitle 
}: EnhancedStatCardProps) {
  const colors = colorClasses[color];

  return (
    <div 
      className="
        group relative bg-white rounded-lg border border-gray-200 
        shadow-sm hover:shadow-md 
        p-5 
        transition-all duration-200 ease-in-out
        hover:scale-[1.01]
        cursor-pointer
      "
      role="article"
      aria-label={`${title}: ${value}`}
    >
      {/* Background Decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${colors.light} rounded-full opacity-20 blur-3xl -z-10 group-hover:opacity-30 transition-opacity duration-300`} />

      <div className="flex items-start justify-between">
        {/* Left Content */}
        <div className="flex-1">
          {/* Title */}
          <p className="text-xs font-medium text-gray-600 mb-2">
            {title}
          </p>

          {/* Value */}
          <h3 className="text-2xl font-semibold text-black mb-2 tracking-tight">
            {value}
          </h3>

          {/* Trend or Subtitle */}
          {trend && (
            <div className="flex items-center gap-1">
              {trend.isUp ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span 
                className={`text-sm font-semibold ${
                  trend.isUp ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.value}
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last period</span>
            </div>
          )}
          
          {subtitle && !trend && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>

        {/* Icon */}
        <div className="relative">
          {/* Icon Background with Gradient */}
          <div 
            className={`
              w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg}
              flex items-center justify-center
              shadow-sm ring-2 ${colors.ring}
              group-hover:scale-105
              transition-all duration-200 ease-in-out
            `}
          >
            <Icon className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
        </div>
      </div>

      {/* Bottom Border Accent */}
      <div 
        className={`
          absolute bottom-0 left-0 right-0 h-1 
          bg-gradient-to-r ${colors.bg}
          rounded-b-xl
          transform scale-x-0 group-hover:scale-x-100
          transition-transform duration-300 ease-in-out
          origin-left
        `}
      />
    </div>
  );
}
