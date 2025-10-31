// =========================================
// EDIT INTERN DIALOG
// Dialog for editing intern-specific data
// =========================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';

interface InternData {
  id: string;
  full_name: string;
  affiliation: string;
  department: string;
  start_date?: string;
  end_date?: string;
  mentor_id?: string;
}

interface EditInternDialogProps {
  isOpen: boolean;
  intern: InternData;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditInternDialog({ isOpen, intern, onClose, onSuccess }: EditInternDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mentors, setMentors] = useState<{ id: string; full_name: string }[]>([]);
  const [formData, setFormData] = useState({
    affiliation: '',
    department: '',
    start_date: '',
    end_date: '',
    mentor_id: '',
  });

  useEffect(() => {
    if (intern) {
      setFormData({
        affiliation: intern.affiliation || '',
        department: intern.department || '',
        start_date: intern.start_date || '',
        end_date: intern.end_date || '',
        mentor_id: intern.mentor_id || '',
      });
    }
    loadMentors();
  }, [intern]);

  const loadMentors = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'mentor')
      .order('full_name');
    
    setMentors(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          affiliation: formData.affiliation,
          department: formData.department,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          mentor_id: formData.mentor_id || null,
        })
        .eq('id', intern.id);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Intern data updated successfully',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating intern:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update intern',
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
          <DialogTitle>Edit Intern Data</DialogTitle>
          <DialogDescription>
            Update intern information and assignment
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (read-only) */}
          <div>
            <Label>Intern Name</Label>
            <Input value={intern.full_name} disabled className="bg-gray-100" />
          </div>

          {/* Affiliation */}
          <div>
            <Label htmlFor="affiliation">Affiliation / University *</Label>
            <Input
              id="affiliation"
              type="text"
              required
              value={formData.affiliation}
              onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
              placeholder="e.g., Universitas Indonesia"
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
              placeholder="e.g., Computer Science"
            />
          </div>

          {/* Mentor */}
          <div>
            <Label htmlFor="mentor">Assigned Mentor</Label>
            <select
              id="mentor"
              value={formData.mentor_id}
              onChange={(e) => setFormData({ ...formData, mentor_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">No mentor assigned</option>
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          {/* End Date */}
          <div>
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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
