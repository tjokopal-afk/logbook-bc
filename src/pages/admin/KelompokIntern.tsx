// =========================================
// ADMIN - KELOMPOK INTERN PAGE
// Group interns by department with mentor
// =========================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Loader2,
  GraduationCap,
  User,
  Mail,
  Building,
  Edit,
  UserPlus,
  Save,
  X,
  Plus
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';

interface Intern {
  id: string;
  full_name: string;
  email: string;
  department: string;
  batch?: string;
  affiliation?: string;
}

interface Mentor {
  id: string;
  full_name: string;
  email: string;
  department: string;
}

interface DepartmentGroup {
  department: string;
  mentor: Mentor | null;
  interns: Intern[];
}

export default function KelompokIntern() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<DepartmentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [allMentors, setAllMentors] = useState<Mentor[]>([]);
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [assigningMentor, setAssigningMentor] = useState<string | null>(null);
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      // Load all mentors
      const { data: mentors, error: mentorError } = await supabase
        .from('profiles')
        .select('id, full_name, email, department')
        .eq('role', 'mentor')
        .order('department');

      if (mentorError) throw mentorError;
      setAllMentors(mentors || []);

      // Load all interns
      const { data: interns, error: internError } = await supabase
        .from('profiles')
        .select('id, full_name, email, department, batch, affiliation')
        .eq('role', 'intern')
        .order('department');

      if (internError) throw internError;

      // Group by department
      const departmentMap = new Map<string, DepartmentGroup>();

      // Add mentors to departments
      (mentors || []).forEach((mentor) => {
        const dept = mentor.department || 'No Department';
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, {
            department: dept,
            mentor: mentor,
            interns: [],
          });
        } else {
          // If department already exists, update mentor
          const group = departmentMap.get(dept)!;
          group.mentor = mentor;
        }
      });

      // Add interns to departments
      (interns || []).forEach((intern) => {
        const dept = intern.department || 'No Department';
        if (!departmentMap.has(dept)) {
          departmentMap.set(dept, {
            department: dept,
            mentor: null,
            interns: [intern],
          });
        } else {
          departmentMap.get(dept)!.interns.push(intern);
        }
      });

      // Convert to array and sort
      const groupsArray = Array.from(departmentMap.values()).sort((a, b) =>
        a.department.localeCompare(b.department)
      );

      setGroups(groupsArray);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load intern groups',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDepartmentName = async (oldName: string) => {
    if (!newDeptName.trim() || newDeptName === oldName) {
      setEditingDept(null);
      return;
    }

    try {
      // Update all users in this department
      const { error } = await supabase
        .from('profiles')
        .update({ department: newDeptName })
        .eq('department', oldName);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Department renamed to "${newDeptName}"`,
      });

      setEditingDept(null);
      setNewDeptName('');
      loadGroups();
    } catch (error) {
      console.error('Error updating department:', error);
      toast({
        title: 'Error',
        description: 'Failed to update department name',
        variant: 'destructive',
      });
    }
  };

  const handleAssignMentor = async (department: string) => {
    if (!selectedMentorId) return;

    try {
      // Update mentor's department
      const { error } = await supabase
        .from('profiles')
        .update({ department })
        .eq('id', selectedMentorId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Mentor assigned to department',
      });

      setAssigningMentor(null);
      setSelectedMentorId('');
      loadGroups();
    } catch (error) {
      console.error('Error assigning mentor:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign mentor',
        variant: 'destructive',
      });
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a department name',
        variant: 'destructive',
      });
      return;
    }

    // Check if department already exists
    const exists = groups.some((g) => g.department.toLowerCase() === newGroupName.toLowerCase());
    if (exists) {
      toast({
        title: 'Error',
        description: 'Department already exists',
        variant: 'destructive',
      });
      return;
    }

    // Create a temporary group by adding it to the state
    // Note: This creates an empty group that will persist when users are assigned to it
    const newGroup: DepartmentGroup = {
      department: newGroupName,
      mentor: null,
      interns: [],
    };

    setGroups([...groups, newGroup]);
    setCreatingGroup(false);
    setNewGroupName('');

    toast({
      title: 'Success',
      description: `Department "${newGroupName}" created. Assign mentors or interns to this department.`,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8 text-purple-600" />
            Kelompok Intern
          </h1>
          <p className="text-muted-foreground mt-2">
            Interns grouped by department with their mentors
          </p>
        </div>
        <Button
          onClick={() => setCreatingGroup(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Group
        </Button>
      </div>

      {/* Create Group Dialog */}
      {creatingGroup && (
        <Card className="border-2 border-purple-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Create New Department Group</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCreatingGroup(false);
                  setNewGroupName('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Department Name</Label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., IT Department, Marketing, HR"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Create a new department group. You can assign mentors and interns to it later.
                </p>
              </div>
              <Button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Create Department
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{groups.length}</div>
            <p className="text-xs text-muted-foreground">Departments</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {groups.filter((g) => g.mentor).length}
            </div>
            <p className="text-xs text-muted-foreground">Mentors</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {groups.reduce((sum, g) => sum + g.interns.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total Interns</p>
          </CardContent>
        </Card>
      </div>

      {/* Groups */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600">Loading groups...</span>
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No groups found</h3>
              <p className="text-sm text-gray-600">
                No departments with interns or mentors yet
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <Card key={group.department} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Building className="w-6 h-6 text-purple-600" />
                    <div className="flex-1">
                      {editingDept === group.department ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={newDeptName}
                            onChange={(e) => setNewDeptName(e.target.value)}
                            className="max-w-xs"
                            placeholder="Department name"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateDepartmentName(group.department)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingDept(null);
                              setNewDeptName('');
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{group.department}</CardTitle>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingDept(group.department);
                              setNewDeptName(group.department);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        {group.interns.length} intern(s) • {group.mentor ? '1 mentor' : 'No mentor assigned'}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700">
                    {group.interns.length} Interns
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Mentor Section */}
                {group.mentor ? (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-900">Mentor</h3>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssigningMentor(group.department)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Change
                      </Button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
                        {getInitials(group.mentor.full_name)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{group.mentor.full_name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-3 h-3" />
                          {group.mentor.email}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-yellow-800">
                        ⚠️ No mentor assigned to this department yet
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setAssigningMentor(group.department)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Assign Mentor
                      </Button>
                    </div>
                  </div>
                )}

                {/* Assign Mentor Dialog */}
                {assigningMentor === group.department && (
                  <div className="mb-6 p-4 bg-white rounded-lg border-2 border-blue-300">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Assign Mentor</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAssigningMentor(null);
                          setSelectedMentorId('');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label>Select Mentor</Label>
                        <select
                          value={selectedMentorId}
                          onChange={(e) => setSelectedMentorId(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Select a mentor --</option>
                          {allMentors.map((mentor) => (
                            <option key={mentor.id} value={mentor.id}>
                              {mentor.full_name} ({mentor.department || 'No dept'})
                            </option>
                          ))}
                        </select>
                      </div>
                      <Button
                        onClick={() => handleAssignMentor(group.department)}
                        disabled={!selectedMentorId}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Assign Mentor
                      </Button>
                    </div>
                  </div>
                )}

                {/* Interns Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Interns</h3>
                  </div>
                  {group.interns.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No interns in this department</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {group.interns.map((intern) => (
                        <div
                          key={intern.id}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-md transition-shadow"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold shadow">
                            {getInitials(intern.full_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{intern.full_name}</p>
                            <p className="text-xs text-gray-600 truncate">{intern.email}</p>
                            {intern.batch && (
                              <Badge className="mt-1 text-xs bg-green-100 text-green-700">
                                {intern.batch}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
