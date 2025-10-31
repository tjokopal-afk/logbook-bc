// =========================================
// ADMIN - KELOLA USER PAGE
// Full CRUD operations for all users
// =========================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Building,
  Download,
  Loader2
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { EditUserDialogEnhanced } from '@/components/admin/EditUserDialogEnhanced';
import { DeleteUserDialog } from '@/components/admin/DeleteUserDialog';
import { ViewUserDialog } from '@/components/admin/ViewUserDialog';

interface User {
  id: string;
  email: string;
  username?: string;
  full_name: string;
  role: 'intern' | 'mentor' | 'admin' | 'superuser';
  created_at: string;
  last_sign_in_at?: string;
  affiliation?: string;
  department?: string;
  mentor_id?: string;
  phone?: string;
  nim?: string;
  avatar_url?: string;
  batch?: string;
}

export default function KelolaUser() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [mentorFilter, setMentorFilter] = useState<string>('all');
  const [mentors, setMentors] = useState<{ id: string; full_name: string }[]>([]);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
    loadMentors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchQuery, roleFilter, mentorFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMentors = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'mentor')
        .order('full_name');
      
      setMentors(data || []);
    } catch (error) {
      console.error('Error loading mentors:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.affiliation?.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Apply mentor filter
    if (mentorFilter !== 'all') {
      filtered = filtered.filter((user) => user.mentor_id === mentorFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setShowViewDialog(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleExportCSV = () => {
    const csv = [
      ['Name', 'Email', 'Role', 'Affiliation', 'Department', 'Created At'].join(','),
      ...filteredUsers.map((user) =>
        [
          user.full_name,
          user.email,
          user.role,
          user.affiliation || '-',
          user.department || '-',
          new Date(user.created_at).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Users exported to CSV',
    });
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      intern: { label: 'Intern', className: 'bg-green-100 text-green-700' },
      mentor: { label: 'Mentor', className: 'bg-blue-100 text-blue-700' },
      admin: { label: 'Admin', className: 'bg-purple-100 text-purple-700' },
      superuser: { label: 'Superuser', className: 'bg-red-100 text-red-700' },
    };
    return badges[role as keyof typeof badges] || badges.intern;
  };

  const getStats = () => {
    return {
      total: users.length,
      intern: users.filter((u) => u.role === 'intern').length,
      mentor: users.filter((u) => u.role === 'mentor').length,
      admin: users.filter((u) => u.role === 'admin').length,
      superuser: users.filter((u) => u.role === 'superuser').length,
    };
  };

  const stats = getStats();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-purple-600" />
            Kelola User
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage all system users and roles
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.intern}</div>
            <p className="text-xs text-muted-foreground">Interns</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.mentor}</div>
            <p className="text-xs text-muted-foreground">Mentors</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.admin}</div>
            <p className="text-xs text-muted-foreground">Admins</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.superuser}</div>
            <p className="text-xs text-muted-foreground">Superusers</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or affiliation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="w-full md:w-40">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Roles</option>
                <option value="intern">Intern</option>
                <option value="mentor">Mentor</option>
                <option value="admin">Admin</option>
                <option value="superuser">Superuser</option>
              </select>
            </div>

            {/* Mentor Filter */}
            <div className="w-full md:w-48">
              <select
                value={mentorFilter}
                onChange={(e) => setMentorFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Mentors</option>
                {mentors.map((mentor) => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Button */}
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-sm text-gray-600">
                {searchQuery || roleFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No users in the system yet'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                {/* Profile Photo & Name */}
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md">
                    {getInitials(user.full_name || 'User')}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {user.full_name || 'No name'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                </div>

                {/* Role Badge */}
                <div className="flex justify-center mb-4">
                  <Badge className={getRoleBadge(user.role).className}>
                    {getRoleBadge(user.role).label}
                  </Badge>
                </div>

                {/* Additional Info */}
                <div className="space-y-2 mb-4 text-sm">
                  {user.affiliation && (
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <Building className="w-4 h-4" />
                      <span>{user.affiliation}</span>
                    </div>
                  )}
                  {user.department && (
                    <div className="text-center text-gray-500 text-xs">
                      {user.department}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(user)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Detail
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(user)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(user)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateUserDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            loadUsers();
            setShowCreateDialog(false);
          }}
        />
      )}

      {showEditDialog && selectedUser && (
        <EditUserDialogEnhanced
          isOpen={showEditDialog}
          user={selectedUser}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            loadUsers();
            setShowEditDialog(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showDeleteDialog && selectedUser && (
        <DeleteUserDialog
          isOpen={showDeleteDialog}
          user={selectedUser}
          onClose={() => {
            setShowDeleteDialog(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            loadUsers();
            setShowDeleteDialog(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showViewDialog && selectedUser && (
        <ViewUserDialog
          isOpen={showViewDialog}
          user={selectedUser}
          onClose={() => {
            setShowViewDialog(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
