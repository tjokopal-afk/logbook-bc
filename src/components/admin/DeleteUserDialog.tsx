// =========================================
// DELETE USER DIALOG
// Confirmation dialog for deleting users
// =========================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface DeleteUserDialogProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteUserDialog({ isOpen, user, onClose, onSuccess }: DeleteUserDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      // Delete user profile (auth user will be handled by trigger)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'User deleted successfully',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle>Delete User</DialogTitle>
          </div>
          <DialogDescription>
            This action cannot be undone
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Are you sure you want to delete this user?
            </p>
            <div className="mt-3 space-y-1">
              <p className="text-sm font-medium text-red-900">
                {user.full_name}
              </p>
              <p className="text-xs text-red-700">{user.email}</p>
              <p className="text-xs text-red-700">Role: {user.role}</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-xs text-yellow-800">
              <strong>Warning:</strong> All data associated with this user (logbook entries, reviews, etc.) will be permanently deleted.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
