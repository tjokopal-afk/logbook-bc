// =========================================
// ENHANCED EDIT USER DIALOG (Admin)
// Complete profile management with all fields
// =========================================

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROLES } from '@/utils/roleConfig';
import { Loader2, User, Lock, Image as ImageIcon, FileText, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { FileUploader } from '@/components/common/FileUpload';
import { uploadProjectCharter, deleteProjectCharter } from '@/services/projectCharterService';
import { updateProfileProjectCharter, getProfileProjectCharterUrl } from '@/lib/api/profiles';
import { getCurrentYear } from '@/utils/dateUtils';
import { updateUserPassword } from '@/services/userService';

interface User {
  id: string;
  email: string;
  username?: string;
  full_name: string;
  role: 'intern' | 'mentor' | 'admin' | 'superuser';
  affiliation?: string;
  jurusan?: string;
  divisi?: number;
  avatar_url?: string;
  nomor_induk?: string;
  mentor?: string;
  batch?: number;
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
  const [mentors, setMentors] = useState<{ id: string; full_name: string; username: string }[]>([]);
  const [batches, setBatches] = useState<{ id: number; batch_name: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: number; nama: string; divisi: string | null }[]>([]);
  
  // Project charter state
  const [charterLoading, setCharterLoading] = useState(false);
  const [charterUploading, setCharterUploading] = useState(false);
  const [charterError, setCharterError] = useState<string | null>(null);
  const [charterSuccess, setCharterSuccess] = useState(false);
  const [currentCharterUrl, setCurrentCharterUrl] = useState<string | null>(null);
  
  // Profile data
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    role: 'intern' as 'intern' | 'mentor' | 'admin' | 'superuser',
    affiliation: '',
    jurusan: '',
    divisi: null as number | null,
    nomor_induk: '',
    mentor: '',
    avatar_url: '',
    batch: null as number | null,
  });

  // Password data
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: '',
  });
  // Password update status
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [passwordStatusMessage, setPasswordStatusMessage] = useState<string | null>(null);

  const loadCurrentCharter = useCallback(async () => {
    if (!user || user.role !== 'intern') return;

    setCharterLoading(true);
    try {
      const url = await getProfileProjectCharterUrl(user.id);
      setCurrentCharterUrl(url);
    } catch (err) {
      console.error('Error loading current charter:', err);
    } finally {
      setCharterLoading(false);
    }
  }, [user]);

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
      .not('nama', 'is', null)  // Only divisions
      .order('nama', { ascending: true })
      .order('divisi', { ascending: true });
    
    setDepartments(data || []);
  };

  useEffect(() => {
    const initializeForm = async () => {
      if (user) {
        // Load all data first
        await Promise.all([
          loadMentors(),
          loadBatches(),
          loadDepartments(),
          loadCurrentCharter(),
        ]);

        // Set form data, but validate foreign keys
        setFormData({
          username: user.username || '',
          full_name: user.full_name || '',
          role: user.role,
          affiliation: user.affiliation || '',
          jurusan: user.jurusan || '',
          divisi: user.divisi || null,
          nomor_induk: user.nomor_induk || '',
          mentor: user.mentor || '',
          avatar_url: user.avatar_url || '',
          batch: user.batch || null,
        });
      }
    };

    initializeForm();
  }, [user, loadCurrentCharter]);

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate foreign keys before submitting
      const validatedData: Record<string, any> = {
        username: formData.username || null,
        full_name: formData.full_name,
        role: formData.role,
        affiliation: formData.affiliation || null,
        jurusan: formData.jurusan || null,
        nomor_induk: formData.nomor_induk || null,
        avatar_url: formData.avatar_url || null,
      };

      // Validate batch (must exist in batches table)
      if (formData.batch) {
        const batchExists = batches.some(b => b.id === formData.batch);
        if (batchExists) {
          validatedData.batch = formData.batch;
        } else {
          // Only show warning if user originally had a batch assigned
          if (user.batch) {
            toast({
              title: 'Warning',
              description: 'Previously assigned batch no longer exists. It has been cleared.',
              variant: 'destructive',
            });
          }
          validatedData.batch = null;
        }
      } else {
        validatedData.batch = null;
      }

      // Validate mentor (must exist in mentors list)
      if (formData.mentor) {
        const mentorExists = mentors.some(m => m.id === formData.mentor);
        if (mentorExists) {
          validatedData.mentor = formData.mentor;
        } else {
          // Only show warning if user originally had a mentor assigned
          if (user.mentor) {
            toast({
              title: 'Warning',
              description: 'Previously assigned mentor no longer exists. It has been cleared.',
              variant: 'destructive',
            });
          }
          validatedData.mentor = null;
        }
      } else {
        validatedData.mentor = null;
      }

      // Validate divisi (must exist in departments table)
      if (formData.divisi) {
        const divisiExists = departments.some(d => d.id === formData.divisi);
        if (divisiExists) {
          validatedData.divisi = formData.divisi;
        } else {
          // Only show warning if user originally had a divisi assigned
          if (user.divisi) {
            toast({
              title: 'Warning',
              description: 'Previously assigned division no longer exists. It has been cleared.',
              variant: 'destructive',
            });
          }
          validatedData.divisi = null;
        }
      } else {
        validatedData.divisi = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(validatedData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'User profile updated successfully',
      });

      onSuccess();
    } catch (unknownErr) {
      const errMsg =
        unknownErr && typeof unknownErr === 'object' && 'message' in unknownErr
          ? String((unknownErr as { message?: unknown }).message)
          : String(unknownErr);
      console.error('Error updating user:', unknownErr);
      toast({
        title: 'Error',
        description: errMsg || 'Failed to update user',
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

    if (passwordData.new_password.length < 5) {
      toast({
        title: 'Error',
        description: 'Password must be at least 5 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Use service function to update user password with admin API
      const result = await updateUserPassword(user.id, passwordData.new_password);

      if (result.success) {
        // Success UI state + toast
        setPasswordStatus('success');
        setPasswordStatusMessage(result.message);
        toast({
          title: 'Success!',
          description: result.message,
        });

        setPasswordData({ new_password: '', confirm_password: '' });

        // Clear success state after a short delay
        setTimeout(() => {
          setPasswordStatus('idle');
          setPasswordStatusMessage(null);
        }, 5000);
      } else {
        setPasswordStatus('error');
        setPasswordStatusMessage(result.error || result.message);
        toast({
          title: 'Error',
          description: result.error || result.message,
          variant: 'destructive',
        });

        // Keep error message visible for a bit
        setTimeout(() => {
          setPasswordStatus('idle');
          setPasswordStatusMessage(null);
        }, 6000);
      }
    } catch (error) {
      console.error('Unexpected error updating password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setPasswordStatus('error');
      setPasswordStatusMessage(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      setTimeout(() => {
        setPasswordStatus('idle');
        setPasswordStatusMessage(null);
      }, 6000);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUploaded = (url: string) => {
    setFormData({ ...formData, avatar_url: url });
  };

  const handleCharterUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setCharterError('Only PDF files are allowed');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setCharterError('File size must be less than 10MB');
      return;
    }

    setCharterUploading(true);
    setCharterError(null);

    try {
      // Upload file to storage
      const { url } = await uploadProjectCharter(file, user.id);

      // Save URL to user's profile
      await updateProfileProjectCharter(user.id, url);

      // Update local state
      setCurrentCharterUrl(url);
      setCharterSuccess(true);

      toast({
        title: 'Success',
        description: 'Project charter uploaded successfully',
      });

      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setCharterError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setCharterUploading(false);
    }
  };

  const handleCharterDelete = async () => {
    if (!user || !currentCharterUrl) return;

    setCharterUploading(true);
    setCharterError(null);

    try {
      // Extract file path from URL
      // Supabase URL format: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
      const urlParts = currentCharterUrl.split('/storage/v1/object/public/');
      if (urlParts.length !== 2) {
        throw new Error('Invalid file URL format');
      }

      const pathParts = urlParts[1].split('/');
      if (pathParts.length < 2) {
        throw new Error('Invalid file path');
      }

      // Remove bucket name from path (first element)
      const filePath = pathParts.slice(1).join('/');

      // Delete file from storage
      await deleteProjectCharter(filePath);

      // Clear URL from database
      await updateProfileProjectCharter(user.id, '');

      setCurrentCharterUrl(null);
      setCharterSuccess(true);

      toast({
        title: 'Success',
        description: 'Project charter removed successfully',
      });

      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';
      setCharterError(errorMessage);
      console.error('Delete error:', err);
    } finally {
      setCharterUploading(false);
    }
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
          {user.role === ROLES.INTERN && (
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="photo">
              <ImageIcon className="w-4 h-4 mr-2" />
              Photo
            </TabsTrigger>
              <TabsTrigger value="charter" disabled={user.role !== ROLES.INTERN}>
                <FileText className="w-4 h-4 mr-2" />
                Charter
              </TabsTrigger>
            <TabsTrigger value="password">
              <Lock className="w-4 h-4 mr-2" />
              Password
            </TabsTrigger>
          </TabsList>
            )}
          {user.role !== ROLES.INTERN && (
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
            )}

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

              {/* Nomor Induk (NIM/NIP) */}
              <div>
                <Label htmlFor="nomor_induk">
                  {formData.role === ROLES.INTERN ? 'Student ID (NIM)' : 'Employee ID (NIP)'}
                </Label>
                <Input
                  id="nomor_induk"
                  type="text"
                  value={formData.nomor_induk}
                  onChange={(e) => setFormData({ ...formData, nomor_induk: e.target.value })}
                  placeholder={formData.role === ROLES.INTERN ? `e.g., ${getCurrentYear() - 2003}1234567890` : 'e.g., 1234567890'}
                />
              </div>

              {/* Jurusan (untuk intern) */}
              {formData.role === ROLES.INTERN && (
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
              )}

              {/* Divisi (untuk semua user) */}
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
                <p className="text-xs text-gray-500 mt-1">User's department/division assignment</p>
              </div>


              {/* Batch (for interns) */}
              {formData.role === ROLES.INTERN && (
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
                  <p className="text-xs text-gray-500 mt-1">Intern cohort/batch number</p>
                </div>
              )}

              {/* Mentor Assignment (for interns) */}
              {formData.role === ROLES.INTERN && (
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
                        {mentor.full_name === formData.mentor ? mentor.full_name : mentor.username}
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

          {/* PROJECT CHARTER TAB */}
          <TabsContent value="charter">
            <div className="space-y-4">
              {user.role !== 'intern' ? (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Project charters are only available for interns</p>
                </div>
              ) : (
                <>
                  {/* Current Charter Status */}
                  {charterLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="ml-2 text-sm text-gray-600">Loading charter...</span>
                    </div>
                  ) : currentCharterUrl ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">Project Charter Uploaded</span>
                      </div>
                      <p className="text-sm text-green-700 mb-3">
                        A project charter has been uploaded for this intern.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(currentCharterUrl, '_blank')}
                          className="flex-1"
                        >
                          View PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCharterDelete}
                          disabled={charterUploading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {charterUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remove'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Upload Area */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Upload project charter PDF
                        </p>
                        <Label htmlFor="charter-file" className="cursor-pointer">
                          <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                            {charterUploading ? 'Uploading...' : 'Select PDF'}
                          </span>
                        </Label>
                        <Input
                          id="charter-file"
                          type="file"
                          accept=".pdf"
                          onChange={handleCharterUpload}
                          disabled={charterUploading}
                          className="hidden"
                        />
                      </div>

                      {/* Requirements */}
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>• Format: PDF only</p>
                        <p>• Max size: 10 MB</p>
                        <p>• Required for intern project completion</p>
                      </div>
                    </>
                  )}

                  {/* Error Message */}
                  {charterError && (
                    <div className="flex gap-2 p-3 bg-red-50 rounded border border-red-200">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{charterError}</p>
                    </div>
                  )}

                  {/* Success Message */}
                  {charterSuccess && (
                    <div className="p-3 bg-green-50 rounded border border-green-200">
                      <CheckCircle className="w-5 h-5 text-green-600 inline mr-2" />
                      <span className="text-sm text-green-700">
                        {currentCharterUrl ? 'Charter uploaded successfully!' : 'Charter removed successfully!'}
                      </span>
                    </div>
                  )}
                </>
              )}

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
                {/* Password status banners */}
                {passwordStatus === 'success' ? (
                  <div className="p-3 bg-green-50 rounded border border-green-200 flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="text-sm text-green-700">{passwordStatusMessage || 'Password updated successfully'}</div>
                  </div>
                ) : passwordStatus === 'error' ? (
                  <div className="p-3 bg-red-50 rounded border border-red-200 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="text-sm text-red-700">{passwordStatusMessage || 'Failed to update password'}</div>
                  </div>
                ) : 

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  <strong>⚠️ Admin Action:</strong> You are changing this user's password. They will need to use the new password to login.
                </div>
                }

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
                  minLength={5}
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
