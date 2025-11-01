// =========================================
// SUPERUSER - AUDIT LOG
// Complete action tracking and monitoring
// =========================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Filter,
  Download,
  Loader2,
  AlertTriangle,
  Info,
  AlertCircle,
  User,
  Calendar,
  Activity
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  severity: 'info' | 'warning' | 'critical';
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
  created_at: string;
}

export default function AuditLog() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7days');

  useEffect(() => {
    loadAuditLogs();
  }, [dateFilter]);

  useEffect(() => {
    applyFilters();
  }, [logs, searchQuery, severityFilter, actionFilter]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (dateFilter) {
        case '24hours':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      // TODO: Replace with actual audit_log table query
      // For now, generate mock data based on actual user activities
      const mockLogs = await generateMockAuditLogs(startDate);
      
      setLogs(mockLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockAuditLogs = async (startDate: Date): Promise<AuditLogEntry[]> => {
    // Get real user data
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .limit(10);

    if (!users || users.length === 0) {
      return [];
    }

    const actions = [
      { action: 'user_login', resource_type: 'auth', severity: 'info' },
      { action: 'user_logout', resource_type: 'auth', severity: 'info' },
      { action: 'user_created', resource_type: 'user', severity: 'info' },
      { action: 'user_updated', resource_type: 'user', severity: 'info' },
      { action: 'user_deleted', resource_type: 'user', severity: 'warning' },
      { action: 'project_created', resource_type: 'project', severity: 'info' },
      { action: 'project_updated', resource_type: 'project', severity: 'info' },
      { action: 'logbook_created', resource_type: 'logbook', severity: 'info' },
      { action: 'review_created', resource_type: 'review', severity: 'info' },
      { action: 'login_failed', resource_type: 'auth', severity: 'warning' },
      { action: 'permission_changed', resource_type: 'permission', severity: 'critical' },
      { action: 'file_uploaded', resource_type: 'file', severity: 'info' },
    ];

    const mockLogs: AuditLogEntry[] = [];
    const now = new Date();
    const timeDiff = now.getTime() - startDate.getTime();

    // Generate 50 random log entries
    for (let i = 0; i < 50; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const actionData = actions[Math.floor(Math.random() * actions.length)];
      const randomTime = new Date(startDate.getTime() + Math.random() * timeDiff);

      mockLogs.push({
        id: `log-${i}`,
        user_id: user.id,
        user_name: user.full_name || 'Unknown',
        user_email: user.email,
        action: actionData.action,
        resource_type: actionData.resource_type,
        resource_id: `res-${Math.floor(Math.random() * 1000)}`,
        severity: actionData.severity as 'info' | 'warning' | 'critical',
        ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        metadata: {},
        created_at: randomTime.toISOString(),
      });
    }

    return mockLogs.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.user_name.toLowerCase().includes(query) ||
          log.user_email.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.resource_type.toLowerCase().includes(query)
      );
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter((log) => log.severity === severityFilter);
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    setFilteredLogs(filtered);
  };

  const handleExportCSV = () => {
    const csv = [
      ['Timestamp', 'User', 'Email', 'Action', 'Resource Type', 'Resource ID', 'Severity', 'IP Address'].join(','),
      ...filteredLogs.map((log) =>
        [
          format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
          log.user_name,
          log.user_email,
          log.action,
          log.resource_type,
          log.resource_id,
          log.severity,
          log.ip_address || '-',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Audit log exported to CSV',
    });
  };

  const getSeverityBadge = (severity: string) => {
    const badges = {
      info: { 
        label: 'Info', 
        className: 'bg-blue-100 text-blue-700',
        icon: Info
      },
      warning: { 
        label: 'Warning', 
        className: 'bg-yellow-100 text-yellow-700',
        icon: AlertTriangle
      },
      critical: { 
        label: 'Critical', 
        className: 'bg-red-100 text-red-700',
        icon: AlertCircle
      },
    };
    return badges[severity as keyof typeof badges] || badges.info;
  };

  const getActionLabel = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get unique actions for filter
  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8 text-red-600" />
            Audit Log
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete system action tracking and monitoring
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{logs.length}</div>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {logs.filter((l) => l.severity === 'info').length}
            </div>
            <p className="text-xs text-muted-foreground">Info</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {logs.filter((l) => l.severity === 'warning').length}
            </div>
            <p className="text-xs text-muted-foreground">Warnings</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {logs.filter((l) => l.severity === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search user, action, resource..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Severity Filter */}
            <div>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Severity</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {getActionLabel(action)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="24hours">Last 24 Hours</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredLogs.length} of {logs.length} events
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-600" />
            Event Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
              <span className="ml-2 text-gray-600">Loading audit logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-sm text-gray-600">
                {searchQuery || severityFilter !== 'all' || actionFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No audit events in the selected time range'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const severityBadge = getSeverityBadge(log.severity);
                const SeverityIcon = severityBadge.icon;

                return (
                  <div
                    key={log.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${severityBadge.className.replace('text', 'bg').replace('100', '200')}`}>
                          <SeverityIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {getActionLabel(log.action)}
                            </span>
                            <Badge className={severityBadge.className}>
                              {severityBadge.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.user_name}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span>{log.user_email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(log.created_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(log.created_at), 'HH:mm:ss')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">Resource Type</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {log.resource_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Resource ID</p>
                        <p className="text-sm font-mono text-gray-900">
                          {log.resource_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">IP Address</p>
                        <p className="text-sm font-mono text-gray-900">
                          {log.ip_address || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
