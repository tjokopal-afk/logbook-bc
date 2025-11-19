// =========================================
// PROJECT DETAIL PAGE
// View project details, manage participants, tasks, and documents
// =========================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROLES } from '@/utils/roleConfig';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft,
  Briefcase, 
  Calendar,
  Users,
  FileText,
  Edit,
  SquareCheckBig,
  Trash2,
  UserPlus,
  Plus,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Crown,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { PROJECT_ROLES } from '@/utils/roleConfig';
import { format } from 'date-fns';
import { AddParticipantDialog } from '@/components/admin/AddParticipantDialog';
import { EditProjectDialogFull } from '@/components/admin/EditProjectDialogFull';
import { TaskManagementDialogFull } from '@/components/common/TaskManagementDialogFull';
import { TaskSubmissionDialog } from '@/components/common/TaskSubmissionDialog';
import { ProjectProgressJourney } from '@/components/common/ProjectProgressJourney';
import { ActivityTimeline } from '@/components/common/ActivityTimelineFull';
import { TaskSubmissionTimeline } from '@/components/common/TaskSubmissionTimeline';
import { UploadProjectDocumentDialog } from '@/components/common/UploadProjectDocumentDialog';
import { ProjectMilestoneTimeline } from '@/components/common/ProjectMilestoneTimeline';
import { reviewTask, calculateProjectProgress } from '@/services/taskService';

interface Project {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  deadline?: string;
  created_by: string;
  created_at: string;
  status?: 'active' | 'completed' | 'upcoming';
  charter_url?: string;
}

interface Participant {
  project_id: string;
  user_id: string;
  role_in_project: string;
  joined_at: string;
  user?: {
    full_name: string;
    email: string;
    role: string;
    avatar_url?: string;
  };
}

interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  deadline?: string;
  project_weight: number;
  is_submitted: boolean;
  is_reviewed: boolean;
  is_rejected: boolean;
  submission_comment?: string;
  submission_bucket_url?: string;
  assigned_user_name?: string;
  review_comment?: string;
  created_at: string;
  project_id: string;
  submitted_at?: string;
  reviewed_at?: string;
}

interface Document {
  id: string;
  project_id: string;
  uploaded_by: string;
  doc_type: string;
  storage_path: string; // Public URL stored here
  file_name: string;
  created_at: string;
  uploader_name?: string; // Enriched from profiles
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [completionRate, setCompletionRate] = useState(0);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showUploadDocument, setShowUploadDocument] = useState(false);
  const [viewingTaskTimeline, setViewingTaskTimeline] = useState<Task | null>(null);
  
  const [activeTab, setActiveTab] = useState('overview');

  // Dialog states for confirmations
  const [removeParticipantDialog, setRemoveParticipantDialog] = useState<{ open: boolean; userId: string; userName: string } | null>(null);
  const [setPICDialog, setSetPICDialog] = useState<{ open: boolean; userId: string; userName: string } | null>(null);
  const [rejectTaskDialog, setRejectTaskDialog] = useState<{ open: boolean; taskId: string } | null>(null);
  const [rejectionComment, setRejectionComment] = useState('');
  const [submissionDialog, setSubmissionDialog] = useState<{ open: boolean; taskId: string; taskTitle: string } | null>(null);
  const [completeProjectDialog, setCompleteProjectDialog] = useState(false);
  const [completingProject, setCompletingProject] = useState(false);
  const [deleteDocumentDialog, setDeleteDocumentDialog] = useState<{ open: boolean; docId: string; docName: string; storagePath: string } | null>(null);
  const [deletingDocument, setDeletingDocument] = useState(false);

  const isAdmin = profile?.role === ROLES.ADMIN;
  const isPIC = participants.some(p => p.user_id === profile?.id && p.role_in_project === PROJECT_ROLES.PIC);
  const canEdit = isAdmin || isPIC;
  const canManageTasks = isPIC; // Only PIC can create/edit tasks

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProjectData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadProject(),
        loadParticipants(),
        loadTasks(),
        loadDocuments(),
      ]);
    } catch (error) {
      console.error('Error loading project data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    setProject(data);
  };

  const loadParticipants = async () => {
    if (!id) return;

    // First, get all participants for this project
    const { data, error } = await supabase
      .from('project_participants')
      .select('*')
      .eq('project_id', id);

    if (error) {
      console.error('Error loading participants:', error);
      throw error;
    }

    // Then manually fetch user data for each participant
    const participantsWithUsers = await Promise.all(
      (data || []).map(async (p) => {
        const { data: userData } = await supabase
          .from('profiles')
          .select('full_name, email, role, avatar_url')
          .eq('id', p.user_id)
          .single();

        return {
          ...p,
          user: userData || undefined,
        };
      })
    );

    setParticipants(participantsWithUsers);
  };

  const loadTasks = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    const tasksData: Task[] = (data || []) as Task[];

    // Fetch assigned user names in batch to avoid N+1
    const assignedIds = Array.from(
      new Set(
        tasksData
          .map((t) => t.assigned_to)
          .filter((uid): uid is string => typeof uid === 'string' && uid.length > 0)
      )
    );
    let profileMap: Record<string, string> = {};
    if (assignedIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', assignedIds as string[]);

      profileMap = (profiles || []).reduce(
        (acc: Record<string, string>, p: { id: string; full_name: string }) => {
          acc[p.id] = p.full_name;
          return acc;
        },
        {}
      );
    }

    const enriched: Task[] = tasksData.map((t) => ({
      ...t,
      assigned_user_name: t.assigned_to ? profileMap[t.assigned_to] : undefined,
    }));

    setTasks(enriched);
    
    // Calculate weighted progress
    const progress = await calculateProjectProgress(id);
    setCompletionRate(progress);
  };

  const loadDocuments = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
      return;
    }

    // Fetch uploader names
    const docsWithUploaders = await Promise.all(
      (data || []).map(async (doc: Document) => {
        const { data: uploaderData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', doc.uploaded_by)
          .single();

        return {
          ...doc,
          uploader_name: uploaderData?.full_name || 'Unknown',
        } as Document;
      })
    );

    setDocuments(docsWithUploaders);
  };

  const handleRemoveParticipant = async (userId: string, userName: string) => {
    setRemoveParticipantDialog({ open: true, userId, userName });
  };

  const confirmRemoveParticipant = async () => {
    if (!removeParticipantDialog) return;

    try {
      const { error } = await supabase
        .from('project_participants')
        .delete()
        .eq('project_id', id)
        .eq('user_id', removeParticipantDialog.userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Participant removed from project',
      });

      loadParticipants();
    } catch (error) {
      console.error('Error removing participant:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove participant',
        variant: 'destructive',
      });
    } finally {
      setRemoveParticipantDialog(null);
    }
  };

  const handleSetPIC = async (userId: string, userName: string) => {
    setSetPICDialog({ open: true, userId, userName });
  };

  const confirmSetPIC = async () => {
    if (!setPICDialog) return;

    try {
      // First, remove PIC from all other participants
      await supabase
        .from('project_participants')
        .update({ role_in_project: PROJECT_ROLES.MEMBER })
        .eq('project_id', id);

      // Then set this participant as PIC
      const { error } = await supabase
        .from('project_participants')
        .update({ role_in_project: PROJECT_ROLES.PIC })
        .eq('project_id', id)
        .eq('user_id', setPICDialog.userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${setPICDialog.userName} is now the PIC`,
      });

      loadParticipants();
    } catch (error) {
      console.error('Error setting PIC:', error);
      toast({
        title: 'Error',
        description: 'Failed to set PIC',
        variant: 'destructive',
      });
    } finally {
      setSetPICDialog(null);
    }
  };

  const handleTaskSubmit = (taskId: string, taskTitle: string) => {
    // Open submission dialog instead of directly submitting
    setSubmissionDialog({ open: true, taskId, taskTitle });
  };

  const handleSubmissionSuccess = () => {
    toast({
      title: 'Success',
      description: 'Task submitted for review',
    });
    loadTasks();
  };

  const handleTaskReview = async (taskId: string, approved: boolean) => {
    if (!profile?.id) return;

    if (!approved) {
      // Show rejection dialog
      setRejectTaskDialog({ open: true, taskId });
      return;
    }

    // Approve directly
    try {
      await reviewTask(taskId, {
        approved: true,
        reviewer_id: profile.id,
      });

      toast({
        title: 'Success',
        description: 'Task approved',
      });

      loadTasks();
    } catch (error) {
      console.error('Error approving task:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve task',
        variant: 'destructive',
      });
    }
  };

  const confirmRejectTask = async () => {
    if (!rejectTaskDialog || !profile?.id) return;

    try {
      await reviewTask(rejectTaskDialog.taskId, {
        approved: false,
        reviewer_id: profile.id,
        comment: rejectionComment || undefined,
      });

      toast({
        title: 'Task Rejected',
        description: 'The task has been rejected. Member can revise and resubmit.',
      });

      loadTasks();
    } catch (error) {
      console.error('Error rejecting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject task',
        variant: 'destructive',
      });
    } finally {
      setRejectTaskDialog(null);
      setRejectionComment('');
    }
  };

  const handleCompleteProject = async () => {
    if (!project?.id) return;
    
    setCompletingProject(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status: 'completed',
        })
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project marked as completed!',
      });

      await loadProject();
    } catch (error) {
      console.error('Error completing project:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete project',
        variant: 'destructive',
      });
    } finally {
      setCompletingProject(false);
      setCompleteProjectDialog(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!deleteDocumentDialog) return;

    setDeletingDocument(true);
    try {
      // Delete from storage (extract path from URL if needed)
      const storagePath = deleteDocumentDialog.storagePath;
      let filePath = '';

      // If it's a full URL, extract the path after the bucket name
      if (storagePath.includes('/storage/v1/object/public/')) {
        const pathParts = storagePath.split('/storage/v1/object/public/user-media/');
        if (pathParts.length > 1) {
          filePath = pathParts[1];
        }
      } else if (storagePath.includes('user-media/')) {
        // If it's already a relative path
        filePath = storagePath.split('user-media/')[1] || storagePath;
      } else {
        filePath = storagePath;
      }

      // Delete from storage
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('user-media')
          .remove([filePath]);

        if (storageError) {
          console.warn('Storage delete warning:', storageError);
          // Continue anyway - file might not exist in storage
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', deleteDocumentDialog.docId);

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });

      await loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    } finally {
      setDeletingDocument(false);
      setDeleteDocumentDialog(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-600">Completed</Badge>;
      case 'upcoming':
        return <Badge className="bg-yellow-600">Upcoming</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      intern: { label: 'Intern', className: 'bg-green-100 text-green-700' },
      mentor: { label: 'Mentor', className: 'bg-blue-100 text-blue-700' },
      admin: { label: 'Admin', className: 'bg-purple-100 text-purple-700' },
      superuser: { label: 'Superuser', className: 'bg-red-100 text-red-700' },
    };
    return badges[role as keyof typeof badges] || badges.intern;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading project...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Project Not Found</h3>
            <p className="text-gray-500 mb-4">The project you're looking for doesn't exist.</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.is_reviewed && !t.is_rejected).length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              {getStatusBadge(project.status)}
            </div>
            <p className="text-muted-foreground mt-1">{project.description || 'No description'}</p>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {isPIC && project.status !== 'completed' && completionRate >= 100 && (
              <Button 
                size="sm" 
                onClick={() => setCompleteProjectDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Complete Project
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowEditProject(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Project
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="text-2xl font-bold">{participants.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks</p>
                <p className="text-2xl font-bold">{tasks.length}</p>
              </div>
              <Target className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedTasks}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-3xl grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="participants">Participants ({participants.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Start Date:</span>
                  <span className="font-medium">
                    {project.start_date ? format(new Date(project.start_date), 'PPP') : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">End Date:</span>
                  <span className="font-medium">
                    {project.end_date ? format(new Date(project.end_date), 'PPP') : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Deadline:</span>
                  <span className="font-medium">
                    {project.deadline ? format(new Date(project.deadline), 'PPP') : 'Not set'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Project Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {format(new Date(project.created_at), 'PPP')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {getStatusBadge(project.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completion:</span>
                  <span className="font-medium">{completionRate}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Project Documents ({documents.length})
                  <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                    Project Level
                  </Badge>
                </CardTitle>
                {canManageTasks && (
                  <Button size="sm" onClick={() => setShowUploadDocument(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No documents yet</p>
                  {canManageTasks && (
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => setShowUploadDocument(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Upload First Document
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.slice(0, 5).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-blue-500" />
                        <div>
                          <p className="font-semibold text-sm">{doc.file_name}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded by {doc.uploader_name} on {format(new Date(doc.created_at), 'PP')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(doc.storage_path, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {canManageTasks && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setDeleteDocumentDialog({
                              open: true,
                              docId: doc.id,
                              docName: doc.file_name,
                              storagePath: doc.storage_path
                            })}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {documents.length > 5 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      and {documents.length - 5} more...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {project.charter_url && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Project Charter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => window.open(project.charter_url, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  View Charter
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          {/* Milestone Timeline Visualization */}
          <ProjectMilestoneTimeline
            projectId={project.id}
            startDate={project.start_date}
            endDate={project.end_date}
          />

          {/* Progress Journey */}
          {project.start_date && project.end_date ? (
            <ProjectProgressJourney
              projectId={project.id}
              startDate={project.start_date}
              endDate={project.end_date}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">Set project start and end dates to see progress visualization</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team Members</CardTitle>
                {canEdit && (
                  <Button size="sm" onClick={() => setShowAddParticipant(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {participants.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No participants yet</p>
                    {canEdit && (
                      <Button
                        size="sm"
                        className="mt-3"
                        onClick={() => setShowAddParticipant(true)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add First Member
                      </Button>
                    )}
                  </div>
                ) : (
                  participants.map((participant) => {
                    const roleBadge = getRoleBadge(participant.user?.role || '');
                    const isPIC = participant.role_in_project === 'pic';

                    return (
                      <div
                        key={participant.user_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">
                                {participant.user?.full_name || 'Unknown'}
                              </p>
                              {isPIC && (
                                <Badge className="bg-yellow-500">
                                  <Crown className="w-3 h-3 mr-1" />
                                  PIC
                                </Badge>
                              )}
                              <Badge className={roleBadge.className}>
                                {roleBadge.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              {participant.user?.email || 'No email'}
                            </p>
                            <p className="text-xs text-gray-400">
                              Joined: {format(new Date(participant.joined_at), 'PP')}
                            </p>
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex gap-2">
                            {!isPIC && participant.user?.role === ROLES.MENTOR && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetPIC(participant.user_id, participant.user?.full_name || 'User')}
                              >
                                <Crown className="w-4 h-4 mr-1" />
                                Set as PIC
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleRemoveParticipant(participant.user_id, participant.user?.full_name || 'User')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Project Tasks</CardTitle>
                {canManageTasks && (
                  <Button size="sm" onClick={() => setShowCreateTask(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No tasks yet</p>
                  </div>
                ) : (
                    tasks.map((task) => {
                    const isAssignedToMe = task.assigned_to === profile?.id;
                    // Allow resubmission if rejected
                    const canSubmit = isAssignedToMe && (!task.is_submitted || task.is_rejected) && !task.is_reviewed;
                    const canReview = canManageTasks && task.is_submitted && !task.is_reviewed && !task.is_rejected;
                    // Resolve submitter's display name from participants list when available
                    const submitterName = task.assigned_user_name || participants.find(p => p.user_id === task.assigned_to)?.user?.full_name || 'Member';

                    return (
                      <div
                        key={task.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold">{task.title}</p>
                            <Badge variant="outline">Weight: {task.project_weight}</Badge>
                            {task.is_reviewed && !task.is_rejected && (
                              <Badge className="bg-green-600">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Approved
                              </Badge>
                            )}
                            {task.is_rejected && (
                              <Badge className="bg-red-600">
                                <XCircle className="w-3 h-3 mr-1" />
                                Rejected
                              </Badge>
                            )}
                            {task.is_submitted && !task.is_reviewed && (
                              <Badge className="bg-yellow-600">
                                <Clock className="w-3 h-3 mr-1" />
                                Under Review
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{task.description}</p>
                          )}
                          
                          {/* Submission Details */}
                          {task.submission_comment && (
                            <div className="mt-3 p-4 bg-gray-50 border-l-2 border-gray-900 rounded-r">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                                  <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-semibold text-gray-900">{submitterName}'s Submission</h4>
                                    {task.is_submitted && (
                                      <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                                        Submitted
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{task.submission_comment}</p>
                                  {task.submission_bucket_url && (
                                    <div className="mt-3 flex items-center gap-2">
                                      <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-xs">
                                        Task Attachment
                                      </Badge>
                                      <a
                                        href={task.submission_bucket_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                                      >
                                        <FileText className="w-4 h-4" />
                                        <span>View Attachment</span>
                                        <Download className="w-3.5 h-3.5 ml-1" />
                                      </a>
                                    </div>
                                  )}
                                  {/* Approve / Reject actions placed under the submission for PICs */}
                                  {canReview && (
                                    <div className="mt-3 flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleTaskReview(task.id, true)}
                                        className="text-green-600 hover:bg-green-50"
                                      >
                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleTaskReview(task.id, false)}
                                        className="text-red-600 hover:bg-red-50"
                                      >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Reject
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Rejection Comment */}
                          {task.is_rejected && task.review_comment && (
                            <div className="mt-3 p-4 bg-gray-50 border-l-2 border-gray-600 rounded-r">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                                  <XCircle className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-semibold text-gray-900">Feedback from PIC</h4>
                                    <Badge variant="outline" className="text-xs border-gray-400 text-gray-700">
                                      Needs Revision
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{task.review_comment}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            {task.deadline && (
                              <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-md">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="font-medium">Due: {format(new Date(task.deadline), 'MMM dd, yyyy')}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Task Actions Column */}
                        <div className="flex flex-col gap-2 items-center self-start min-w-[100px]">
                          {/* Timeline Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingTaskTimeline(task)}
                            className="w-full"
                          >
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Timeline
                          </Button>
                          
                          {/* Edit button (PIC only) */}
                          {canManageTasks && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingTask(task)}
                              className="w-full"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          )}

                          {/* Submit/Resubmit button (Member only) */}
                          {canSubmit && (
                            <Button
                              size="sm"
                              onClick={() => handleTaskSubmit(task.id, task.title)}
                              className="bg-green-600 hover:bg-green-700 w-full"
                            >
                              <SquareCheckBig className="w-4 h-4 mr-1" />
                              {task.is_rejected ? 'Resubmit' : 'Selesai'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <ActivityTimeline projectId={project.id} limit={30} />
        </TabsContent>
      </Tabs>

      {/* Add Participant Dialog */}
      {showAddParticipant && project && (
        <AddParticipantDialog
          isOpen={showAddParticipant}
          projectId={project.id}
          projectName={project.name}
          existingParticipants={participants.map(p => p.user_id)}
          onClose={() => setShowAddParticipant(false)}
          onSuccess={() => {
            loadParticipants();
            setShowAddParticipant(false);
          }}
        />
      )}

      {/* Edit Project Dialog */}
      {showEditProject && project && (
        <EditProjectDialogFull
          isOpen={showEditProject}
          project={project}
          onClose={() => setShowEditProject(false)}
          onSuccess={() => {
            loadProjectData();
            setShowEditProject(false);
          }}
        />
      )}

      {/* Create Task Dialog */}
      {showCreateTask && project && (
        <TaskManagementDialogFull
          open={showCreateTask}
          onOpenChange={setShowCreateTask}
          onSuccess={() => {
            loadTasks();
            setShowCreateTask(false);
          }}
          projectId={project.id}
          projectName={project.name}
          mode="create"
        />
      )}

      {/* Edit Task Dialog */}
      {editingTask && project && (
        <TaskManagementDialogFull
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          onSuccess={() => {
            loadTasks();
            setEditingTask(null);
          }}
          projectId={project.id}
          projectName={project.name}
          existingTask={editingTask}
          mode="edit"
        />
      )}

      {/* Remove Participant Confirmation Dialog */}
      <AlertDialog open={removeParticipantDialog?.open || false} onOpenChange={(open) => !open && setRemoveParticipantDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Participant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-semibold">{removeParticipantDialog?.userName}</span> from this project? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRemoveParticipantDialog(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveParticipant} className="bg-red-600 hover:bg-red-700">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set PIC Confirmation Dialog */}
      <AlertDialog open={setPICDialog?.open || false} onOpenChange={(open) => !open && setSetPICDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set as PIC (Person in Charge)</AlertDialogTitle>
            <AlertDialogDescription>
              Set <span className="font-semibold">{setPICDialog?.userName}</span> as the PIC for this project? 
              This will remove PIC role from other participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSetPICDialog(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSetPIC} className="bg-blue-600 hover:bg-blue-700">
              Set as PIC
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Task Dialog */}
      <AlertDialog open={rejectTaskDialog?.open || false} onOpenChange={(open) => {
        if (!open) {
          setRejectTaskDialog(null);
          setRejectionComment('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Task</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide feedback for the member to improve their work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            <Label htmlFor="rejection-comment">Rejection Reason (Optional)</Label>
            <Textarea
              id="rejection-comment"
              placeholder="Explain why this task is being rejected and what needs to be improved..."
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              The member will be able to revise and resubmit this task.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setRejectTaskDialog(null);
              setRejectionComment('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRejectTask} className="bg-red-600 hover:bg-red-700">
              Reject Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Task Submission Dialog */}
      {submissionDialog && (
        <TaskSubmissionDialog
          open={submissionDialog.open}
          onOpenChange={(open) => !open && setSubmissionDialog(null)}
          taskId={submissionDialog.taskId}
          taskTitle={submissionDialog.taskTitle}
          onSuccess={handleSubmissionSuccess}
        />
      )}

      {/* Upload Project Document Dialog */}
      {project && (
        <UploadProjectDocumentDialog
          open={showUploadDocument}
          onOpenChange={setShowUploadDocument}
          onSuccess={() => {
            loadDocuments();
            setShowUploadDocument(false);
          }}
          projectId={project.id}
          projectName={project.name}
        />
      )}

      {/* Task Timeline Dialog */}
      <Dialog open={!!viewingTaskTimeline} onOpenChange={(open) => !open && setViewingTaskTimeline(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Task Timeline: {viewingTaskTimeline?.title}
            </DialogTitle>
            <DialogDescription>
              View the complete workflow and submission history
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {viewingTaskTimeline && (
              <TaskSubmissionTimeline
                task={viewingTaskTimeline}
                projectDocuments={documents}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingTaskTimeline(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Project Confirmation Dialog */}
      <AlertDialog open={completeProjectDialog} onOpenChange={setCompleteProjectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Complete Project
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to mark this project as completed?
                </p>
                <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Project:</strong> {project.name}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <strong>Progress:</strong> {completionRate}% ({completedTasks} of {tasks.length} tasks completed)
                  </p>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  This will change the project status to "Completed". You can still access and view the project details.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completingProject}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCompleteProject} 
              disabled={completingProject}
              className="bg-green-600 hover:bg-green-700"
            >
              {completingProject ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete Project
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={deleteDocumentDialog?.open || false} onOpenChange={(open) => !open && setDeleteDocumentDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Delete Document
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this document?
                </p>
                <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>File:</strong> {deleteDocumentDialog?.docName}
                  </p>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  This action cannot be undone. The document will be permanently removed from storage and the database.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingDocument}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDocument} 
              disabled={deletingDocument}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingDocument ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Document
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
