// =========================================
// RECENT ACTIVITY WIDGET
// Shows recent system activities and updates
// =========================================

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';
import type { Profile } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Activity,
  FileText,
  CheckCircle,
  XCircle,
  FolderPlus,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

// =========================================
// INTERFACES
// =========================================

interface ActivityItem {
  id: string;
  type: 'logbook' | 'review' | 'task' | 'project' | 'user';
  action: string;
  description: string;
  user?: Profile;
  timestamp: string;
  icon: React.ReactNode;
  colorClass: string;
}

interface RecentActivityProps {
  userId?: string; // Filter by user
  limit?: number;
}

// =========================================
// MAIN COMPONENT
// =========================================

const RecentActivity: React.FC<RecentActivityProps> = ({
  userId,
  limit = 10,
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================================
  // FETCH ACTIVITIES
  // =========================================

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const items: ActivityItem[] = [];

      // Fetch recent logbook entries
      let logbookQuery = supabase
        .from('logbook_entries')
        .select('id, activity_description, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);

      if (userId) {
        logbookQuery = logbookQuery.eq('user_id', userId);
      }

      const { data: logbooks } = await logbookQuery;

      if (logbooks) {
        for (const entry of logbooks) {
          const { data: user } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', entry.user_id)
            .single();

          items.push({
            id: entry.id,
            type: 'logbook',
            action: 'Created logbook entry',
            description: entry.activity_description || 'New logbook entry',
            user: user || undefined,
            timestamp: entry.created_at,
            icon: <FileText className="w-4 h-4" />,
            colorClass: 'bg-blue-100 text-blue-600',
          });
        }
      }

      // Fetch recent reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, rating, created_at, reviewer_id')
        .order('created_at', { ascending: false })
        .limit(5);

      if (reviews) {
        for (const review of reviews) {
          const { data: reviewer } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', review.reviewer_id)
            .single();

          items.push({
            id: review.id,
            type: 'review',
            action: 'Reviewed logbook',
            description: `Gave ${review.rating} star rating`,
            user: reviewer || undefined,
            timestamp: review.created_at,
            icon: review.rating >= 4 ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />,
            colorClass: review.rating >= 4 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600',
          });
        }
      }

      // Fetch recent tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, created_at, is_reviewed, is_rejected')
        .order('created_at', { ascending: false })
        .limit(5);

      if (tasks) {
        tasks.forEach((task) => {
          let action = 'Created task';
          let icon = <FileText className="w-4 h-4" />;
          let colorClass = 'bg-purple-100 text-purple-600';

          if (task.is_reviewed) {
            if (task.is_rejected) {
              action = 'Task rejected';
              icon = <XCircle className="w-4 h-4" />;
              colorClass = 'bg-red-100 text-red-600';
            } else {
              action = 'Task approved';
              icon = <CheckCircle className="w-4 h-4" />;
              colorClass = 'bg-green-100 text-green-600';
            }
          }

          items.push({
            id: task.id,
            type: 'task',
            action,
            description: task.title,
            timestamp: task.created_at,
            icon,
            colorClass,
          });
        });
      }

      // Fetch recent projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, created_at, created_by')
        .order('created_at', { ascending: false })
        .limit(3);

      if (projects) {
        for (const project of projects) {
          const { data: creator } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', project.created_by)
            .single();

          items.push({
            id: project.id,
            type: 'project',
            action: 'Created project',
            description: project.name,
            user: creator || undefined,
            timestamp: project.created_at,
            icon: <FolderPlus className="w-4 h-4" />,
            colorClass: 'bg-indigo-100 text-indigo-600',
          });
        }
      }

      // Sort by timestamp
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Limit results
      setActivities(items.slice(0, limit));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // =========================================
  // RENDER
  // =========================================

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest updates and actions in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No recent activity
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex gap-3">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full ${activity.colorClass} flex items-center justify-center flex-shrink-0`}>
                  {activity.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* User info */}
                      {activity.user && (
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="w-5 h-5">
                            {activity.user.avatar_url ? (
                              <img src={activity.user.avatar_url} alt={activity.user.full_name} />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                                {activity.user.full_name?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                          </Avatar>
                          <span className="text-sm font-medium">
                            {activity.user.full_name || 'Unknown'}
                          </span>
                        </div>
                      )}

                      {/* Action */}
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.description}
                      </p>
                    </div>

                    {/* Type badge */}
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {activity.type}
                    </Badge>
                  </div>

                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: idLocale,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
