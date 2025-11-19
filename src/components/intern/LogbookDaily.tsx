// =========================================
// LOGBOOK DAILY - Daily Entry Form for Interns
// =========================================
// WORKFLOW: User creates MULTIPLE entries per day
// Each entry = ONE activity with start_time, end_time, content, attachments
// All entries start with category='draft' until compiled into weekly log
// =========================================

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar,
  Save,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Clock,
  Plus,
  Trash2,
  Pencil
} from 'lucide-react';
import { format } from 'date-fns';
import type { LogbookEntry } from '@/types/logbook.types';
import { 
  createEntry, 
  updateEntry, 
  deleteEntry, 
  getEntriesByDate 
} from '@/services/logbookService';
import { supabase } from '@/supabase';

interface LogbookDailyProps {
  userId: string;
  projectId?: string; // Optional: can be linked to project or standalone
  taskId?: string; // Optional: link to specific task
  startDate?: string; // Internship start date from profile
}

// Calculate which week number a date falls into based on start_date
const calculateWeekNumber = (entryDate: string | undefined | null, startDate?: string): number => {
  if (!startDate || !entryDate) return 1;
  
  try {
    const start = new Date(startDate);
    const entry = new Date(entryDate);
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(entry.getTime())) {
      return 1;
    }
    
    // Calculate difference in days
    const diffTime = entry.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate week number (1-indexed)
    const weekNumber = Math.floor(diffDays / 7) + 1;
    
    return Math.max(1, weekNumber);
  } catch (error) {
    console.error('Error calculating week number:', error);
    return 1;
  }
};

export function LogbookDaily({ userId, projectId, taskId, startDate }: LogbookDailyProps) {
  // State management
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editingEntry, setEditingEntry] = useState<LogbookEntry | null>(null);
  
  // Project and Task selection state
  const [availableProjects, setAvailableProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [availableTasks, setAvailableTasks] = useState<Array<{ id: string; title: string; project_id: string }>>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(projectId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(taskId);
  
  // Form fields (for new entry or editing)
  const [content, setContent] = useState('');
  const DEFAULT_START = '07:30';
  const DEFAULT_END = '17:00';
  const [startTime, setStartTime] = useState(DEFAULT_START);
  const [endTime, setEndTime] = useState(DEFAULT_END);
  const [files, setFiles] = useState<File[]>([]);

  // Load user's available projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('project_participants')
          .select('project_id, projects!inner(id, name)')
          .eq('user_id', userId);
        
        if (error) throw error;
        
        if (data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const projects = data.map((p: any) => ({
            id: p.projects.id,
            name: p.projects.name
          }));
          setAvailableProjects(projects);
        }
      } catch (error) {
        console.error('Load projects error:', error);
      }
    };
    
    loadProjects();
  }, [userId]);

  // Load user's available tasks
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, project_id')
          .eq('assigned_to', userId);
        
        if (error) throw error;
        
        if (data) {
          setAvailableTasks(data);
        }
      } catch (error) {
        console.error('Load tasks error:', error);
      }
    };
    
    loadTasks();
  }, [userId]);

  // Load all entries for selected date
  const loadDailyEntries = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedEntries = await getEntriesByDate(userId, projectId || null, selectedDate);
      // Filter to only show draft entries (not yet compiled into weekly log)
      const draftEntries = fetchedEntries.filter((e: LogbookEntry) => e.category === 'draft');
      setEntries(draftEntries);
    } catch (error) {
      console.error('Load daily entries error:', error);
      alert('Failed to load entries for this date');
    } finally {
      setLoading(false);
    }
  }, [userId, projectId, selectedDate]);

  useEffect(() => {
    loadDailyEntries();
  }, [loadDailyEntries]);

  // Calculate duration in minutes
  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    const diff = endDate.getTime() - startDate.getTime();
    return Math.max(0, Math.floor(diff / 60000));
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles([...files, ...selectedFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Save new entry or update existing
  const handleSaveEntry = async () => {
    if (!content.trim()) {
      alert('Please describe your activity');
      return;
    }
    if (!startTime || !endTime) {
      alert('Please set start and end time');
      return;
    }

    const duration = calculateDuration(startTime, endTime);
    if (duration <= 0) {
      alert('End time must be after start time');
      return;
    }

    try {
      setSaving(true);

      if (editingEntry) {
        // Update existing entry
        await updateEntry(editingEntry.id, {
          content,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: duration,
        });
        alert('Entry updated successfully');
      } else {
        // Create new entry
        await createEntry({
          user_id: userId,
          project_id: selectedProjectId || undefined, // Use selected project from dropdown
          task_id: selectedTaskId || undefined, // Use selected task from dropdown
          entry_date: selectedDate,
          content,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: duration,
          category: 'draft', // All new entries start as draft
          files: files, // Attachments will be uploaded automatically
        });
        alert('Entry saved successfully');
      }

      // Reset form
      setContent('');
      setStartTime(DEFAULT_START);
      setEndTime(DEFAULT_END);
      setFiles([]);
      setSelectedProjectId(projectId); // Reset to default prop value
      setSelectedTaskId(taskId); // Reset to default prop value
      setEditingEntry(null);

      if (editingEntry) {
        // Reload entries for same day when updating
        loadDailyEntries();
      } else {
        // Auto-advance date by +1 day for next draft (still editable). Do not go beyond today.
        try {
          const d = new Date(selectedDate);
          d.setDate(d.getDate() + 1);
          const nextDate = format(d, 'yyyy-MM-dd');
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          if (nextDate <= todayStr) {
            setSelectedDate(nextDate);
          } else {
            // Keep current date if next day is in the future
            loadDailyEntries();
          }
        } catch {
          // Fallback: ignore if date parsing fails
          loadDailyEntries();
        }
      }
    } catch (error) {
      console.error('Save entry error:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Edit existing entry
  const handleEditEntry = (entry: LogbookEntry) => {
    setEditingEntry(entry);
    setContent(entry.content || '');
    // entry.start_time / end_time from DB are full ISO timestamptz strings.
    // Convert to HH:mm for the time input value expected by <input type="time">.
    const formatToHHMM = (iso?: string | null) => {
      if (!iso) return '';
      try {
        const d = new Date(iso);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      } catch {
        return '';
      }
    };
    setStartTime(formatToHHMM(entry.start_time));
    setEndTime(formatToHHMM(entry.end_time));
    setFiles([]); // Can't edit existing attachments, only add new ones
  };

  // Delete entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Delete this entry?')) return;

    try {
      await deleteEntry(entryId);
      alert('Entry deleted');
      loadDailyEntries();
    } catch (error) {
      console.error('Delete entry error:', error);
      alert('Failed to delete entry');
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingEntry(null);
    setContent('');
    setStartTime(DEFAULT_START);
    setEndTime(DEFAULT_END);
    setFiles([]);
    setSelectedProjectId(projectId);
    setSelectedTaskId(taskId);
  };

  // Calculate total duration for the day
  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Logbook
          </CardTitle>
          <CardDescription>Record your daily activities and progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label>Date:</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')} // Can't select future dates
              className="w-48"
            />
            <Badge variant="outline" className="ml-auto">
              <Clock className="h-4 w-4 mr-1" />
              {totalHours}h {remainingMinutes}m logged today
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingEntry ? (
              <>
                <Pencil className="h-5 w-5" />
                Edit Entry
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                New Entry
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Duration Display */}
          {startTime && endTime && (
            <div className="text-sm text-gray-600">
              Duration: {Math.floor(calculateDuration(startTime, endTime) / 60)}h{' '}
              {calculateDuration(startTime, endTime) % 60}m
            </div>
          )}

          {/* Project and Task Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project-select">Project (Optional)</Label>
              <Select
                value={selectedProjectId}
                onValueChange={(value) => {
                  setSelectedProjectId(value === 'none' ? undefined : value);
                  // Reset task if project changes
                  if (value === 'none') setSelectedTaskId(undefined);
                }}
              >
                <SelectTrigger id="project-select">
                  <SelectValue placeholder="No project selected" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {availableProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-select">Task (Optional)</Label>
              <Select
                value={selectedTaskId}
                onValueChange={(value) => setSelectedTaskId(value === 'none' ? undefined : value)}
                disabled={!selectedProjectId}
              >
                <SelectTrigger id="task-select">
                  <SelectValue placeholder={selectedProjectId ? "No task selected" : "Select project first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No task</SelectItem>
                  {availableTasks
                    .filter((task) => !selectedProjectId || task.project_id === selectedProjectId)
                    .map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Activity Description */}
          <div>
            <Label htmlFor="content">Activity Description</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe what you worked on during this time..."
              rows={6}
              className="resize-none"
            />
          </div>

          {/* File Attachments */}
          <div>
            <Label>Attachments (optional)</Label>
            <div className="mt-2">
              <Input
                type="file"
                onChange={handleFileSelect}
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </span>
                </Button>
              </label>

              {/* Selected Files Preview */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 border rounded-md bg-gray-50"
                    >
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4 text-gray-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-600" />
                      )}
                      <span className="text-sm flex-1">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleSaveEntry} disabled={saving}>
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingEntry ? 'Update Entry' : 'Save Entry'}
                </>
              )}
            </Button>
            {editingEntry && (
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Draft Entries ({entries.length})</span>
            <Badge variant="outline" className="text-sm">
              {format(new Date(selectedDate), 'EEEE, MMM dd')}
            </Badge>
          </CardTitle>
          <CardDescription>
            All entries are saved as drafts. Go to "Weekly Draft" tab to compile and submit them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No draft entries for this date yet. Add your first entry above.
            </p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const weekNum = calculateWeekNumber(entry.entry_date || selectedDate, startDate);
                return (
                <div
                  key={entry.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Week {weekNum}
                        </Badge>
                        <Badge variant="outline">
                          {entry.start_time} - {entry.end_time}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          ({Math.floor((entry.duration_minutes || 0) / 60)}h{' '}
                          {(entry.duration_minutes || 0) % 60}m)
                        </span>
                        <Badge variant="secondary" className="ml-auto">
                          Draft
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {entry.content}
                      </p>
                      
                      {/* Attachments */}
                      {entry.attachments && entry.attachments.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {entry.attachments.map((attachment, idx) => (
                            <a
                              key={idx}
                              href={attachment.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                            >
                              📎 {attachment.file_name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditEntry(entry)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
