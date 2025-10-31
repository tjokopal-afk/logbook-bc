// =========================================
// SUPERUSER - DATABASE MANAGEMENT
// Backup, restore, and database analytics
// =========================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  Table,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BackupInfo {
  id: string;
  filename: string;
  size: number; // bytes
  created_at: string;
  status: 'completed' | 'in_progress' | 'failed';
  type: 'manual' | 'scheduled';
}

interface TableStats {
  name: string;
  row_count: number;
  size_mb: number;
  last_vacuum: string;
}

export default function DatabaseManagement() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  
  const [backups, setBackups] = useState<BackupInfo[]>([
    {
      id: '1',
      filename: 'backup_2025-10-31_02-00.sql',
      size: 15728640, // 15 MB
      created_at: '2025-10-31T02:00:00Z',
      status: 'completed',
      type: 'scheduled',
    },
    {
      id: '2',
      filename: 'backup_2025-10-30_02-00.sql',
      size: 14680064, // 14 MB
      created_at: '2025-10-30T02:00:00Z',
      status: 'completed',
      type: 'scheduled',
    },
    {
      id: '3',
      filename: 'backup_manual_2025-10-29.sql',
      size: 14155776, // 13.5 MB
      created_at: '2025-10-29T14:30:00Z',
      status: 'completed',
      type: 'manual',
    },
  ]);

  const [tableStats, setTableStats] = useState<TableStats[]>([
    { name: 'profiles', row_count: 156, size_mb: 2.4, last_vacuum: '2025-10-30T02:00:00Z' },
    { name: 'projects', row_count: 45, size_mb: 1.2, last_vacuum: '2025-10-30T02:00:00Z' },
    { name: 'logbook_entries', row_count: 3421, size_mb: 8.7, last_vacuum: '2025-10-30T02:00:00Z' },
    { name: 'reviews', row_count: 892, size_mb: 3.1, last_vacuum: '2025-10-30T02:00:00Z' },
    { name: 'tasks', row_count: 234, size_mb: 1.8, last_vacuum: '2025-10-30T02:00:00Z' },
    { name: 'project_participants', row_count: 178, size_mb: 0.9, last_vacuum: '2025-10-30T02:00:00Z' },
  ]);

  const totalDatabaseSize = tableStats.reduce((sum, table) => sum + table.size_mb, 0);

  const handleManualBackup = async () => {
    setBackupInProgress(true);
    try {
      // TODO: Implement actual backup via Supabase API
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const newBackup: BackupInfo = {
        id: Date.now().toString(),
        filename: `backup_manual_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.sql`,
        size: 15000000,
        created_at: new Date().toISOString(),
        status: 'completed',
        type: 'manual',
      };

      setBackups([newBackup, ...backups]);

      toast({
        title: 'Success!',
        description: 'Database backup created successfully',
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        title: 'Error',
        description: 'Failed to create backup',
        variant: 'destructive',
      });
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore this backup? This will overwrite current data.')) {
      return;
    }

    setRestoreInProgress(true);
    try {
      // TODO: Implement actual restore via Supabase API
      await new Promise((resolve) => setTimeout(resolve, 3000));

      toast({
        title: 'Success!',
        description: 'Database restored successfully',
      });
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore backup',
        variant: 'destructive',
      });
    } finally {
      setRestoreInProgress(false);
    }
  };

  const handleDownloadBackup = (backup: BackupInfo) => {
    toast({
      title: 'Download Started',
      description: `Downloading ${backup.filename}`,
    });
    // TODO: Implement actual download
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return;
    }

    try {
      setBackups(backups.filter((b) => b.id !== backupId));
      toast({
        title: 'Success',
        description: 'Backup deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete backup',
        variant: 'destructive',
      });
    }
  };

  const handleOptimizeTable = async (tableName: string) => {
    setLoading(true);
    try {
      // TODO: Implement VACUUM ANALYZE
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'Success!',
        description: `Table ${tableName} optimized successfully`,
      });

      // Update last_vacuum timestamp
      setTableStats(
        tableStats.map((table) =>
          table.name === tableName
            ? { ...table, last_vacuum: new Date().toISOString() }
            : table
        )
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to optimize table',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: { label: 'Completed', className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700', icon: Clock },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-700', icon: AlertCircle },
    };
    return badges[status as keyof typeof badges] || badges.completed;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="w-8 h-8 text-red-600" />
            Database Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Backup, restore, and optimize your database
          </p>
        </div>
        <Button 
          onClick={handleManualBackup} 
          disabled={backupInProgress}
          className="bg-red-600 hover:bg-red-700"
        >
          {backupInProgress ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Backup...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Create Backup
            </>
          )}
        </Button>
      </div>

      {/* Database Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Size</p>
              <HardDrive className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalDatabaseSize.toFixed(1)} MB</p>
            <p className="text-xs text-gray-500 mt-1">Database storage</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Tables</p>
              <Table className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{tableStats.length}</p>
            <p className="text-xs text-gray-500 mt-1">Active tables</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Backups</p>
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{backups.length}</p>
            <p className="text-xs text-gray-500 mt-1">Available backups</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Last Backup</p>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-lg font-bold text-gray-900">
              {backups.length > 0 ? format(new Date(backups[0].created_at), 'MMM dd') : '-'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {backups.length > 0 ? format(new Date(backups[0].created_at), 'HH:mm') : 'No backups'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Backup Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Backup History
          </CardTitle>
          <CardDescription>
            Manage database backups and restore points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {backups.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No backups available</p>
              </div>
            ) : (
              backups.map((backup) => {
                const statusBadge = getStatusBadge(backup.status);
                const StatusIcon = statusBadge.icon;

                return (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Database className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{backup.filename}</p>
                          <Badge className={statusBadge.className}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusBadge.label}
                          </Badge>
                          <Badge className={backup.type === 'manual' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                            {backup.type === 'manual' ? 'Manual' : 'Scheduled'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{formatBytes(backup.size)}</span>
                          <span>•</span>
                          <span>{format(new Date(backup.created_at), 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadBackup(backup)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(backup.id)}
                        disabled={restoreInProgress}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBackup(backup.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="w-5 h-5 text-green-600" />
            Table Analytics
          </CardTitle>
          <CardDescription>
            Database table statistics and optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tableStats.map((table) => (
              <div
                key={table.name}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Table className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{table.name}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>{table.row_count.toLocaleString()} rows</span>
                      <span>•</span>
                      <span>{table.size_mb.toFixed(2)} MB</span>
                      <span>•</span>
                      <span>Last optimized: {format(new Date(table.last_vacuum), 'MMM dd, HH:mm')}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOptimizeTable(table.name)}
                  disabled={loading}
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Optimize
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SQL Console - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            SQL Query Console
          </CardTitle>
          <CardDescription>
            Execute custom SQL queries (Dev Mode)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 rounded-lg p-4 text-gray-300 font-mono text-sm">
            <p className="text-yellow-400">-- SQL Console</p>
            <p className="text-gray-500">-- Coming soon...</p>
            <p className="text-gray-500">-- Execute custom queries with caution</p>
          </div>
          <div className="mt-4 flex justify-end">
            <Button disabled variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Execute Query
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
