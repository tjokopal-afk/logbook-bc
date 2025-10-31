// =========================================
// WELCOME SECTION - Professional v2.0
// With Action Cards & Left Accent Border
// =========================================

import { useNavigate } from 'react-router';
import { Activity, FileText, TrendingUp, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ActionCard {
  title: string;
  description: string;
  icon: LucideIcon;
  color: 'green' | 'blue' | 'orange';
  href: string;
}

const actionCards: ActionCard[] = [
  {
    title: 'Input Aktivitas',
    description: 'Catat aktivitas harian Anda dengan mudah dan cepat',
    icon: Activity,
    color: 'green',
    href: '/dashboard',
  },
  {
    title: 'Buat Laporan',
    description: 'Generate laporan mingguan dalam format PDF',
    icon: FileText,
    color: 'blue',
    href: '/data-management',
  },
  {
    title: 'Pantau Progress',
    description: 'Lihat statistik dan perkembangan magang Anda',
    icon: TrendingUp,
    color: 'orange',
    href: '/settings',
  },
];

const colorClasses = {
  green: {
    accent: 'bg-gradient-to-b from-green-500 to-emerald-600',
    bg: 'from-green-50 to-emerald-50',
    icon: 'from-green-500 to-emerald-600',
    text: 'text-green-700',
    hover: 'hover:border-green-300 hover:bg-green-50',
    ring: 'ring-green-100',
  },
  blue: {
    accent: 'bg-gradient-to-b from-blue-500 to-cyan-600',
    bg: 'from-blue-50 to-cyan-50',
    icon: 'from-blue-500 to-cyan-600',
    text: 'text-blue-700',
    hover: 'hover:border-blue-300 hover:bg-blue-50',
    ring: 'ring-blue-100',
  },
  orange: {
    accent: 'bg-gradient-to-b from-orange-500 to-amber-600',
    bg: 'from-orange-50 to-amber-50',
    icon: 'from-orange-500 to-amber-600',
    text: 'text-orange-700',
    hover: 'hover:border-orange-300 hover:bg-orange-50',
    ring: 'ring-orange-100',
  },
};

export function WelcomeSection() {
  const navigate = useNavigate();

  const handleActionClick = (href: string) => {
    navigate(href);
  };

  return (
    <div className="space-y-5">
      {/* Welcome Card */}
      <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Left Accent Border */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6B8E23]" />

        <div className="p-6 pl-8">
          {/* Header */}
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-black mb-2">
              Selamat Datang di Log Book Magang! 👋
            </h2>
            <p className="text-sm text-gray-600">
              Pantau aktivitas harian dan kelola laporan magang Anda dengan mudah
            </p>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {actionCards.map((card) => {
              const Icon = card.icon;
              const colors = colorClasses[card.color];

              return (
                <button
                  key={card.title}
                  onClick={() => handleActionClick(card.href)}
                  className={`
                    group relative
                    flex flex-col items-start
                    p-5 rounded-lg
                    bg-white border border-gray-200
                    ${colors.hover}
                    transition-all duration-200 ease-in-out
                    hover:scale-[1.02] hover:shadow-md
                    cursor-pointer
                    text-left
                  `}
                  aria-label={`${card.title}: ${card.description}`}
                >
                  {/* Background Gradient */}
                  <div 
                    className={`
                      absolute inset-0 bg-gradient-to-br ${colors.bg}
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-300
                      rounded-xl
                    `}
                  />

                  {/* Content */}
                  <div className="relative z-10 w-full">
                    {/* Icon */}
                    <div className="mb-3">
                      <div 
                        className={`
                          w-10 h-10 rounded-lg 
                          bg-gradient-to-br ${colors.icon}
                          flex items-center justify-center
                          shadow-sm ring-2 ${colors.ring}
                          group-hover:scale-105
                          transition-all duration-200
                        `}
                      >
                        <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className={`text-base font-semibold mb-2 ${colors.text} group-hover:scale-105 transition-transform duration-300`}>
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                      {card.description}
                    </p>

                    {/* Arrow Icon */}
                    <div className="flex items-center gap-2 text-gray-400 group-hover:gap-3 transition-all duration-200">
                      <span className="text-xs font-medium">Mulai</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tips Banner */}
      <div className="bg-gradient-to-r from-[#6B8E23] to-[#556B2F] rounded-lg shadow-sm p-5 text-white">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold mb-1">Tips Hari Ini</h3>
            <p className="text-sm text-white/90">
              Catat aktivitas setiap hari agar laporan lebih akurat 📝
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
