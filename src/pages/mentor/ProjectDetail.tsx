// =========================================
// PROJECT DETAIL PAGE - Complete Project View
// Tabs: Overview, Tasks, Documents, Team
// =========================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ROLES } from '@/utils/roleConfig';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Users,
  FileText,
  Target,
  Download,
  Upload
} from 'lucide-react';
import { supabase } from '@/supabase';
import { ProgressVisualization } from '@/components/common/ProgressVisualization';
import { TaskReview } from '@/components/mentor/TaskReview';
import { TaskSubmission } from '@/components/intern/TaskSubmission';
import { getProjectDocuments, createProjectDocument } from '@/services/documentService';
import { getTasksByProject } from '@/services/taskService';
import type { Project, Task, ProjectDocument } from '@/lib/api/types';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// Extended types for joined data
interface ProjectDocumentWithUrl extends ProjectDocument {
  file_url?: string;
}

interface ParticipantWithUser {
  id: string;
  user_id: string;
  project_id: string;
  role_in_project: 'pic' | 'member';
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
    role?: string;
  };
}

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<ProjectDocumentWithUrl[]>([]);
  const [participants, setParticipants] = useState<ParticipantWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
      loadCurrentUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      // Get user role from profiles
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setCurrentUserRole(profile.role);
      }
    }
  };

  const loadProjectData = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      // Load project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData as Project);

      // Load tasks
      const tasksData = await getTasksByProject(projectId);
      setTasks(tasksData);

      // Load documents
      const docsData = await getProjectDocuments(projectId);
      setDocuments(docsData);

      // Load participants
      const { data: participantsData } = await supabase
        .from('project_participants')
        .select(`
          *,
          user:users!project_participants_user_id_fkey(
            full_name,
            email,
            role,
            avatar_url
          )
        `)
        .eq('project_id', projectId);

      setParticipants(participantsData || []);
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !projectId || !currentUserId) return;

    const file = e.target.files[0];
    setUploadingDoc(true);

    try {
      await createProjectDocument(
        projectId,
        file,
        'other',
        currentUserId
      );
      
      // Reload documents
      const docsData = await getProjectDocuments(projectId);
      setDocuments(docsData);
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploadingDoc(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'completed':
        return <Badge className="bg-gray-600">Completed</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-600">Upcoming</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const isUserPIC = participants.some(
    p => p.user_id === currentUserId && p.role_in_project === 'pic'
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Project not found</p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {getStatusBadge(project.status)}
          </div>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>
      </div>

      {/* Progress Overview */}
      <ProgressVisualization project={project} showDetails={true} />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <FileText className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <Target className="w-4 h-4 mr-2" />
            Tasks ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="w-4 h-4 mr-2" />
            Team ({participants.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">
                    {project.start_date 
                      ? format(new Date(project.start_date), 'dd MMMM yyyy', { locale: idLocale })
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">
                    {project.end_date 
                      ? format(new Date(project.end_date), 'dd MMMM yyyy', { locale: idLocale })
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{project.status || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Team Members</p>
                  <p className="font-medium">{participants.length} members</p>
                </div>
              </div>

              {project.charter_url && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Project Charter</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={project.charter_url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      View Charter
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No tasks yet</p>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task) => (
              <div key={task.id}>
                {isUserPIC || currentUserRole === ROLES.ADMIN ? (
                  <TaskReview 
                    task={task} 
                    reviewerId={currentUserId}
                    onReviewComplete={loadProjectData}
                  />
                ) : (
                  <TaskSubmission 
                    task={task}
                    onSubmitSuccess={loadProjectData}
                  />
                )}
              </div>
            ))
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Documents</CardTitle>
                  <CardDescription>Files and resources for this project</CardDescription>
                </div>
                <div>
                  <label htmlFor="doc-upload">
                    <Button variant="outline" size="sm" disabled={uploadingDoc} asChild>
                      <span className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingDoc ? 'Uploading...' : 'Upload'}
                      </span>
                    </Button>
                    <input
                      id="doc-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleDocumentUpload}
                      disabled={uploadingDoc}
                    />
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No documents yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'} • 
                            Uploaded {doc.created_at ? format(new Date(doc.created_at), 'dd MMM yyyy', { locale: idLocale }) : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.file_url || '', '_blank')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>People working on this project</CardDescription>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No team members yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                          {participant.user?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">{participant.user?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{participant.user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={participant.role_in_project === 'pic' ? 'default' : 'outline'}>
                          {participant.role_in_project === 'pic' ? 'PIC (Mentor)' : 'Member'}
                        </Badge>
                        <Badge variant="outline">
                          {participant.user?.role || 'user'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
