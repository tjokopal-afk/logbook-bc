// =========================================
// PROFILE SETTINGS - User Profile Management
// View and edit user profile, avatar, and signature
// =========================================

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ROLES } from '@/utils/roleConfig';
import { 
  User,
  Mail,
  Briefcase,
  Upload,
  Camera,
  Save,
  FileSignature,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/supabase';
import { uploadAvatar, uploadSignature, getPublicUrl, BUCKETS } from '@/services/storageService';
import type { Profile } from '@/lib/api/types';

export default function ProfileSettings() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  
  // Editable fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [signaturePreview, setSignaturePreview] = useState('');

  const loadUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authUser) throw new Error('Not authenticated');

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) throw profileError;

      setUser(profile as Profile);
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
      setStartDate(profile.start_date ? profile.start_date.split('T')[0] : '');
      setEndDate(profile.end_date ? profile.end_date.split('T')[0] : '');
      
      // Get public URLs for display
      if (profile.avatar_url) {
        const url = getPublicUrl(BUCKETS.USER_MEDIA, profile.avatar_url);
        setAvatarPreview(url);
      }
      if (profile.signature_url) {
        const url = getPublicUrl(BUCKETS.USER_MEDIA, profile.signature_url);
        setSignaturePreview(url);
      }
    } catch (error) {
      console.error('Load profile error:', error);
      alert('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Avatar must be less than 5MB');
      return;
    }

    try {
      setUploadingAvatar(true);

      // Upload avatar - returns URL string
      const avatarUrl = await uploadAvatar(user!.id, file);
      
      // Extract path from URL (avatars/{filename})
      const urlParts = avatarUrl.split('/');
      const path = `avatars/${urlParts[urlParts.length - 1]}`;
      
      // Update database
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: path })
        .eq('id', user!.id);

      if (error) throw error;

      setAvatarPreview(avatarUrl);
      alert('Avatar updated successfully!');
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignatureSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if user is admin
    if (user?.role !== 'admin') {
      alert('Only admins can upload signatures');
      return;
    }

    // Validate file type (must be PNG)
    if (file.type !== 'image/png') {
      alert('Signature must be a PNG file');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Signature must be less than 2MB');
      return;
    }

    try {
      setUploadingSignature(true);

      // Upload signature - returns URL string
      const signatureUrl = await uploadSignature(user!.id, file);
      
      // Extract filename from URL
      const urlParts = signatureUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      // Update database
      const { error } = await supabase
        .from('users')
        .update({ signature_url: filename })
        .eq('id', user!.id);

      if (error) throw error;

      setSignaturePreview(signatureUrl);
      alert('Signature updated successfully!');
    } catch (error) {
      console.error('Signature upload error:', error);
      alert('Failed to upload signature');
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      alert('Full name is required');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          start_date: startDate || null,
          end_date: endDate || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user!.id);

      if (error) throw error;

      alert('Profile updated successfully!');
      loadUserProfile();
    } catch (error) {
      console.error('Save profile error:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-600"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'mentor':
        return <Badge className="bg-blue-600"><Briefcase className="w-3 h-3 mr-1" />Mentor</Badge>;
      case 'member':
        return <Badge className="bg-green-600"><User className="w-3 h-3 mr-1" />Member</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">User not found</h3>
              <p className="text-sm text-gray-600">Please log in again</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile information and preferences
        </p>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
          <CardDescription>View and update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-200">
                  {fullName.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold">{fullName || 'Unknown User'}</h3>
                {getRoleBadge(user.role)}
              </div>
              <p className="text-sm text-gray-600 mb-4">{email}</p>
              
              <div>
                <Input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  disabled={uploadingAvatar}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={uploadingAvatar}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="pt-6 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Role</Label>
                <div className="flex items-center h-10">
                  {getRoleBadge(user.role)}
                </div>
              </div>
              <div>
                <Label>User ID</Label>
                <p className="text-sm text-gray-600 mt-2 font-mono">{user.id.slice(0, 8)}...</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Internship Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Internship End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Section (Admin Only) */}
      {user.role === ROLES.ADMIN && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5" />
              Digital Signature
            </CardTitle>
            <CardDescription>
              Upload your digital signature for document approval (Admin only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {signaturePreview ? (
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="flex items-center justify-between mb-2">
                  <Label>Current Signature</Label>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="bg-white p-4 rounded border">
                  <img
                    src={signaturePreview}
                    alt="Signature"
                    className="max-h-24 mx-auto"
                  />
                </div>
              </div>
            ) : (
              <div className="p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                <FileSignature className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">No signature uploaded</p>
                <p className="text-xs text-gray-500">Upload a transparent PNG signature</p>
              </div>
            )}

            <div>
              <Input
                type="file"
                id="signature-upload"
                className="hidden"
                accept="image/png"
                onChange={handleSignatureSelect}
                disabled={uploadingSignature}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('signature-upload')?.click()}
                disabled={uploadingSignature}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingSignature ? 'Uploading...' : signaturePreview ? 'Replace Signature' : 'Upload Signature'}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                PNG format with transparent background. Max size 2MB.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your account details and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Account Created</span>
              <span className="text-sm font-medium">
                {new Date(user.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Last Updated</span>
              <span className="text-sm font-medium">
                {user.updated_at
                  ? new Date(user.updated_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : 'Never'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Account Status</span>
              <Badge className="bg-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
