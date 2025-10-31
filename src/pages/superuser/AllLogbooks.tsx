// =========================================
// SUPERUSER - ALL LOGBOOKS (Enhanced)
// Complete logbook overview
// =========================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Search, 
  Eye,
  Download,
  Loader2,
  Calendar,
  User
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface LogbookEntry {
  id: string;
  user_id: string;
  project_id: string;
  activity: string;
  date: string;
  duration_hours: number;
  created_at: string;
  profiles?: {
    full_name: string;
    role: string;
  };
  projects?: {
    name: string;
  };
}

export default function AllLogbooks() {
  const { toast } = useToast();
  const [logbooks, setLogbooks] = useState<LogbookEntry[]>([]);
  const [filteredLogbooks, setFilteredLogbooks] = useState<LogbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    loadLogbooks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logbooks, searchQuery, dateFilter]);

  const loadLogbooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('logbook_entries')
        .select(`
          *,
          profiles:user_id (full_name, role),
          projects:project_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogbooks(data || []);
    } catch (error) {
      console.error('Error loading logbooks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load logbooks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logbooks];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.activity?.toLowerCase().includes(query) ||
          entry.profiles?.full_name?.toLowerCase().includes(query) ||
          entry.projects?.name?.toLowerCase().includes(query)
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter((entry) => new Date(entry.created_at) >= filterDate);
    }

    setFilteredLogbooks(filtered);
  };

  const stats = {
    total: logbooks.length,
    today: logbooks.filter((l) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(l.created_at) >= today;
    }).length,
    thisWeek: logbooks.filter((l) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(l.created_at) >= weekAgo;
    }).length,
    totalHours: logbooks.reduce((sum, l) => sum + (l.duration_hours || 0), 0),
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-red-600" />
            All Logbooks
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete logbook entries overview
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Entries</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.today}</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.thisWeek}</div>
            <p className="text-xs text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.totalHours}h</div>
            <p className="text-xs text-muted-foreground">Total Hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search logbooks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredLogbooks.length} of {logbooks.length} entries
          </div>
        </CardContent>
      </Card>

      {/* Logbooks List */}
      <Card>
        <CardHeader>
          <CardTitle>Logbook Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
          ) : filteredLogbooks.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No logbooks found</h3>
              <p className="text-sm text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogbooks.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-100 text-blue-700">
                        {entry.profiles?.full_name || 'Unknown'}
                      </Badge>
                      {entry.projects?.name && (
                        <Badge className="bg-purple-100 text-purple-700">
                          {entry.projects.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 font-medium mb-2">{entry.activity}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(entry.date), 'MMM dd, yyyy')}
                      </span>
                      <span>•</span>
                      <span>{entry.duration_hours}h</span>
                      <span>•</span>
                      <span>Created {format(new Date(entry.created_at), 'MMM dd, HH:mm')}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
