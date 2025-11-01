// =========================================
// CREATE USER DIALOG
// Dialog for creating new users
// =========================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserDialog({ isOpen, onClose, onSuccess }: CreateUserDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'intern' as 'intern' | 'mentor' | 'admin' | 'superuser',
    affiliation: '',
    department: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile with additional info
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            affiliation: formData.affiliation,
            department: formData.department,
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      toast({
        title: 'Success!',
        description: 'User created successfully',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
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
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the system
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Min. 6 characters"
            />
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

          {/* Department */}
          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="IT Department"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
