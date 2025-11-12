// =========================================
// TASK LIST COMPONENT
// Reusable task list with filtering and sorting
// =========================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/supabase';
import type { Task, Profile } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// =========================================
// INTERFACES
// =========================================

interface TaskWithDetails extends Task {
  assigned_to_profile?: Profile;
  project_name?: string;
}

type StatusFilter = 'all' | 'pending' | 'submitted' | 'approved' | 'rejected';
type SortField = 'deadline' | 'weight' | 'status' | 'title';
type SortDirection = 'asc' | 'desc';

interface TaskListProps {
  projectId?: string; // Optional: filter by project
  userId?: string; // Optional: filter by assigned user
  showProject?: boolean; // Show project name column
  title?: string;
  description?: string;
}

// =========================================
// MAIN COMPONENT
// =========================================

const TaskList: React.FC<TaskListProps> = ({
  projectId,
  userId,
  showProject = false,
  title = 'Daftar Tugas',
  description = 'Kelola dan pantau tugas yang diberikan',
}) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('deadline');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // =========================================
  // FETCH TASKS
  // =========================================

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);

      // Build query
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(*),
          project:projects(name)
        `)
        .order('deadline', { ascending: true });

      // Apply filters
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      if (userId) {
        query = query.eq('assigned_to', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data
      const tasksWithDetails: TaskWithDetails[] = (data || []).map((task) => ({
        ...task,
        project_name: task.project?.name,
      }));

      setTasks(tasksWithDetails);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('Gagal memuat daftar tugas');
    } finally {
      setLoading(false);
    }
  }, [projectId, userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // =========================================
  // FILTER & SORT
  // =========================================

  useEffect(() => {
    let result = [...tasks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.project_name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((task) => {
        switch (statusFilter) {
          case 'pending':
            return !task.is_submitted;
          case 'submitted':
            return task.is_submitted && !task.is_reviewed;
          case 'approved':
            return task.is_reviewed && !task.is_rejected;
          case 'rejected':
            return task.is_rejected;
          default:
            return true;
        }
      });
    }

    // Sorting
    result.sort((a, b) => {
      let aValue: string | number | undefined;
      let bValue: string | number | undefined;

      switch (sortField) {
        case 'deadline':
          aValue = a.deadline || '';
          bValue = b.deadline || '';
          break;
        case 'weight':
          aValue = a.project_weight;
          bValue = b.project_weight;
          break;
        case 'status':
          aValue = getTaskStatus(a);
          bValue = getTaskStatus(b);
          break;
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
      }

      if (aValue === undefined || aValue === '') return 1;
      if (bValue === undefined || bValue === '') return -1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredTasks(result);
  }, [tasks, searchQuery, statusFilter, sortField, sortDirection]);

  // =========================================
  // UTILITY FUNCTIONS
  // =========================================

  const getTaskStatus = (task: Task): string => {
    if (task.is_rejected) return 'rejected';
    if (task.is_reviewed && !task.is_rejected) return 'approved';
    if (task.is_submitted) return 'submitted';
    return 'pending';
  };

  const getStatusBadge = (task: Task) => {
    const status = getTaskStatus(task);
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500 text-white flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Disetujui
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500 text-white flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Ditolak
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-blue-500 text-white flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Direview
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500 text-white flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Pending
          </Badge>
        );
    }
  };

  const getDeadlineBadge = (deadline?: string) => {
    if (!deadline) return null;

    const deadlineDate = new Date(deadline);
    if (isPast(deadlineDate) && !isToday(deadlineDate)) {
      return (
        <Badge className="bg-red-100 text-red-800">
          Terlambat
        </Badge>
      );
    }
    if (isToday(deadlineDate)) {
      return (
        <Badge className="bg-orange-100 text-orange-800">
          Hari ini
        </Badge>
      );
    }
    if (isTomorrow(deadlineDate)) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          Besok
        </Badge>
      );
    }
    return null;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/tasks/${taskId}`);
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Cari tugas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'Semua' },
                { value: 'pending', label: 'Pending' },
                { value: 'submitted', label: 'Direview' },
                { value: 'approved', label: 'Disetujui' },
                { value: 'rejected', label: 'Ditolak' },
              ].map(({ value, label }) => (
                <Button
                  key={value}
                  variant={statusFilter === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(value as StatusFilter)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>Urutkan:</span>
            </div>
            {[
              { value: 'deadline', label: 'Deadline' },
              { value: 'weight', label: 'Bobot' },
              { value: 'status', label: 'Status' },
              { value: 'title', label: 'Judul' },
            ].map(({ value, label }) => (
              <Button
                key={value}
                variant={sortField === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSort(value as SortField)}
                className="flex items-center gap-1"
              >
                {label}
                <ArrowUpDown className="w-3 h-3" />
                {sortField === value && (
                  <span className="text-xs">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Menampilkan {filteredTasks.length} dari {tasks.length} tugas
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak ada tugas</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'Tidak ada tugas yang sesuai dengan filter'
                : 'Belum ada tugas yang diberikan'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <Card
              key={task.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleTaskClick(task.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      {getStatusBadge(task)}
                      {getDeadlineBadge(task.deadline)}
                      <Badge variant="outline" className="ml-auto">
                        Bobot: {task.project_weight}%
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {task.description || 'Tidak ada deskripsi'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {/* Assigned To */}
                  {task.assigned_to_profile && (
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        {task.assigned_to_profile.avatar_url ? (
                          <img
                            src={task.assigned_to_profile.avatar_url}
                            alt={task.assigned_to_profile.full_name || 'User'}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                            {task.assigned_to_profile.full_name?.[0]?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span className="text-xs">Ditugaskan ke:</span>
                        </div>
                        <span className="font-medium">
                          {task.assigned_to_profile.full_name || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Deadline */}
                  {task.deadline && (
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                        <Calendar className="w-3 h-3" />
                        <span>Deadline:</span>
                      </div>
                      <span className="font-medium">
                        {format(new Date(task.deadline), 'dd MMM yyyy, HH:mm', {
                          locale: idLocale,
                        })}
                      </span>
                    </div>
                  )}

                  {/* Project */}
                  {showProject && task.project_name && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Proyek:</div>
                      <span className="font-medium">{task.project_name}</span>
                    </div>
                  )}
                </div>

                {/* Review Info */}
                {task.reviewed_at && (
                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    Direview pada: {format(new Date(task.reviewed_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                    {task.review_comment && (
                      <p className="mt-1 text-sm">
                        <span className="font-semibold">Komentar:</span> {task.review_comment}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
