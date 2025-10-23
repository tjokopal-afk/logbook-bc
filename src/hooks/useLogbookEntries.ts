// =========================================
// REACT QUERY HOOKS - LOGBOOK ENTRIES
// Optimized with better caching and error handling
// =========================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as logbookService from '@/services/logbookService';
import type {
  CreateLogbookEntryDTO,
  UpdateLogbookEntryDTO,
} from '@/types/logbook.types';

// =========================================
// QUERY KEYS - Centralized for consistency
// =========================================

export const logbookKeys = {
  all: ['logbook'] as const,
  drafts: () => [...logbookKeys.all, 'drafts'] as const,
  allEntries: () => [...logbookKeys.all, 'entries'] as const,
  weekly: () => [...logbookKeys.all, 'weekly'] as const,
  weeklyDetail: (weekName: string) => [...logbookKeys.weekly(), weekName] as const,
};

// =========================================
// QUERIES - Optimized with stale time
// =========================================

/**
 * Hook to fetch draft entries
 * Optimized: 5min stale time, refetch on window focus
 */
export function useDraftEntries() {
  return useQuery({
    queryKey: logbookKeys.drafts(),
    queryFn: logbookService.getDraftEntries,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (previously cacheTime)
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

/**
 * Hook to fetch all entries
 */
export function useAllEntries() {
  return useQuery({
    queryKey: logbookKeys.allEntries(),
    queryFn: logbookService.getAllEntries,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

/**
 * Hook to fetch weekly logbooks
 */
export function useWeeklyLogbooks() {
  return useQuery({
    queryKey: logbookKeys.weekly(),
    queryFn: logbookService.getWeeklyLogbooks,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

/**
 * Hook to fetch entries for a specific weekly logbook
 */
export function useWeeklyLogbookEntries(weekName: string) {
  return useQuery({
    queryKey: logbookKeys.weeklyDetail(weekName),
    queryFn: () => logbookService.getWeeklyLogbookEntries(weekName),
    enabled: !!weekName,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
  });
}

// =========================================
// MUTATIONS - Optimized with callbacks
// =========================================

/**
 * Hook to create a new entry
 * Optimized: Invalidates related queries on success
 */
export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLogbookEntryDTO) =>
      logbookService.createEntry(data),
    onSuccess: () => {
      // Invalidate and refetch draft entries
      queryClient.invalidateQueries({ queryKey: logbookKeys.drafts() });
      queryClient.invalidateQueries({ queryKey: logbookKeys.allEntries() });
    },
    onError: (error) => {
      console.error('Create entry mutation error:', error);
    },
  });
}

/**
 * Hook to update an entry
 * Optimized: Better cache invalidation
 */
export function useUpdateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateLogbookEntryDTO }) =>
      logbookService.updateEntry(id, updates),
    onSuccess: (updatedEntry) => {
      // Invalidate queries based on whether entry is draft or in weekly logbook
      queryClient.invalidateQueries({ queryKey: logbookKeys.allEntries() });
      
      if (updatedEntry.weekly_logbook_name) {
        queryClient.invalidateQueries({ queryKey: logbookKeys.weekly() });
        queryClient.invalidateQueries({ 
          queryKey: logbookKeys.weeklyDetail(updatedEntry.weekly_logbook_name) 
        });
      } else {
        queryClient.invalidateQueries({ queryKey: logbookKeys.drafts() });
      }
    },
    onError: (error) => {
      console.error('Update entry mutation error:', error);
    },
  });
}

/**
 * Hook to delete an entry
 */
export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => logbookService.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: logbookKeys.drafts() });
      queryClient.invalidateQueries({ queryKey: logbookKeys.allEntries() });
    },
    onError: (error) => {
      console.error('Delete entry mutation error:', error);
    },
  });
}

/**
 * Hook to save weekly logbook
 * Optimized: Invalidates all related queries
 */
export function useSaveWeeklyLogbook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ weekName, entryIds }: { weekName: string; entryIds: string[] }) =>
      logbookService.saveWeeklyLogbook(weekName, entryIds),
    onSuccess: () => {
      // Refetch all related data
      queryClient.invalidateQueries({ queryKey: logbookKeys.drafts() });
      queryClient.invalidateQueries({ queryKey: logbookKeys.weekly() });
      queryClient.invalidateQueries({ queryKey: logbookKeys.allEntries() });
    },
    onError: (error) => {
      console.error('Save weekly logbook mutation error:', error);
    },
  });
}

/**
 * Hook to delete a weekly logbook
 * Optimized: Returns deleted count for user feedback
 */
export function useDeleteWeeklyLogbook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (weekName: string) =>
      logbookService.deleteWeeklyLogbook(weekName),
    onSuccess: (deletedCount, weekName) => {
      console.log(`Deleted ${deletedCount} entries from "${weekName}"`);
      
      // Invalidate weekly logbooks and all entries
      queryClient.invalidateQueries({ queryKey: logbookKeys.weekly() });
      queryClient.invalidateQueries({ queryKey: logbookKeys.allEntries() });
      
      // Remove specific weekly detail from cache
      queryClient.removeQueries({ queryKey: logbookKeys.weeklyDetail(weekName) });
    },
    onError: (error) => {
      console.error('Delete weekly logbook mutation error:', error);
    },
  });
}
