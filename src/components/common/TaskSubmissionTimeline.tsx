// =========================================
// TASK SUBMISSION TIMELINE COMPONENT
// Visual timeline showing task workflow: document → submission → review
// =========================================

import { FileText, CheckCircle2, XCircle, Clock, Download, Upload, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface TimelineItem {
  type: 'project_doc' | 'member_submission' | 'submission_doc' | 'review_approve' | 'review_reject';
  timestamp?: string;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  userName?: string;
}

interface TaskSubmissionTimelineProps {
  task: {
    id: string;
    title: string;
    description?: string;
    created_at: string;
    is_submitted: boolean;
    is_reviewed: boolean;
    is_rejected: boolean;
    submitted_at?: string;
    reviewed_at?: string;
    submission_comment?: string;
    submission_bucket_url?: string;
    review_comment?: string;
    assigned_user_name?: string;
  };
  projectDocuments?: Array<{
    id: string;
    file_name: string;
    storage_path: string;
    created_at: string;
    uploader_name?: string;
  }>;
}

export function TaskSubmissionTimeline({ task, projectDocuments = [] }: TaskSubmissionTimelineProps) {
  // Build timeline items based on task state
  const timelineItems: TimelineItem[] = [];

  // 1. Project documents (if any)
  projectDocuments.forEach(doc => {
    timelineItems.push({
      type: 'project_doc',
      timestamp: doc.created_at,
      title: 'Project Document',
      description: doc.file_name,
      fileUrl: doc.storage_path,
      fileName: doc.file_name,
      userName: doc.uploader_name,
    });
  });

  // 2. Member submission (if submitted)
  if (task.is_submitted || task.submission_comment) {
    timelineItems.push({
      type: 'member_submission',
      timestamp: task.submitted_at || task.created_at,
      title: `${task.assigned_user_name || 'Member'}'s Submission`,
      description: task.submission_comment,
      userName: task.assigned_user_name,
    });

    // 3. If approved workflow
    if (task.is_reviewed && !task.is_rejected) {
      // Show submission doc first (if exists)
      if (task.submission_bucket_url) {
        timelineItems.push({
          type: 'submission_doc',
          timestamp: task.submitted_at,
          title: 'Submission Document',
          fileUrl: task.submission_bucket_url,
          fileName: 'Uploaded file',
        });
      }

      // Then review approval
      timelineItems.push({
        type: 'review_approve',
        timestamp: task.reviewed_at,
        title: 'Approved by PIC',
        description: task.review_comment,
      });
    }

    // 4. If rejected workflow
    if (task.is_rejected) {
      // Show rejection first
      timelineItems.push({
        type: 'review_reject',
        timestamp: task.reviewed_at,
        title: 'Feedback from PIC',
        description: task.review_comment,
      });

      // Then submission doc (if exists)
      if (task.submission_bucket_url) {
        timelineItems.push({
          type: 'submission_doc',
          timestamp: task.submitted_at,
          title: 'Submission Document',
          fileUrl: task.submission_bucket_url,
          fileName: 'Uploaded file',
        });
      }
    }
  }

  // Sort by timestamp
  timelineItems.sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeA - timeB;
  });

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical Timeline Line */}
      <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-gray-200" />

      {/* Timeline Items */}
      <div className="space-y-6">
        {timelineItems.map((item, index) => {
          const isLast = index === timelineItems.length - 1;
          return (
            <TimelineItemCard
              key={`${item.type}-${index}`}
              item={item}
              isLast={isLast}
            />
          );
        })}
      </div>
    </div>
  );
}

function TimelineItemCard({ item, isLast }: { item: TimelineItem; isLast: boolean }) {
  const getIcon = () => {
    switch (item.type) {
      case 'project_doc':
        return { icon: FileText, color: 'bg-blue-500', ring: 'ring-blue-200' };
      case 'member_submission':
        return { icon: Upload, color: 'bg-purple-500', ring: 'ring-purple-200' };
      case 'submission_doc':
        return { icon: FileText, color: 'bg-indigo-500', ring: 'ring-indigo-200' };
      case 'review_approve':
        return { icon: CheckCircle2, color: 'bg-green-500', ring: 'ring-green-200' };
      case 'review_reject':
        return { icon: XCircle, color: 'bg-red-500', ring: 'ring-red-200' };
      default:
        return { icon: Clock, color: 'bg-gray-500', ring: 'ring-gray-200' };
    }
  };

  const getBackgroundGradient = () => {
    switch (item.type) {
      case 'project_doc':
        return 'from-blue-50 to-cyan-50 border-blue-200';
      case 'member_submission':
        return 'from-purple-50 to-pink-50 border-purple-200';
      case 'submission_doc':
        return 'from-indigo-50 to-blue-50 border-indigo-200';
      case 'review_approve':
        return 'from-green-50 to-emerald-50 border-green-200';
      case 'review_reject':
        return 'from-red-50 to-orange-50 border-red-200';
      default:
        return 'from-gray-50 to-slate-50 border-gray-200';
    }
  };

  const { icon: Icon, color, ring } = getIcon();
  const bgGradient = getBackgroundGradient();

  return (
    <div className="relative flex gap-4 items-start">
      {/* Timeline Icon */}
      <div className={`relative flex-shrink-0 w-10 h-10 ${color} rounded-full flex items-center justify-center ring-4 ${ring} z-10`}>
        <Icon className="w-5 h-5 text-white" />
      </div>

      {/* Content Card */}
      <div className={`flex-1 bg-gradient-to-br ${bgGradient} border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${isLast ? 'mb-0' : 'mb-2'}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm">{item.title}</h4>
            {item.timestamp && (
              <p className="text-xs text-gray-500 mt-0.5">
                {format(new Date(item.timestamp), 'PPp')}
              </p>
            )}
            {item.userName && (
              <Badge variant="outline" className="mt-1 text-xs">
                {item.userName}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <div className="mt-2 flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {item.description}
            </p>
          </div>
        )}

        {/* File Download */}
        {item.fileUrl && (
          <div className="mt-3">
            <a
              href={item.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>{item.fileName || 'View Document'}</span>
              <Download className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
