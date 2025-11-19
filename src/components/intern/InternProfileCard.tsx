// =========================================
// INTERN PROFILE CARD
// Display real intern profile data with stats
// =========================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Building2,
  BookOpen,
  Calendar,
  FileText,
  Clock,
  TrendingUp,
  Edit,
  Phone
} from 'lucide-react';
import { supabase } from '@/supabase';
import { format, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Profile } from '@/lib/api/types';

interface InternProfileStats {
  totalLogbookEntries: number;
  totalHours: number;
  approvedWeeks: number;
  currentStreak: number;
}

interface InternProfileCardProps {
  profile: Profile;
  onEdit?: () => void;
}

export function InternProfileCard({ profile, onEdit }: InternProfileCardProps) {
  const [stats, setStats] = useState<InternProfileStats>({
    totalLogbookEntries: 0,
    totalHours: 0,
    approvedWeeks: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id]);

  const loadStats = async () => {
    try {
      // Get logbook entries
      const { data: entries, error: entriesError } = await supabase
        .from('logbook_entries')
        .select('duration_minutes, category, entry_date')
        .eq('user_id', profile.id);

      if (entriesError) throw entriesError;

      const totalEntries = entries?.length || 0;
      const totalMinutes = entries?.reduce((sum, e) => sum + (e.duration_minutes || 0), 0) || 0;
      const totalHours = Math.round(totalMinutes / 60);

      // Count approved weeks
      const approvedWeeks = new Set(
        entries
          ?.filter(e => e.category?.includes('_log_approved'))
          .map(e => e.category?.match(/weekly_(\d+)_/)?.[1])
          .filter(Boolean)
      ).size;

      // Calculate current streak (consecutive days with entries)
      let currentStreak = 0;
      if (entries && entries.length > 0) {
        const sortedDates = entries
          .map(e => new Date(e.entry_date))
          .sort((a, b) => b.getTime() - a.getTime());

        let streakDate = new Date();
        for (const date of sortedDates) {
          const daysDiff = differenceInDays(streakDate, date);
          if (daysDiff === 0 || daysDiff === 1) {
            currentStreak++;
            streakDate = date;
          } else {
            break;
          }
        }
      }

      setStats({
        totalLogbookEntries: totalEntries,
        totalHours,
        approvedWeeks,
        currentStreak,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInternshipStatus = () => {
    if (!profile.start_date && !profile.end_date) return { label: 'Not Started', color: 'bg-gray-100 text-gray-700' };
    
    const today = new Date();
    const start = profile.start_date ? new Date(profile.start_date) : null;
    const end = profile.end_date ? new Date(profile.end_date) : null;

    if (start && start > today) return { label: 'Upcoming', color: 'bg-yellow-100 text-yellow-700' };
    if (end && end < today) return { label: 'Completed', color: 'bg-blue-100 text-blue-700' };
    return { label: 'Active', color: 'bg-green-100 text-green-700' };
  };

  const getDaysRemaining = () => {
    if (!profile.end_date) return null;
    const days = differenceInDays(new Date(profile.end_date), new Date());
    return days > 0 ? days : 0;
  };

  const status = getInternshipStatus();
  const daysRemaining = getDaysRemaining();

  return (
    <div className="space-y-4">
      {/* Main Profile Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-200">
                    {profile.full_name?.charAt(0) || 'I'}
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-2xl">{profile.full_name || 'Intern'}</CardTitle>
                  <Badge className={status.color}>{status.label}</Badge>
                </div>
                <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </p>
                {profile.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {profile.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Edit Button */}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="gap-1"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Personal Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.company && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Company
                </p>
                <p className="text-sm font-medium mt-1">{profile.company}</p>
              </div>
            )}

            {profile.username && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Username
                </p>
                <p className="text-sm font-medium mt-1">@{profile.username}</p>
              </div>
            )}

            {profile.phone && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Phone
                </p>
                <p className="text-sm font-medium mt-1">{profile.phone}</p>
              </div>
            )}
          </div>

          {/* Internship Period */}
          {(profile.start_date || profile.end_date) && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-900 flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Internship Period
              </p>
              <div className="space-y-1 text-sm">
                {profile.start_date && (
                  <p className="text-blue-800">
                    <span className="text-gray-600">Start:</span> {format(new Date(profile.start_date), 'PPP', { locale: idLocale })}
                  </p>
                )}
                {profile.end_date && (
                  <p className="text-blue-800">
                    <span className="text-gray-600">End:</span> {format(new Date(profile.end_date), 'PPP', { locale: idLocale })}
                  </p>
                )}
                {daysRemaining !== null && daysRemaining > 0 && (
                  <p className="text-blue-700 font-semibold">
                    📅 {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Logbook Entries */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Logbook Entries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '—' : stats.totalLogbookEntries}
                </p>
              </div>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Total Hours */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loading ? '—' : `${stats.totalHours}h`}
                </p>
              </div>
              <Clock className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Approved Weeks */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Approved Weeks</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? '—' : stats.approvedWeeks}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Current Streak</p>
                <p className="text-2xl font-bold text-orange-600">
                  {loading ? '—' : `${stats.currentStreak}d`}
                </p>
              </div>
              <BookOpen className="w-5 h-5 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
