// =========================================
// HEADER COMPONENT - Professional Layout
// Fixed Top - Height: 64px
// =========================================

import { useState } from 'react';
import { Search, Bell, Menu, Activity, BookOpen, X } from 'lucide-react';

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  breadcrumb?: { label: string; href?: string }[];
}

export function Header({ isSidebarCollapsed, onToggleSidebar, breadcrumb }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock notifications
  const notifications = [
    { id: 1, title: 'Aktivitas Baru', message: 'Anda telah menambahkan 3 aktivitas hari ini', time: '5 menit lalu', unread: true },
    { id: 2, title: 'Logbook Tersimpan', message: 'Logbook mingguan "Week 1" berhasil disimpan', time: '1 jam lalu', unread: true },
    { id: 3, title: 'Reminder', message: 'Jangan lupa catat aktivitas harian Anda', time: '2 jam lalu', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 shadow-sm z-50 flex">
      {/* Left Section - Same width as sidebar */}
      <div 
        className={`flex items-center gap-3 px-6 border-r border-gray-200 bg-gradient-to-r from-[#6B8E23] to-[#556B2F] transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-[280px]'
        }`}
      >
        {/* Logo & Title - Hidden when collapsed */}
        <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'hidden' : 'flex'}`}>
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
            <Activity className="w-6 h-6 text-[#6B8E23]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-white leading-tight">Log Book</span>
            <span className="text-xs text-white/80">Magang System</span>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className={`p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 ${
            isSidebarCollapsed ? 'mx-auto' : 'ml-auto'
          }`}
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Right Section - Full width */}
      <div className="flex-1 flex items-center justify-between px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          {breadcrumb && breadcrumb.length > 0 ? (
            breadcrumb.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span className="text-gray-400">/</span>}
                <span 
                  className={`font-medium ${
                    index === breadcrumb.length - 1 
                      ? 'text-gray-900' 
                      : 'text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))
          ) : (
            <span className="text-gray-500">Dashboard</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <div className="relative">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-105"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            {/* Search Dropdown */}
            {showSearch && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in zoom-in duration-200">
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari aktivitas, logbook..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E23] focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    {searchQuery ? (
                      <p>Mencari: "{searchQuery}"</p>
                    ) : (
                      <p className="text-xs">💡 Tips: Ketik untuk mencari aktivitas atau logbook</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notification Button with Badge */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-105"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white font-semibold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                    <span className="text-xs text-gray-500">{unreadCount} belum dibaca</span>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        notif.unread ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {notif.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900">{notif.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center border-t border-gray-200">
                  <button className="text-sm text-[#6B8E23] hover:text-[#556B2F] font-medium">
                    Lihat Semua Notifikasi
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tutorial Button */}
          <button
            onClick={() => setShowTutorial(true)}
            className="w-10 h-10 rounded-full bg-[#6B8E23] hover:bg-[#556B2F] flex items-center justify-center transition-all duration-200 hover:scale-105"
            aria-label="Tutorial"
            title="Tutorial"
          >
            <BookOpen className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowTutorial(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto z-10 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#6B8E23] to-[#556B2F] text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">📚 Tutorial Log Book System</h2>
                </div>
                <button
                  onClick={() => setShowTutorial(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Section 1 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#6B8E23] text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  Dashboard - Ringkasan Aktivitas
                </h3>
                <p className="text-gray-600 ml-10">
                  Halaman utama menampilkan statistik aktivitas Anda seperti total aktivitas, jam kerja, dan rata-rata produktivitas harian.
                </p>
              </div>

              {/* Section 2 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#6B8E23] text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  Aktivitas - Input Harian
                </h3>
                <ul className="text-gray-600 ml-10 space-y-2">
                  <li>• <strong>Input Aktivitas:</strong> Catat aktivitas harian dengan tanggal, waktu mulai, waktu selesai, dan deskripsi</li>
                  <li>• <strong>Preview Draft:</strong> Lihat semua aktivitas yang belum disimpan sebagai logbook mingguan</li>
                  <li>• <strong>Simpan Mingguan:</strong> Klik tombol "Simpan Logbook Mingguan" untuk menyimpan draft sebagai satu logbook</li>
                </ul>
              </div>

              {/* Section 3 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#6B8E23] text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  Laporan - Data Management
                </h3>
                <ul className="text-gray-600 ml-10 space-y-2">
                  <li>• <strong>Cari Logbook:</strong> Gunakan fitur pencarian untuk menemukan logbook berdasarkan nama</li>
                  <li>• <strong>Lihat Detail:</strong> Klik kartu logbook untuk melihat detail semua aktivitas dalam periode tersebut</li>
                  <li>• <strong>Export PDF:</strong> Download logbook dalam format PDF untuk laporan</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#6B8E23] text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                  Fitur Header
                </h3>
                <ul className="text-gray-600 ml-10 space-y-2">
                  <li>• <strong>Search (🔍):</strong> Cari aktivitas atau logbook dengan cepat</li>
                  <li>• <strong>Notifikasi (🔔):</strong> Lihat update dan reminder terbaru</li>
                  <li>• <strong>Tutorial (📚):</strong> Buka panduan ini kapan saja</li>
                </ul>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Tips & Trik</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Catat aktivitas setiap hari agar tidak lupa detail pekerjaan</li>
                  <li>• Gunakan deskripsi yang jelas untuk memudahkan review</li>
                  <li>• Simpan logbook mingguan secara teratur untuk laporan yang rapi</li>
                  <li>• Sidebar bisa di-collapse untuk tampilan lebih luas</li>
                </ul>
              </div>

              {/* Note */}
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Catatan Penting</h4>
                <p className="text-sm text-yellow-800">
                  Fitur "Simpan Logbook Mingguan" saat ini menggunakan penyimpanan lokal browser (localStorage) sebagai solusi sementara. 
                  Data akan tersimpan di browser Anda dan tidak akan hilang saat refresh, namun akan hilang jika cache browser dibersihkan.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-lg border-t border-gray-200">
              <button
                onClick={() => setShowTutorial(false)}
                className="w-full bg-[#6B8E23] hover:bg-[#556B2F] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Mengerti, Tutup Tutorial
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
