// =========================================
// KELOLA TASK PAGE - Mentor View
// Create and assign tasks to interns
// =========================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Search,
  AlertCircle,
  Edit,
  Trash2,
  Calendar,
  User,
  Briefcase
} from 'lucide-react';
import { CreateTaskDialog } from '@/components/mentor/CreateTaskDialog';
import { EditTaskDialog } from '@/components/mentor/EditTaskDialog';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// Mock data - replace with real Supabase data
interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  assignedTo: string;
  assignedToName: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  createdAt: string;
}

export default function KelolaTask() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed' | 'overdue'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, searchQuery, statusFilter]);

  const loadTasks = async () => {
    setLoading(true);
    // TODO: Replace with real Supabase query
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Implementasi Login Page',
        description: 'Buat halaman login dengan validasi form dan integrasi API',
        projectId: 'proj1',
        projectName: 'Project Alpha',
        assignedTo: 'intern1',
        assignedToName: 'John Doe',
        deadline: '2025-11-15',
        priority: 'high',
        progress: 75,
        status: 'in_progress',
        createdAt: '2025-10-01'
      },
      {
        id: '2',
        title: 'Setup Database Schema',
        description: 'Design dan implementasi database schema untuk user management',
        projectId: 'proj1',
        projectName: 'Project Alpha',
        assignedTo: 'intern1',
        assignedToName: 'John Doe',
        deadline: '2025-11-05',
        priority: 'high',
        progress: 100,
        status: 'completed',
        createdAt: '2025-09-25'
      },
      {
        id: '3',
        title: 'API Integration',
        description: 'Integrasi dengan backend API untuk data fetching',
        projectId: 'proj2',
        projectName: 'Project Beta',
        assignedTo: 'intern2',
        assignedToName: 'Jane Smith',
        deadline: '2025-11-20',
        priority: 'medium',
        progress: 40,
        status: 'in_progress',
        createdAt: '2025-10-10'
      },
      {
        id: '4',
        title: 'Unit Testing',
        description: 'Buat unit tests untuk semua components',
        projectId: 'proj1',
        projectName: 'Project Alpha',
        assignedTo: 'intern3',
        assignedToName: 'Ahmad Rizki',
        deadline: '2025-10-25',
        priority: 'medium',
        progress: 20,
        status: 'overdue',
        createdAt: '2025-10-05'
      },
      {
        id: '5',
        title: 'Documentation',
        description: 'Tulis dokumentasi teknis untuk project',
        projectId: 'proj3',
        projectName: 'Project Gamma',
        assignedTo: 'intern4',
        assignedToName: 'Sarah Johnson',
        deadline: '2025-11-30',
        priority: 'low',
        progress: 0,
        status: 'not_started',
        createdAt: '2025-10-20'
      }
    ];

    setTasks(mockTasks);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = tasks;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.assignedToName.toLowerCase().includes(query) ||
        t.projectName.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  };

  const handleCreateTask = (taskData: any) => {
    console.log('Creating task:', taskData);
    // TODO: Send to Supabase
    setShowCreateDialog(false);
    loadTasks(); // Reload tasks
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setShowEditDialog(true);
  };

  const handleUpdateTask = (taskId: string, taskData: any) => {
    console.log('Updating task:', taskId, taskData);
    // TODO: Update in Supabase
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, ...taskData, status: taskData.progress === 100 ? 'completed' : taskData.progress > 0 ? 'in_progress' : 'not_started' }
          : t
      )
    );
    setShowEditDialog(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Yakin ingin menghapus task ini?')) {
      console.log('Deleting task:', taskId);
      // TODO: Delete from Supabase
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-600">In Progress</Badge>;
      case 'overdue':
        return <Badge className="bg-red-600">Overdue</Badge>;
      case 'not_started':
        return <Badge variant="outline">Not Started</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge className="bg-orange-600">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const notStartedCount = tasks.filter(t => t.status === 'not_started').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const overdueCount = tasks.filter(t => t.status === 'overdue').length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kelola Task</h1>
          <p className="text-muted-foreground mt-2">
            Buat dan kelola task untuk intern
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari task, intern, atau project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({tasks.length})
              </Button>
              <Button
                variant={statusFilter === 'not_started' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('not_started')}
              >
                Not Started ({notStartedCount})
              </Button>
              <Button
                variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('in_progress')}
              >
                In Progress ({inProgressCount})
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('completed')}
              >
                Completed ({completedCount})
              </Button>
              <Button
                variant={statusFilter === 'overdue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('overdue')}
                className="text-red-600"
              >
                Overdue ({overdueCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tidak ada task</h3>
                <p className="text-sm text-gray-600">
                  {searchQuery ? 'Coba kata kunci lain' : 'Buat task baru untuk intern'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                    <CardDescription className="text-sm">
                      {task.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditTask(task)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Task Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Assigned to</p>
                      <p className="font-medium">{task.assignedToName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Project</p>
                      <p className="font-medium">{task.projectName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Deadline</p>
                      <p className="font-medium">
                        {format(new Date(task.deadline), 'dd MMM yyyy', { locale: idLocale })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">{task.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        task.status === 'completed' ? 'bg-green-600' :
                        task.status === 'overdue' ? 'bg-red-600' :
                        'bg-blue-600'
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateTask}
      />

      {/* Edit Task Dialog */}
      <EditTaskDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        task={selectedTask}
        onSubmit={handleUpdateTask}
      />
    </div>
  );
}
