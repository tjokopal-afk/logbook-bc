// =========================================
// INTERN - MY LOGBOOK PAGE
// =========================================

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LogbookCard } from '@/components/intern/LogbookCard';
import { LogbookDetailModal } from '@/components/intern/LogbookDetailModal';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/supabase';
import type { LogbookEntry } from '@/types/logbook.types';

interface WeeklyLogbook {
  name: string;
  entries: LogbookEntry[];
  entriesCount: number;
  totalDuration: number;
  startDate: string;
  endDate: string;
}

export default function MyLogbook() {
  const { user } = useAuth();
  const [weeklyLogbooks, setWeeklyLogbooks] = useState<WeeklyLogbook[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLogbook, setSelectedLogbook] = useState<WeeklyLogbook | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWeeklyLogbooks();
    }
  }, [user]);

  const loadWeeklyLogbooks = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Get all entries with weekly category
      const { data, error } = await supabase
        .from('logbook_entries')
        .select('*')
        .eq('user_id', user.id)
        .like('category', 'weekly:%')
        .order('entry_date', { ascending: false });

      if (error) throw error;

      // Group by weekly name
      const grouped: Record<string, LogbookEntry[]> = {};
      (data || []).forEach((entry) => {
        const weeklyName = entry.category?.replace('weekly: ', '') || 'Unknown';
        if (!grouped[weeklyName]) {
          grouped[weeklyName] = [];
        }
        grouped[weeklyName].push(entry);
      });

      // Convert to WeeklyLogbook array
      const logbooks: WeeklyLogbook[] = Object.entries(grouped).map(([name, entries]) => {
        const sortedEntries = entries.sort((a, b) => 
          new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
        );

        const totalDuration = entries.reduce((sum, entry) => {
          return sum + ((entry.duration_minutes || 0) / 60);
        }, 0);

        return {
          name,
          entries: sortedEntries,
          entriesCount: entries.length,
          totalDuration,
          startDate: sortedEntries[0]?.entry_date || '',
          endDate: sortedEntries[sortedEntries.length - 1]?.entry_date || '',
        };
      });

      setWeeklyLogbooks(logbooks);
    } catch (error) {
      console.error('Error loading weekly logbooks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogbooks = useMemo(() => {
    if (!searchQuery.trim()) return weeklyLogbooks;
    
    const query = searchQuery.toLowerCase();
    return weeklyLogbooks.filter((logbook) =>
      logbook.name.toLowerCase().includes(query)
    );
  }, [weeklyLogbooks, searchQuery]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Logbook Saya</h1>
        <p className="text-muted-foreground mt-2">
          Daftar logbook mingguan yang telah disimpan
        </p>
      </div>

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
                    : 'Simpan draft aktivitas Anda di halaman Aktivitas'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLogbooks.map((logbook) => (
              <LogbookCard
                key={logbook.name}
                weeklyName={logbook.name}
                entriesCount={logbook.entriesCount}
                totalDuration={logbook.totalDuration}
                startDate={logbook.startDate}
                endDate={logbook.endDate}
                onViewDetail={() => setSelectedLogbook(logbook)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLogbook && (
        <LogbookDetailModal
          isOpen={!!selectedLogbook}
          onClose={() => setSelectedLogbook(null)}
          weeklyName={selectedLogbook.name}
          entries={selectedLogbook.entries}
        />
      )}
    </div>
  );
}
