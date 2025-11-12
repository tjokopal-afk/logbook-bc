// =========================================
// USER AVATAR MANAGEMENT - Admin Component
// Admin interface to manage user avatars
// =========================================

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Upload,
  Trash2,
  User,
  Shield,
  Briefcase,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/supabase';
import { uploadAvatar, getPublicUrl, BUCKETS } from '@/services/storageService';
import type { Profile } from '@/lib/api/types';

export function UserAvatarManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [avatarPreviews, setAvatarPreviews] = useState<Record<string, string>>({});

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all users
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('full_name');

      if (error) throw error;

      setUsers((data as Profile[]) || []);
      
      // Load avatar previews
      const previews: Record<string, string> = {};
      for (const user of (data || [])) {
        if (user.avatar_url) {
          const url = getPublicUrl(BUCKETS.USER_MEDIA, user.avatar_url);
          previews[user.id] = url;
        }
      }
      setAvatarPreviews(previews);
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(u =>
          u.full_name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.role?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [users, searchQuery]);

  const handleAvatarUpload = async (userId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Avatar must be less than 5MB');
      return;
    }

    try {
      setUploadingFor(userId);

      // Upload avatar
      const avatarUrl = await uploadAvatar(userId, file);
      
      // Extract path
      const urlParts = avatarUrl.split('/');
      const path = `avatars/${urlParts[urlParts.length - 1]}`;
      
      // Update database
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: path })
        .eq('id', userId);

      if (error) throw error;

      // Update preview
      setAvatarPreviews(prev => ({ ...prev, [userId]: avatarUrl }));
      
      alert('Avatar updated successfully!');
      loadUsers();
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Failed to upload avatar');
    } finally {
      setUploadingFor(null);
    }
  };

  const handleAvatarDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this avatar?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (error) throw error;

      // Remove preview
      setAvatarPreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[userId];
        return newPreviews;
      });
      
      alert('Avatar deleted successfully!');
      loadUsers();
    } catch (error) {
      console.error('Avatar delete error:', error);
      alert('Failed to delete avatar');
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
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Avatar Management
          </CardTitle>
          <CardDescription>
            Upload and manage avatars for all users (Admin only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-sm text-gray-600">
                  {searchQuery ? 'Try a different search term' : 'No users available'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {avatarPreviews[user.id] ? (
                      <img
                        src={avatarPreviews[user.id]}
                        alt={user.full_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold border-2 border-gray-200">
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{user.full_name || 'Unknown User'}</h3>
                      {getRoleBadge(user.role)}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    {user.company && (
                      <p className="text-xs text-gray-500 mt-1">{user.company}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      id={`avatar-upload-${user.id}`}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarUpload(user.id, file);
                      }}
                      disabled={uploadingFor === user.id}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`avatar-upload-${user.id}`)?.click()}
                      disabled={uploadingFor === user.id}
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      {uploadingFor === user.id ? 'Uploading...' : avatarPreviews[user.id] ? 'Change' : 'Upload'}
                    </Button>
                    {avatarPreviews[user.id] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAvatarDelete(user.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Status */}
                {uploadingFor === user.id && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                    <CheckCircle2 className="w-4 h-4 animate-pulse" />
                    <span>Uploading avatar...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{users.length}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {Object.keys(avatarPreviews).length}
              </p>
              <p className="text-sm text-gray-600">With Avatars</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {users.length - Object.keys(avatarPreviews).length}
              </p>
              <p className="text-sm text-gray-600">Without Avatars</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
