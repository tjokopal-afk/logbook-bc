// =========================================
// ADMIN - DATA INTERN PAGE
// Comprehensive intern database management
// =========================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Search, 
  Edit, 
  Eye,
  Download,
  Loader2,
  Calendar,
  User,
  Building,
  Briefcase
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { EditInternDialog } from '@/components/admin/EditInternDialog';
import { ViewInternDialog } from '@/components/admin/ViewInternDialog';
import { format } from 'date-fns';

interface InternData {
  id: string;
  email: string;
  full_name: string;
  affiliation: string;
  department: string;
  batch?: string;
  start_date?: string;
  end_date?: string;
  mentor_id?: string;
  mentor_name?: string;
  project_id?: string;
  project_name?: string;
  status: 'active' | 'completed' | 'upcoming';
  total_entries?: number;
  total_hours?: number;
}

export default function DataIntern() {
  const { toast } = useToast();
  const [interns, setInterns] = useState<InternData[]>([]);
  const [filteredInterns, setFilteredInterns] = useState<InternData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [affiliationFilter, setAffiliationFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  
  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState<InternData | null>(null);

  // Get unique values for filters
  const [affiliations, setAffiliations] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [batches, setBatches] = useState<string[]>([]);

  useEffect(() => {
    loadInterns();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [interns, searchQuery, statusFilter, affiliationFilter, departmentFilter, batchFilter]);

  const loadInterns = async () => {
    setLoading(true);
    try {
      // Fetch all intern profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'intern')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Fetch additional data for each intern
      const internsWithData = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get mentor info
          const { data: mentorData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', profile.mentor_id || '')
            .single();

          // Get project info
          const { data: projectData } = await supabase
            .from('project_participants')
            .select('project_id, projects(name)')
            .eq('user_id', profile.id)
            .limit(1)
            .single();

          // Get logbook stats
          const { count: totalEntries } = await supabase
            .from('logbook_entries')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          const { data: durationData } = await supabase
            .from('logbook_entries')
            .select('duration_minutes')
            .eq('user_id', profile.id);

          const totalHours = durationData?.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0) / 60 || 0;

          // Determine status
          let status: 'active' | 'completed' | 'upcoming' = 'active';
          if (profile.end_date) {
            const endDate = new Date(profile.end_date);
            const today = new Date();
            if (endDate < today) {
              status = 'completed';
            }
          }
          if (profile.start_date) {
            const startDate = new Date(profile.start_date);
            const today = new Date();
            if (startDate > today) {
              status = 'upcoming';
            }
          }

          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name || 'No name',
            affiliation: profile.affiliation || '-',
            department: profile.department || '-',
            batch: profile.batch || '-',
            start_date: profile.start_date,
            end_date: profile.end_date,
            mentor_id: profile.mentor_id,
            mentor_name: mentorData?.full_name || '-',
            project_id: (projectData as any)?.project_id,
            project_name: (projectData as any)?.projects?.name || '-',
            status,
            total_entries: totalEntries || 0,
            total_hours: Math.round(totalHours),
          };
        })
      );

      setInterns(internsWithData);

      // Extract unique values for filters
      const uniqueAffiliations = Array.from(
        new Set(internsWithData.map((i) => i.affiliation).filter((a) => a !== '-'))
      );
      setAffiliations(uniqueAffiliations);

      const uniqueDepartments = Array.from(
        new Set(internsWithData.map((i) => i.department).filter((d) => d !== '-'))
      );
      setDepartments(uniqueDepartments);

      const uniqueBatches = Array.from(
        new Set(internsWithData.map((i) => i.batch || '').filter((b) => b !== '-' && b !== ''))
      );
      setBatches(uniqueBatches);
    } catch (error) {
      console.error('Error loading interns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load intern data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...interns];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (intern) =>
          intern.full_name?.toLowerCase().includes(query) ||
          intern.email?.toLowerCase().includes(query) ||
          intern.affiliation?.toLowerCase().includes(query) ||
          intern.mentor_name?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((intern) => intern.status === statusFilter);
    }

    // Apply affiliation filter
    if (affiliationFilter !== 'all') {
      filtered = filtered.filter((intern) => intern.affiliation === affiliationFilter);
    }

    // Apply department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter((intern) => intern.department === departmentFilter);
    }

    // Apply batch filter
    if (batchFilter !== 'all') {
      filtered = filtered.filter((intern) => intern.batch === batchFilter);
    }

    setFilteredInterns(filtered);
  };

  const handleEdit = (intern: InternData) => {
    setSelectedIntern(intern);
    setShowEditDialog(true);
  };

  const handleView = (intern: InternData) => {
    setSelectedIntern(intern);
    setShowViewDialog(true);
  };

  const handleExportCSV = () => {
    const csv = [
      ['Name', 'Email', 'Affiliation', 'Mentor', 'Project', 'Start Date', 'End Date', 'Status', 'Entries', 'Hours'].join(','),
      ...filteredInterns.map((intern) =>
        [
          intern.full_name,
          intern.email,
          intern.affiliation,
          intern.mentor_name,
          intern.project_name,
          intern.start_date ? format(new Date(intern.start_date), 'yyyy-MM-dd') : '-',
          intern.end_date ? format(new Date(intern.end_date), 'yyyy-MM-dd') : '-',
          intern.status,
          intern.total_entries,
          intern.total_hours,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interns_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Intern data exported to CSV',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { label: 'Active', className: 'bg-green-100 text-green-700' },
      completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700' },
      upcoming: { label: 'Upcoming', className: 'bg-yellow-100 text-yellow-700' },
    };
    return badges[status as keyof typeof badges] || badges.active;
  };

  const getStats = () => {
    return {
      total: interns.length,
      active: interns.filter((i) => i.status === 'active').length,
      completed: interns.filter((i) => i.status === 'completed').length,
      upcoming: interns.filter((i) => i.status === 'upcoming').length,
    };
  };

  const stats = getStats();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-purple-600" />
            Data Intern
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive intern database and management
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Interns</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.upcoming}</div>
            <p className="text-xs text-muted-foreground">Upcoming</p>
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
                  placeholder="Search by name, email, affiliation, or mentor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>

            {/* Affiliation Filter */}
            <div className="w-full md:w-48">
              <select
                value={affiliationFilter}
                onChange={(e) => setAffiliationFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Universities</option>
                {affiliations.map((aff) => (
                  <option key={aff} value={aff}>
                    {aff}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter */}
            <div className="w-full md:w-48">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Filter */}
            <div className="w-full md:w-40">
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Button */}
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredInterns.length} of {interns.length} interns
          </div>
        </CardContent>
      </Card>

      {/* Interns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Intern Database</CardTitle>
          <CardDescription>Complete intern information and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Loading interns...</span>
            </div>
          ) : filteredInterns.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No interns found</h3>
              <p className="text-sm text-gray-600">
                {searchQuery || statusFilter !== 'all' || affiliationFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No interns in the system yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Intern
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Affiliation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInterns.map((intern) => (
                    <tr key={intern.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {intern.full_name}
                            </div>
                            <div className="text-xs text-gray-500">{intern.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Building className="w-4 h-4 text-gray-400" />
                          {intern.affiliation}
                        </div>
                        {intern.department !== '-' && (
                          <div className="text-xs text-gray-500">{intern.department}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{intern.mentor_name}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          {intern.project_name}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar className="w-3 h-3" />
                          <div>
                            {intern.start_date
                              ? format(new Date(intern.start_date), 'dd MMM yy')
                              : '-'}
                            {' - '}
                            {intern.end_date
                              ? format(new Date(intern.end_date), 'dd MMM yy')
                              : '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge className={getStatusBadge(intern.status).className}>
                          {getStatusBadge(intern.status).label}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600">
                          <div>{intern.total_entries} entries</div>
                          <div>{intern.total_hours}h logged</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(intern)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(intern)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showEditDialog && selectedIntern && (
        <EditInternDialog
          isOpen={showEditDialog}
          intern={selectedIntern}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedIntern(null);
          }}
          onSuccess={() => {
            loadInterns();
            setShowEditDialog(false);
            setSelectedIntern(null);
          }}
        />
      )}

      {showViewDialog && selectedIntern && (
        <ViewInternDialog
          isOpen={showViewDialog}
          intern={selectedIntern}
          onClose={() => {
            setShowViewDialog(false);
            setSelectedIntern(null);
          }}
        />
      )}
    </div>
  );
}
