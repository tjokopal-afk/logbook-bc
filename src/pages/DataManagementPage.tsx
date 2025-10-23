// =========================================
// LAPORAN PAGE - Flat-Able Style
// =========================================

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LogbookCard } from '@/components/data-management/LogbookCard';
import { DetailModal } from '@/components/data-management/DetailModal';
import { useWeeklyLogbooks } from '@/hooks/useLogbookEntries';
import { Search, Loader2 } from 'lucide-react';
import type { WeeklyLogbook } from '@/types/logbook.types';

export default function DataManagementPage() {
  const { data: weeklyLogbooks = [], isLoading, refetch } = useWeeklyLogbooks();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<WeeklyLogbook | null>(null);

  // Memoized filtered logbooks for performance
  const filteredLogbooks = useMemo(() => {
    if (!searchQuery.trim()) return weeklyLogbooks;
    
    const query = searchQuery.toLowerCase();
    return weeklyLogbooks.filter((logbook) =>
      logbook.name.toLowerCase().includes(query)
    );
  }, [weeklyLogbooks, searchQuery]);

  const handleViewDetail = (logbook: WeeklyLogbook) => {
    setSelectedWeek(logbook);
  };

  const handleCloseDetail = () => {
    setSelectedWeek(null);
  };

  const handleDeleted = () => {
    refetch();
    setSelectedWeek(null);
  };

  return (
    <DashboardLayout 
      title="Laporan" 
      breadcrumb={[{ label: 'Data' }, { label: 'Laporan' }]}
    >
      <div className="space-y-6">

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Cari Logbook</CardTitle>
            <CardDescription>
              Cari logbook berdasarkan nama atau periode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari nama logbook..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-500 mt-2">
                Ditemukan {filteredLogbooks.length} dari {weeklyLogbooks.length} logbook
              </p>
            )}
          </CardContent>
        </Card>

        {/* Logbooks Grid */}
        <div>
          <h2 className="mb-4">Daftar Logbook Mingguan</h2>

          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex justify-center items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-gray-600">Memuat data...</span>
                </div>
              </CardContent>
            </Card>
          ) : filteredLogbooks.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada logbook mingguan'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery
                      ? 'Coba kata kunci lain'
                      : 'Simpan draft entries Anda di halaman Dashboard'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLogbooks.map((logbook) => (
                <LogbookCard
                  key={logbook.name}
                  logbook={logbook}
                  onViewDetail={handleViewDetail}
                  onDeleted={refetch}
                />
              ))}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedWeek && (
          <DetailModal
            logbook={selectedWeek}
            open={!!selectedWeek}
            onClose={handleCloseDetail}
            onDeleted={handleDeleted}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
