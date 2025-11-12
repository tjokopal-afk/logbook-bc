// =========================================
// ADMIN - DIVISI USER PAGE
// Manage departments and divisions (2-level hierarchy)
// Department (top level) → Division (sub level)
// =========================================

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { 
  Building2, 
  Loader2,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Users
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';

interface Department {
  id: string;
  name: string;
  divisions: Division[];
  user_count: number;
}

interface Division {
  id: string;
  name: string;
  department_id: string;
  user_count: number;
}

export default function DivisiUser() {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Department (top level) states
  const [creatingDepartment, setCreatingDepartment] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  
  // Create Division (sub level) states
  const [creatingDivision, setCreatingDivision] = useState<string | null>(null); // department name
  const [newDivisionName, setNewDivisionName] = useState('');
  
  // Edit states
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [editDepartmentName, setEditDepartmentName] = useState('');
  const [editingDivision, setEditingDivision] = useState<string | null>(null);
  const [editDivisionName, setEditDivisionName] = useState('');
  
  // Confirm dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      // Load all rows from departments table
      const { data: rows, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .order('divisi', { ascending: true })
        .order('nama', { ascending: true });

      if (deptError) throw deptError;

      // Count users per division
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('divisi');

      if (profileError) throw profileError;

      // Map user counts by division ID
      const userCounts = (profiles || []).reduce((acc: Record<string, number>, profile) => {
        if (profile.divisi) {
          acc[profile.divisi] = (acc[profile.divisi] || 0) + 1;
        }
        return acc;
      }, {});

      // Build hierarchy: Department → Divisions
      // Group by department name (nama column)
      const deptMap: Record<string, Department> = {};
      
      (rows || []).forEach(row => {
        const deptName = row.nama!;
        
        // Initialize department if not exists
        if (!deptMap[deptName]) {
          deptMap[deptName] = {
            id: row.id,
            name: deptName,
            divisions: [],
            user_count: 0
          };
        }
        
        // If row has divisi value, it's a division
        if (row.divisi) {
          const division: Division = {
            id: row.id,
            name: row.divisi,
            department_id: deptName,
            user_count: userCounts[row.id] || 0
          };
          
          deptMap[deptName].divisions.push(division);
          deptMap[deptName].user_count += division.user_count;
        }
      });

      setDepartments(Object.values(deptMap));
    } catch (error) {
      console.error('Error loading departments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load departments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  // ========== DEPARTMENT (Top Level) CRUD ==========
  
  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter department name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('departments')
        .insert([{
          nama: newDepartmentName.trim(),
          divisi: null  // Top level department has no divisi
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Department created successfully',
      });

      setCreatingDepartment(false);
      setNewDepartmentName('');
      loadDepartments();
    } catch (error) {
      console.error('Error creating department:', error);
      toast({
        title: 'Error',
        description: 'Failed to create department',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateDepartment = async (deptId: string) => {
    if (!editDepartmentName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter department name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('departments')
        .update({ nama: editDepartmentName.trim() })
        .eq('id', deptId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Department updated successfully',
      });

      setEditingDepartment(null);
      setEditDepartmentName('');
      loadDepartments();
    } catch (error) {
      console.error('Error updating department:', error);
      toast({
        title: 'Error',
        description: 'Failed to update department',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDepartment = async (dept: Department) => {
    if (dept.divisions.length > 0) {
      toast({
        title: 'Cannot Delete',
        description: `This department has ${dept.divisions.length} division(s). Please delete them first.`,
        variant: 'destructive',
      });
      return;
    }

    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Department',
      description: `Are you sure you want to delete "${dept.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('departments')
            .delete()
            .eq('id', dept.id);

          if (error) throw error;

          toast({
            title: 'Success',
            description: 'Department deleted successfully',
          });

          loadDepartments();
        } catch (error) {
          console.error('Error deleting department:', error);
          toast({
            title: 'Error',
            description: 'Failed to delete department',
            variant: 'destructive',
          });
        }
      },
    });
  };

  // ========== DIVISION (Sub Level) CRUD ==========

  const handleCreateDivision = async (departmentName: string) => {
    if (!newDivisionName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter division name',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Search for department row where divisi is null
      const { data: emptyRow, error: searchError } = await supabase
        .from('departments')
        .select('*')
        .eq('nama', departmentName)
        .is('divisi', null)
        .maybeSingle();

      if (searchError) throw searchError;

      if (emptyRow) {
        // Update existing row with division name
        const { error: updateError } = await supabase
          .from('departments')
          .update({ divisi: newDivisionName.trim() })
          .eq('id', emptyRow.id);

        if (updateError) throw updateError;
      } else {
        // Create new row with both nama and divisi
        const { error: insertError } = await supabase
          .from('departments')
          .insert([{
            nama: departmentName,
            divisi: newDivisionName.trim()
          }]);

        if (insertError) throw insertError;
      }

      toast({
        title: 'Success',
        description: 'Division created successfully',
      });

      setCreatingDivision(null);
      setNewDivisionName('');
      loadDepartments();
    } catch (error) {
      console.error('Error creating division:', error);
      toast({
        title: 'Error',
        description: 'Failed to create division',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateDivision = async (divisionId: string) => {
    if (!editDivisionName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter division name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('departments')
        .update({ divisi: editDivisionName.trim() })
        .eq('id', divisionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Division updated successfully',
      });

      setEditingDivision(null);
      setEditDivisionName('');
      loadDepartments();
    } catch (error) {
      console.error('Error updating division:', error);
      toast({
        title: 'Error',
        description: 'Failed to update division',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDivision = async (division: Division) => {
    if (division.user_count > 0) {
      toast({
        title: 'Cannot Delete',
        description: `This division has ${division.user_count} user(s). Please reassign them first.`,
        variant: 'destructive',
      });
      return;
    }

    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Division',
      description: `Are you sure you want to delete division "${division.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          // Set divisi back to null instead of deleting the row
          const { error } = await supabase
            .from('departments')
            .update({ divisi: null })
            .eq('id', division.id);

          if (error) throw error;

          toast({
            title: 'Success',
            description: 'Division deleted successfully',
          });

          loadDepartments();
        } catch (error) {
          console.error('Error deleting division:', error);
          toast({
            title: 'Error',
            description: 'Failed to delete division',
            variant: 'destructive',
          });
        }
      },
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8 text-purple-600" />
            Kelola Divisi
          </h1>
          <p className="text-muted-foreground mt-2">
            Hierarchical department and division management
          </p>
        </div>
        <Button
          onClick={() => setCreatingDepartment(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Department
        </Button>
      </div>

      {/* Create Department Form */}
      {creatingDepartment && (
        <Card className="border-2 border-purple-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Create New Department (Top Level)</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCreatingDepartment(false);
                  setNewDepartmentName('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Department Name *</Label>
                <Input
                  value={newDepartmentName}
                  onChange={(e) => setNewDepartmentName(e.target.value)}
                  placeholder="e.g., Operations, Business, Support"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the top-level department. You can add divisions under it later.
                </p>
              </div>
              <Button
                onClick={handleCreateDepartment}
                disabled={!newDepartmentName.trim()}
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
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{departments.length}</div>
            <p className="text-xs text-muted-foreground">Departments</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {departments.reduce((sum, d) => sum + d.divisions.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Divisions</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {departments.reduce((sum, d) => sum + d.user_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
      </div>

      {/* Departments List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600">Loading departments...</span>
        </div>
      ) : departments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No departments found</h3>
              <p className="text-sm text-gray-600 mb-4">
                Click "Create Department" to add your first department
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {departments.map((dept) => (
            <Card key={dept.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Building2 className="w-6 h-6 text-purple-600" />
                    {editingDepartment === dept.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editDepartmentName}
                          onChange={(e) => setEditDepartmentName(e.target.value)}
                          className="max-w-xs"
                          placeholder="Department name"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdateDepartment(dept.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingDepartment(null);
                            setEditDepartmentName('');
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <CardTitle className="text-xl">{dept.name}</CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingDepartment(dept.id);
                            setEditDepartmentName(dept.name);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDepartment(dept)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-700">
                      {dept.divisions.length} Division{dept.divisions.length !== 1 ? 's' : ''}
                    </Badge>
                    <Badge className="bg-green-100 text-green-700">
                      {dept.user_count} User{dept.user_count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                {/* Create Division Button */}
                {creatingDivision === dept.name ? (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Create New Division</h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCreatingDivision(null);
                          setNewDivisionName('');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label>Division Name *</Label>
                        <Input
                          value={newDivisionName}
                          onChange={(e) => setNewDivisionName(e.target.value)}
                          placeholder="e.g., Engineering, Marketing, HR"
                          className="mt-1"
                        />
                      </div>
                      <Button
                        onClick={() => handleCreateDivision(dept.name)}
                        disabled={!newDivisionName.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Create Division
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreatingDivision(dept.name)}
                    className="mb-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Division
                  </Button>
                )}

                {/* Divisions List */}
                {dept.divisions.length === 0 ? (
                  <p className="text-sm text-gray-500 italic py-4">
                    No divisions in this department yet. Click "Add Division" to create one.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dept.divisions.map((division) => (
                      <div
                        key={division.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border hover:shadow-md transition-shadow"
                      >
                        {editingDivision === division.id ? (
                          <div className="flex items-center gap-3 flex-1">
                            <Input
                              value={editDivisionName}
                              onChange={(e) => setEditDivisionName(e.target.value)}
                              placeholder="Division name"
                              className="max-w-xs"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdateDivision(division.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingDivision(null);
                                setEditDivisionName('');
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{division.name}</h3>
                              <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                <Users className="w-3 h-3" />
                                {division.user_count} user{division.user_count !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingDivision(division.id);
                                  setEditDivisionName(division.name);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteDivision(division)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="destructive"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
