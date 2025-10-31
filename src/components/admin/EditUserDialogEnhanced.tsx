// =========================================
// ENHANCED EDIT USER DIALOG (Admin)
// Complete profile management with all fields
// =========================================

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Lock, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { FileUploader } from '@/components/common/FileUpload';

interface User {
  id: string;
  email: string;
  username?: string;
  full_name: string;
  role: 'intern' | 'mentor' | 'admin' | 'superuser';
  affiliation?: string;
  department?: string;
  avatar_url?: string;
  phone?: string;
  nim?: string;
  mentor_id?: string;
  batch?: string;
}

interface EditUserDialogEnhancedProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserDialogEnhanced({ isOpen, user, onClose, onSuccess }: EditUserDialogEnhancedProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mentors, setMentors] = useState<{ id: string; full_name: string }[]>([]);
  
  // Profile data
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    role: 'intern' as 'intern' | 'mentor' | 'admin' | 'superuser',
    affiliation: '',
    department: '',
    phone: '',
    nim: '',
    mentor_id: '',
    avatar_url: '',
    batch: '',
  });

  // Password data
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        full_name: user.full_name || '',
        role: user.role,
        affiliation: user.affiliation || '',
        department: user.department || '',
        phone: user.phone || '',
        nim: user.nim || '',
        mentor_id: user.mentor_id || '',
        avatar_url: user.avatar_url || '',
        batch: user.batch || '',
      });
    }
    loadMentors();
  }, [user]);

  const loadMentors = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'mentor')
      .order('full_name');
    
    setMentors(data || []);
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.full_name,
          role: formData.role,
          affiliation: formData.affiliation,
          department: formData.department,
          phone: formData.phone,
          nim: formData.nim,
          mentor_id: formData.mentor_id || null,
          avatar_url: formData.avatar_url,
          batch: formData.batch,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'User profile updated successfully',
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

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Admin updates user password via Supabase Admin API
      const { error } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: passwordData.new_password }
      );

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Password updated successfully',
      });

      setPasswordData({ new_password: '', confirm_password: '' });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password. Admin API may not be available.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUploaded = (url: string) => {
    setFormData({ ...formData, avatar_url: url });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User - {user.email}</DialogTitle>
          <DialogDescription>
            Update user profile, credentials, and settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="photo">
              <ImageIcon className="w-4 h-4 mr-2" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="password">
              <Lock className="w-4 h-4 mr-2" />
              Password
            </TabsTrigger>
          </TabsList>

          {/* PROFILE TAB */}
          <TabsContent value="profile">
            <form onSubmit={handleSubmitProfile} className="space-y-4">
              {/* Email (read-only) */}
              <div>
                <Label htmlFor="email">Email (ID)</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Username */}
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g., johndoe"
                />
                <p className="text-xs text-gray-500 mt-1">Optional display name</p>
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

              {/* Affiliation/University */}
              <div>
                <Label htmlFor="affiliation">
                  {formData.role === 'intern' ? 'University' : 'Institution/Company'}
                </Label>
                <Input
                  id="affiliation"
                  type="text"
                  value={formData.affiliation}
                  onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                  placeholder={formData.role === 'intern' ? 'e.g., Universitas Indonesia' : 'e.g., PT. Company Name'}
                />
              </div>

              {/* Department */}
              <div>
                <Label htmlFor="department">Department/Major</Label>
                <Input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Computer Science"
                />
              </div>

              {/* Phone/WhatsApp */}
              <div>
                <Label htmlFor="phone">WhatsApp Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., 081234567890"
                />
              </div>

              {/* NIM (for interns) */}
              {formData.role === 'intern' && (
                <div>
                  <Label htmlFor="nim">Student ID (NIM)</Label>
                  <Input
                    id="nim"
                    type="text"
                    value={formData.nim}
                    onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                    placeholder="e.g., 1234567890"
                  />
                </div>
              )}

              {/* Batch (for interns) */}
              {formData.role === 'intern' && (
                <div>
                  <Label htmlFor="batch">Batch</Label>
                  <Input
                    id="batch"
                    type="text"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    placeholder="e.g., Batch 1, Batch 2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Intern cohort/batch number</p>
                </div>
              )}

              {/* Mentor Assignment (for interns) */}
              {formData.role === 'intern' && (
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
              )}

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
                    'Save Profile'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* PHOTO TAB */}
          <TabsContent value="photo">
            <div className="space-y-4">
              {/* Current Photo */}
              {formData.avatar_url && (
                <div className="text-center">
                  <Label className="mb-2 block">Current Photo</Label>
                  <img
                    src={formData.avatar_url}
                    alt="Profile"
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-purple-200"
                  />
                </div>
              )}

              {/* Upload New Photo */}
              <div>
                <Label className="mb-2 block">Upload Foto Profil</Label>
                <FileUploader
                  type="photo"
                  currentUrl={formData.avatar_url}
                  onUploadSuccess={handlePhotoUploaded}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>

          {/* PASSWORD TAB */}
          <TabsContent value="password">
            <form onSubmit={handleSubmitPassword} className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <strong>⚠️ Admin Action:</strong> You are changing this user's password. They will need to use the new password to login.
              </div>

              {/* New Password */}
              <div>
                <Label htmlFor="new_password">New Password *</Label>
                <Input
                  id="new_password"
                  type="password"
                  required
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                />
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirm_password">Confirm Password *</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  required
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="Re-enter password"
                  minLength={6}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
