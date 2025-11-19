// =========================================
// EDIT USER DIALOG
// Dialog for editing existing users
// =========================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'intern' | 'mentor' | 'admin' | 'superuser';
  affiliation?: string;
  divisi?: number;
}

interface EditUserDialogProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserDialog({ isOpen, user, onClose, onSuccess }: EditUserDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<{ id: number; nama: string; divisi: string | null }[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'intern' as 'intern' | 'mentor' | 'admin' | 'superuser',
    affiliation: '',
    divisi: null as number | null,
  });

  const loadDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('id, nama, divisi')
      .not('nama', 'is', null)
      .order('nama', { ascending: true })
      .order('divisi', { ascending: true });
    
    setDepartments(data || []);
  };

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        role: user.role,
        affiliation: user.affiliation || '',
        divisi: user.divisi || null,
      });
    }
    loadDepartments();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          role: formData.role,
          affiliation: formData.affiliation || null,
          divisi: formData.divisi || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'User updated successfully',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
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
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Full Name */}
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="role">Role *</Label>
            <select
              id="role"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="intern">Intern</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
              <option value="superuser">Superuser</option>
            </select>
          </div>

          {/* Affiliation */}
          <div>
            <Label htmlFor="affiliation">Affiliation</Label>
            <Input
              id="affiliation"
              type="text"
              value={formData.affiliation}
              onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
              placeholder="University/Company"
            />
          </div>

          {/* Division */}
          <div>
            <Label htmlFor="divisi">Division (Divisi)</Label>
            <select
              id="divisi"
              value={formData.divisi || ''}
              onChange={(e) => setFormData({ ...formData, divisi: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select division</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.nama} - {dept.divisi}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
