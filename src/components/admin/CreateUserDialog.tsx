// =========================================
// CREATE USER DIALOG
// Dialog for creating new users with admin API
// =========================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROLES } from '@/utils/roleConfig';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { createUserWithAdmin } from '@/services/userService';

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserDialog({ isOpen, onClose, onSuccess }: CreateUserDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [divisions, setDivisions] = useState<{ id: number; nama: string; divisi: string }[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'intern' as 'intern' | 'mentor' | 'admin' | 'superuser',
    affiliation: '',
    divisi: null as number | null,
  });

  useEffect(() => {
    if (isOpen) {
      loadDivisions();
      // Reset form when dialog opens
      setFormData({
        email: '',
        password: '',
        full_name: '',
        role: 'intern',
        affiliation: '',
        divisi: null,
      });
    }
  }, [isOpen]);

  const loadDivisions = async () => {
    try {
      // Load only department rows (nama not null)
      const { data, error } = await supabase
        .from('departments')
        .select('id, nama, divisi')
        .not('nama', 'is', null)
        .order('divisi', { ascending: true })
        .order('nama', { ascending: true });

      if (error) throw error;
      setDivisions(data || []);
    } catch (error) {
      console.error('Error loading divisions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password || !formData.full_name) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 5) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Call service function to create user with admin API
      const result = await createUserWithAdmin({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
        affiliation: formData.affiliation || undefined,
        divisi: formData.divisi,
      });

      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });

        // Reset form and close dialog
        setFormData({
          email: '',
          password: '',
          full_name: '',
          role: 'intern',
          affiliation: '',
          divisi: null,
        });

        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: result.error || result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Unexpected error creating user:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while creating the user',
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
              minLength={5}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Min. 5 characters"
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
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'intern' | 'mentor' | 'admin' | 'superuser' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {Object.values(ROLES).map((role: string) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Affiliation */}
          <div>
            <Label htmlFor="affiliation">
              {formData.role === ROLES.INTERN ? 'University' : 'Company'}
            </Label>
            <Input
              id="affiliation"
              type="text"
              value={formData.affiliation}
              onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
              placeholder={formData.role === ROLES.INTERN ? 'e.g., Universitas Indonesia' : 'e.g., PT. Berau Coal'}
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
              <option value="">Select division (optional)</option>
              {divisions.map((div) => (
                <option key={div.id} value={div.id}>
                  {div.divisi} - {div.nama}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Assign user to a specific division
            </p>
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
