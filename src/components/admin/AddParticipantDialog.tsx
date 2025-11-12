// =========================================
// ADD PARTICIPANT DIALOG
// Dialog for adding users to projects
// =========================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface AddParticipantDialogProps {
  isOpen: boolean;
  projectId: string;
  projectName: string;
  existingParticipants: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AddParticipantDialog({
  isOpen,
  projectId,
  projectName,
  existingParticipants,
  onClose,
  onSuccess,
}: AddParticipantDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    loadAvailableUsers();
  }, []);

  const loadAvailableUsers = async () => {
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['intern', 'mentor'])
        .order('full_name');

      if (error) throw error;

      // Filter out existing participants
      const filtered = (data || []).filter(
        (user) => !existingParticipants.includes(user.id)
      );

      setAvailableUsers(filtered);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available users',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedUsers.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select at least one user to add',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const participantsToAdd = selectedUsers.map((userId) => ({
        project_id: projectId,
        user_id: userId,
        role_in_project: 'member',
        joined_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('project_participants')
        .insert(participantsToAdd);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: `Added ${selectedUsers.length} participant(s) to project`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error adding participants:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add participants',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      intern: { label: 'Intern', className: 'bg-green-100 text-green-700' },
      mentor: { label: 'Mentor', className: 'bg-blue-100 text-blue-700' },
    };
    return badges[role as keyof typeof badges] || badges.intern;
  };

  const filteredUsers = availableUsers.filter(
    (user) =>
      (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-600" />
            Add Participants
          </DialogTitle>
          <DialogDescription>
            Add interns or mentors to <strong>{projectName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search */}
          <div>
            <Label>Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* User List */}
          <div>
            <Label>Available Users ({filteredUsers.length})</Label>
            {searching ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery
                  ? 'No users match your search'
                  : 'No available users to add'}
              </div>
            ) : (
              <div className="mt-2 max-h-96 overflow-y-auto space-y-2 border rounded-lg p-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedUsers.includes(user.id)
                        ? 'bg-purple-50 border-purple-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => {}}
                            className="w-5 h-5 text-purple-600 rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{user.full_name}</p>
                            <Badge className={getRoleBadge(user.role).className}>
                              {getRoleBadge(user.role).label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Count */}
          {selectedUsers.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-800">
                <strong>{selectedUsers.length}</strong> user(s) selected
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedUsers.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
