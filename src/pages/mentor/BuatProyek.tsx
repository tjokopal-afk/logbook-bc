// =========================================
// BUAT PROYEK PAGE - Mentor View
// Create and manage projects with key activities
// =========================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Users,
  CheckCircle2,
  ListChecks
} from 'lucide-react';
import { CreateProjectDialog } from '@/components/mentor/CreateProjectDialog';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// Mock data - replace with real Supabase data
interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'planning';
  internCount: number;
  taskCount: number;
  completedTasks: number;
  keyActivities: string[];
  createdAt: string;
}

export default function BuatProyek() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'planning'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, searchQuery, statusFilter]);

  const loadProjects = async () => {
    setLoading(true);
    // TODO: Replace with real Supabase query
    const mockProjects: Project[] = [
      {
        id: '1',
        name: 'Project Alpha',
        description: 'Development of internal management system',
        startDate: '2025-09-01',
        endDate: '2025-12-31',
        status: 'active',
        internCount: 2,
        taskCount: 20,
        completedTasks: 15,
        keyActivities: [
          'Memahami Struktur Project',
          'Setup Development Environment',
          'Implementasi Fitur Login',
          'Integrasi API Backend',
          'Testing & Bug Fixing',
          'Code Review dengan Mentor',
          'Dokumentasi Project',
          'Deployment ke Production'
        ],
        createdAt: '2025-08-15'
      },
      {
        id: '2',
        name: 'Project Beta',
        description: 'Mobile app development for customer service',
        startDate: '2025-09-15',
        endDate: '2025-12-15',
        status: 'active',
        internCount: 1,
        taskCount: 15,
        completedTasks: 12,
        keyActivities: [
          'Memahami Struktur Project',
          'Setup Development Environment',
          'Implementasi UI/UX Design',
          'Integrasi API',
          'Testing',
          'Deployment'
        ],
        createdAt: '2025-09-01'
      },
      {
        id: '3',
        name: 'Project Gamma',
        description: 'Data analytics dashboard',
        startDate: '2025-08-15',
        endDate: '2025-11-15',
        status: 'completed',
        internCount: 1,
        taskCount: 25,
        completedTasks: 25,
        keyActivities: [
          'Data Collection',
          'Data Processing',
          'Dashboard Design',
          'Implementation',
          'Testing',
          'Deployment'
        ],
        createdAt: '2025-08-01'
      }
    ];

    setProjects(mockProjects);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = projects;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    setFilteredProjects(filtered);
  };

  const handleCreateProject = (projectData: any) => {
    console.log('Creating project:', projectData);
    // TODO: Send to Supabase
    setShowCreateDialog(false);
    loadProjects(); // Reload projects
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Yakin ingin menghapus project ini? Semua task terkait akan terhapus.')) {
      console.log('Deleting project:', projectId);
      // TODO: Delete from Supabase
      setProjects(prev => prev.filter(p => p.id !== projectId));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'completed':
        return <Badge className="bg-gray-600">Completed</Badge>;
      case 'planning':
        return <Badge className="bg-blue-600">Planning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCompletionRate = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const activeCount = projects.filter(p => p.status === 'active').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const planningCount = projects.filter(p => p.status === 'planning').length;

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
          <h1 className="text-3xl font-bold">Buat Proyek</h1>
          <p className="text-muted-foreground mt-2">
            Kelola project dan key activities untuk intern
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Project
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
                placeholder="Cari project..."
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
                All ({projects.length})
              </Button>
              <Button
                variant={statusFilter === 'planning' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('planning')}
              >
                Planning ({planningCount})
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Active ({activeCount})
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('completed')}
              >
                Completed ({completedCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => {
          const completionRate = getCompletionRate(project.completedTasks, project.taskCount);

          return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {project.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  {getStatusBadge(project.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1 flex flex-col">
                {/* Period */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {format(new Date(project.startDate), 'dd MMM', { locale: idLocale })} - 
                    {format(new Date(project.endDate), 'dd MMM yyyy', { locale: idLocale })}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-1 mb-1">
                      <Users className="w-3 h-3 text-gray-500" />
                      <p className="text-xs text-gray-500">Interns</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{project.internCount}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-3 h-3 text-gray-500" />
                      <p className="text-xs text-gray-500">Tasks</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {project.completedTasks}/{project.taskCount}
                    </p>
                  </div>
                </div>

                {/* Completion Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Completion</span>
                    <span className="text-xs font-semibold">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        project.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Key Activities */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <ListChecks className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">
                      Key Activities ({project.keyActivities.length})
                    </span>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {project.keyActivities.slice(0, 4).map((activity, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        <span>{activity}</span>
                      </div>
                    ))}
                    {project.keyActivities.length > 4 && (
                      <p className="text-xs text-gray-500 italic">
                        +{project.keyActivities.length - 4} more...
                      </p>
                    )}
                  </div>
                </div>

                {/* View Details Button */}
                <Button variant="outline" size="sm" className="w-full mt-auto">
                  View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
