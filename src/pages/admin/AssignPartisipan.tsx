// =========================================
// ADMIN - ASSIGN PARTISIPAN PAGE
// Assign intern/mentor to projects
// =========================================

import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { ROLES } from '@/utils/roleConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Search, 
  Briefcase,
  Users,
  Trash2,
  Loader2,
  Plus
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { AddParticipantDialog } from '@/components/admin/AddParticipantDialog';

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Participant {
  id: string;
  user_id: string;
  project_id: string;
  role: string;
  joined_at: string;
  user_name: string;
  user_email: string;
  user_role: string;
}

export default function AssignPartisipan() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadParticipants();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .order('name');

      if (error) throw error;
      setProjects(data || []);
      
      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0].id);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    }
  };

  const loadParticipants = async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_participants')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            role
          )
        `)
        .eq('project_id', selectedProject)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        project_id: p.project_id,
        role: p.role,
        joined_at: p.joined_at,
        user_name: p.profiles?.full_name || 'Unknown',
        user_email: p.profiles?.email || '',
        user_role: p.profiles?.role || '',
      }));

      setParticipants(formattedData);
    } catch (error) {
      console.error('Error loading participants:', error);
      toast({
        title: 'Error',
        description: 'Failed to load participants',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (participantId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from this project?`)) return;

    try {
      const { error } = await supabase
        .from('project_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Participant removed from project',
      });

      loadParticipants();
    } catch (error: any) {
      console.error('Error removing participant:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove participant',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      intern: { label: 'Intern', className: 'bg-green-100 text-green-700' },
      mentor: { label: 'Mentor', className: 'bg-blue-100 text-blue-700' },
      admin: { label: 'Admin', className: 'bg-purple-100 text-purple-700' },
    };
    return badges[role as keyof typeof badges] || badges.intern;
  };

  const filteredParticipants = participants.filter((p) =>
    p.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.user_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProjectData = projects.find((p) => p.id === selectedProject);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserPlus className="w-8 h-8 text-purple-600" />
            Assign Partisipan
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage project participants (interns & mentors)
          </p>
        </div>
      </div>

      {/* Project Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Select Project
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
          >
            <option value="">-- Select a project --</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.status})
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedProject && (
        <>
          {/* Stats & Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {participants.length}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Participants</p>
                  </div>
                  <Users className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {participants.filter((p) => p.user_role === ROLES.INTERN).length}
                    </div>
                    <p className="text-xs text-muted-foreground">Interns</p>
                  </div>
                  <Users className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {participants.filter((p) => p.user_role === ROLES.MENTOR).length}
                    </div>
                    <p className="text-xs text-muted-foreground">Mentors</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Add */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Participants</CardTitle>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Participant
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search participants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Participants List */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <span className="ml-2 text-gray-600">Loading participants...</span>
                </div>
              ) : filteredParticipants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No participants</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {searchQuery
                      ? 'No participants match your search'
                      : 'Add participants to this project'}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setShowAddDialog(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Participant
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-shrink-0 h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">
                              {participant.user_name}
                            </p>
                            <Badge className={getRoleBadge(participant.user_role).className}>
                              {getRoleBadge(participant.user_role).label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{participant.user_email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Joined: {new Date(participant.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveParticipant(participant.id, participant.user_name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Participant Dialog */}
      {showAddDialog && selectedProject && selectedProjectData && (
        <AddParticipantDialog
          isOpen={showAddDialog}
          projectId={selectedProject}
          projectName={selectedProjectData.name}
          existingParticipants={participants.map((p) => p.user_id)}
          onClose={() => setShowAddDialog(false)}
          onSuccess={() => {
            loadParticipants();
            setShowAddDialog(false);
          }}
        />
      )}
    </div>
  );
}
