// =========================================
// EDIT INTERN DIALOG
// Dialog for editing intern-specific data with updated fields
// =========================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { getCurrentYear } from '@/utils/dateUtils';

interface InternData {
  id: string;
  full_name: string;
  username?: string;
  email: string;
  affiliation?: string;
  jurusan?: string;
  divisi?: number;
  nomor_induk?: string;
  batch?: number;
  start_date?: string;
  end_date?: string;
  mentor?: string;
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
  const [mentors, setMentors] = useState<{ id: string; full_name: string; username: string }[]>([]);
  const [batches, setBatches] = useState<{ id: number; batch_name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: number; nama: string; divisi: string | null }[]>([]);
  
  const [formData, setFormData] = useState({
    affiliation: '',
    jurusan: '',
    divisi: null as number | null,
    nomor_induk: '',
    batch: null as number | null,
    start_date: '',
    end_date: '',
    mentor: '',
  });

  useEffect(() => {
    if (intern) {
      setFormData({
        affiliation: intern.affiliation || '',
        jurusan: intern.jurusan || '',
        divisi: intern.divisi || null,
        nomor_induk: intern.nomor_induk || '',
        batch: intern.batch || null,
        start_date: intern.start_date || '',
        end_date: intern.end_date || '',
        mentor: intern.mentor || '',
      });
    }
    loadMentors();
    loadBatches();
    loadDepartments();
  }, [intern]);

  const loadMentors = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .eq('role', 'mentor')
      .order('full_name');
    
    setMentors(data || []);
  };

  const loadBatches = async () => {
    const { data } = await supabase
      .from('batches')
      .select('id, batch_name')
      .order('created_at', { ascending: false });
    
    setBatches(data || []);
  };

  const loadDepartments = async () => {
    const { data } = await supabase
      .from('departments')
      .select('id, nama, divisi')
      .not('divisi', 'is', null)  // Only divisions
      .order('nama', { ascending: true })
      .order('divisi', { ascending: true });
    
    setDepartments(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          affiliation: formData.affiliation || null,
          jurusan: formData.jurusan || null,
          divisi: formData.divisi || null,
          nomor_induk: formData.nomor_induk || null,
          batch: formData.batch || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          mentor: formData.mentor || null,
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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

          {/* Email (read-only) */}
          <div>
            <Label>Email</Label>
            <Input value={intern.email} disabled className="bg-gray-100" />
          </div>

          {/* Student ID (NIM) */}
          <div>
            <Label htmlFor="nomor_induk">Student ID (NIM)</Label>
            <Input
              id="nomor_induk"
              type="text"
              value={formData.nomor_induk}
              onChange={(e) => setFormData({ ...formData, nomor_induk: e.target.value })}
              placeholder={`e.g., ${getCurrentYear() - 2003}1234567890`}
            />
          </div>

          {/* Affiliation / University */}
          <div>
            <Label htmlFor="affiliation">University</Label>
            <Input
              id="affiliation"
              type="text"
              value={formData.affiliation}
              onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
              placeholder="e.g., Universitas Indonesia"
            />
          </div>

          {/* Major (Jurusan) */}
          <div>
            <Label htmlFor="jurusan">Major (Jurusan)</Label>
            <Input
              id="jurusan"
              type="text"
              value={formData.jurusan}
              onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
              placeholder="e.g., Computer Science, Mechanical Engineering"
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

          {/* Batch */}
          <div>
            <Label htmlFor="batch">Batch</Label>
            <select
              id="batch"
              value={formData.batch || ''}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batch_name}
                </option>
              ))}
            </select>
          </div>

          {/* Mentor */}
          <div>
            <Label htmlFor="mentor">Assigned Mentor</Label>
            <select
              id="mentor"
              value={formData.mentor}
              onChange={(e) => setFormData({ ...formData, mentor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">No mentor assigned</option>
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.full_name || mentor.username}
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
