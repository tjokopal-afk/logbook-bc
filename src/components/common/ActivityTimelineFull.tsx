// =========================================
// PROJECT ACTIVITY TIMELINE
// Shows chronological project events and activities
// =========================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { supabase } from '@/supabase';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Upload, 
  UserPlus, 
  Target,
  Edit,
  AlertCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityEvent {
  id: string;
  type: 'task_created' | 'task_submitted' | 'task_reviewed' | 'task_rejected' | 'task_updated' | 'document_uploaded' | 'participant_added' | 'project_updated';
  title: string;
  description?: string;
  user_name?: string;
  user_avatar?: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

interface ActivityTimelineProps {
  projectId: string;
  limit?: number;
}

export function ActivityTimeline({ projectId, limit = 20 }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      // Fetch multiple activity sources and combine them
      const [tasksData, docsData, participantsData] = await Promise.all([
        fetchTaskActivities(),
        fetchDocumentActivities(),
        fetchParticipantActivities(),
      ]);

      // Combine and sort by timestamp
      const combined = [...tasksData, ...docsData, ...participantsData]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      console.log('Activity Timeline Data:', {
        tasks: tasksData.length,
        docs: docsData.length,
        participants: participantsData.length,
        total: combined.length
      });

      setActivities(combined);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskActivities = async (): Promise<ActivityEvent[]> => {
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, created_at, is_submitted, is_reviewed, is_rejected, submitted_at, reviewed_at, assigned_to, reviewer_id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return [];
    }
    
    if (!tasks) return [];

    // Fetch user names for tasks
    const userIds = new Set<string>();
    tasks.forEach((t: { assigned_to?: string; reviewer_id?: string }) => {
      if (t.assigned_to) userIds.add(t.assigned_to);
      if (t.reviewer_id) userIds.add(t.reviewer_id);
    });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', Array.from(userIds));

    type ProfileData = { id: string; full_name: string; avatar_url: string };
    const profileMap = new Map<string, ProfileData>(profiles?.map(p => [p.id, p as ProfileData]) || []);

    const events: ActivityEvent[] = [];

    tasks.forEach((task: { id: string; title: string; created_at: string; is_submitted: boolean; is_reviewed: boolean; is_rejected: boolean; submitted_at?: string; reviewed_at?: string; assigned_to?: string; reviewer_id?: string }) => {
      const assignedUser = task.assigned_to ? profileMap.get(task.assigned_to) : null;
      const reviewer = task.reviewer_id ? profileMap.get(task.reviewer_id) : null;
      // Task created
      events.push({
        id: `task-created-${task.id}`,
        type: 'task_created',
        title: `Task Created: ${task.title}`,
        description: `New task assigned`,
        user_name: assignedUser?.full_name || 'Unknown',
        user_avatar: assignedUser?.avatar_url,
        timestamp: task.created_at,
      });

      // Task submitted
      if (task.is_submitted && task.submitted_at) {
        events.push({
          id: `task-submitted-${task.id}`,
          type: 'task_submitted',
          title: `Task Submitted: ${task.title}`,
          description: 'Waiting for review',
          user_name: assignedUser?.full_name || 'Unknown',
          user_avatar: assignedUser?.avatar_url,
          timestamp: task.submitted_at,
        });
      }

      // Task reviewed/rejected
      if (task.is_reviewed && task.reviewed_at) {
        events.push({
          id: `task-reviewed-${task.id}`,
          type: task.is_rejected ? 'task_rejected' : 'task_reviewed',
          title: task.is_rejected ? `Task Rejected: ${task.title}` : `Task Approved: ${task.title}`,
          description: task.is_rejected ? 'Needs revision' : 'Task completed successfully',
          user_name: reviewer?.full_name || 'Reviewer',
          user_avatar: reviewer?.avatar_url,
          timestamp: task.reviewed_at,
        });
      }
    });

    return events;
  };

  const fetchDocumentActivities = async (): Promise<ActivityEvent[]> => {
    const { data: docs, error } = await supabase
      .from('project_documents')
      .select('id, file_name, created_at, uploaded_by')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
    
    if (!docs) return [];

    // Fetch uploader names
    const uploaderIds = docs.map((d: { uploaded_by: string }) => d.uploaded_by).filter(Boolean);
    const { data: uploaders } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', uploaderIds);

    type ProfileData = { id: string; full_name: string; avatar_url: string };
    const uploaderMap = new Map<string, ProfileData>(uploaders?.map(u => [u.id, u as ProfileData]) || []);

    return docs.map((doc: { id: string; file_name: string; created_at: string; uploaded_by: string }) => {
      const uploader = uploaderMap.get(doc.uploaded_by);
      return {
        id: `doc-${doc.id}`,
        type: 'document_uploaded' as const,
        title: 'Document Uploaded',
        description: doc.file_name,
        user_name: uploader?.full_name || 'Unknown',
        user_avatar: uploader?.avatar_url,
        timestamp: doc.created_at,
      };
    });
  };

  const fetchParticipantActivities = async (): Promise<ActivityEvent[]> => {
    const { data: participants, error } = await supabase
      .from('project_participants')
      .select('joined_at, user_id')
      .eq('project_id', projectId)
      .order('joined_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching participants:', error);
      return [];
    }
    
    if (!participants) return [];

    // Fetch user details
    const userIds = participants.map((p: { user_id: string }) => p.user_id);
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .in('id', userIds);

    type UserProfileData = { id: string; full_name: string; avatar_url: string; role: string };
    const userMap = new Map<string, UserProfileData>(users?.map(u => [u.id, u as UserProfileData]) || []);

    return participants.map((p: { joined_at: string; user_id: string }, index: number) => {
      const user = userMap.get(p.user_id);
      return {
        id: `participant-${index}`,
        type: 'participant_added' as const,
        title: 'Member Joined',
        description: `${user?.full_name || 'User'} joined as ${user?.role || 'member'}`,
        user_name: user?.full_name || 'Unknown',
        user_avatar: user?.avatar_url,
        timestamp: p.joined_at,
      };
    });
  };

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'task_created':
        return { Icon: Target, color: 'text-blue-600 bg-blue-50' };
      case 'task_submitted':
        return { Icon: Upload, color: 'text-purple-600 bg-purple-50' };
      case 'task_reviewed':
        return { Icon: CheckCircle2, color: 'text-green-600 bg-green-50' };
      case 'task_rejected':
        return { Icon: XCircle, color: 'text-red-600 bg-red-50' };
      case 'task_updated':
        return { Icon: Edit, color: 'text-yellow-600 bg-yellow-50' };
      case 'document_uploaded':
        return { Icon: FileText, color: 'text-indigo-600 bg-indigo-50' };
      case 'participant_added':
        return { Icon: UserPlus, color: 'text-teal-600 bg-teal-50' };
      case 'project_updated':
        return { Icon: Edit, color: 'text-orange-600 bg-orange-50' };
      default:
        return { Icon: AlertCircle, color: 'text-gray-600 bg-gray-50' };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Loading activity...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No activity yet</p>
          </div>
        ) : (
          <div className="relative space-y-4">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

            {activities.map((activity) => {
              const { Icon, color } = getActivityIcon(activity.type);
              
              return (
                <div key={activity.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${color} border-4 border-white`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{activity.title}</h4>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        {activity.user_avatar ? (
                          <Avatar className="w-6 h-6">
                            <img src={activity.user_avatar} alt={activity.user_name} />
                          </Avatar>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-semibold text-gray-600">
                              {activity.user_name?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                        <span className="text-xs text-gray-600">{activity.user_name}</span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
