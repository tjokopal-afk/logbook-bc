// =========================================
// ADMIN - KELOLA PROJECT PAGE
// Full CRUD operations for all projects
// =========================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  Calendar,
  Loader2
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { CreateProjectDialog } from '@/components/admin/CreateProjectDialog';
import { EditProjectDialog } from '@/components/admin/EditProjectDialog';
import { DeleteProjectDialog } from '@/components/admin/DeleteProjectDialog';
import { ViewProjectDialog } from '@/components/admin/ViewProjectDialog';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'upcoming';
  created_by?: string;
  created_by_name?: string;
  participant_count?: number;
  task_count?: number;
  completion_rate?: number;
}

export default function KelolaProject() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, searchQuery, statusFilter]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch additional data for each project
      const projectsWithData = await Promise.all(
        (projectsData || []).map(async (project) => {
          // Get creator info
          const { data: creatorData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', project.created_by || '')
            .single();

          // Get participant count
          const { count: participantCount } = await supabase
            .from('project_participants')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          // Get task count
          const { count: taskCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          // Calculate completion rate
          const { data: tasksData } = await supabase
            .from('tasks')
            .select('percent_of_project')
            .eq('project_id', project.id);

          const completionRate = tasksData && tasksData.length > 0
            ? Math.round(
                tasksData.reduce((sum, t) => sum + (t.percent_of_project || 0), 0) / tasksData.length
              )
            : 0;

          return {
            ...project,
            created_by_name: creatorData?.full_name || 'Unknown',
            participant_count: participantCount || 0,
            task_count: taskCount || 0,
            completion_rate: completionRate,
          };
        })
      );

      setProjects(projectsWithData);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.name?.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.created_by_name?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setShowEditDialog(true);
  };

  const handleDelete = (project: Project) => {
    setSelectedProject(project);
    setShowDeleteDialog(true);
  };

  const handleView = (project: Project) => {
    setSelectedProject(project);
    setShowViewDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { label: 'Active', className: 'bg-green-100 text-green-700' },
      completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
      upcoming: { label: 'Upcoming', className: 'bg-yellow-100 text-yellow-700' },
    };
    return badges[status as keyof typeof badges] || badges.active;
  };

  const getStats = () => {
    return {
      total: projects.length,
      active: projects.filter((p) => p.status === 'active').length,
      completed: projects.filter((p) => p.status === 'completed').length,
      upcoming: projects.filter((p) => p.status === 'upcoming').length,
    };
  };

  const stats = getStats();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-purple-600" />
            Kelola Project
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all projects in the system
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.upcoming}</div>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, description, or creator..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {loading ? (
          <div className="col-span-2 flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Loading projects...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-sm text-gray-600 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first project to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {project.description}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusBadge(project.status).className}>
                    {getStatusBadge(project.status).label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Timeline */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {format(new Date(project.start_date), 'dd MMM yyyy')} -{' '}
                    {format(new Date(project.end_date), 'dd MMM yyyy')}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                      <Users className="w-3 h-3" />
                      Participants
                    </div>
                    <p className="text-lg font-bold text-gray-900">{project.participant_count}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                      <Briefcase className="w-3 h-3" />
                      Tasks
                    </div>
                    <p className="text-lg font-bold text-gray-900">{project.task_count}</p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Completion</span>
                    <span className="font-semibold text-purple-600">{project.completion_rate}%</span>
                  </div>
                  <Progress value={project.completion_rate} className="h-2" />
                </div>

                {/* Creator */}
                <div className="text-xs text-gray-500 pt-2 border-t">
                  Created by: {project.created_by_name}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(project)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(project)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(project)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateProjectDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            loadProjects();
            setShowCreateDialog(false);
          }}
        />
      )}

      {showEditDialog && selectedProject && (
        <EditProjectDialog
          isOpen={showEditDialog}
          project={selectedProject}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedProject(null);
          }}
          onSuccess={() => {
            loadProjects();
            setShowEditDialog(false);
            setSelectedProject(null);
          }}
        />
      )}

      {showDeleteDialog && selectedProject && (
        <DeleteProjectDialog
          isOpen={showDeleteDialog}
          project={selectedProject}
          onClose={() => {
            setShowDeleteDialog(false);
            setSelectedProject(null);
          }}
          onSuccess={() => {
            loadProjects();
            setShowDeleteDialog(false);
            setSelectedProject(null);
          }}
        />
      )}

      {showViewDialog && selectedProject && (
        <ViewProjectDialog
          isOpen={showViewDialog}
          project={selectedProject}
          onClose={() => {
            setShowViewDialog(false);
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
}
