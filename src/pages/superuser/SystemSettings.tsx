// =========================================
// SUPERUSER - SYSTEM SETTINGS
// Feature flags and system configuration
// =========================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Save, 
  Mail,
  Upload,
  Clock,
  Lock,
  AlertTriangle,
  Zap,
  Database,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemConfig {
  // Feature Flags
  enableFileUpload: boolean;
  enableEmailNotifications: boolean;
  enableAuditLog: boolean;
  enableAutoBackup: boolean;
  maintenanceMode: boolean;

  // Email Settings
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;

  // Upload Settings
  maxFileSize: number; // MB
  allowedFileTypes: string;

  // Security Settings
  sessionTimeout: number; // minutes
  passwordMinLength: number;
  requireStrongPassword: boolean;
  maxLoginAttempts: number;

  // API Settings
  apiRateLimit: number; // requests per minute
  
  // Backup Settings
  backupSchedule: string; // cron expression
  backupRetention: number; // days
}

export default function SystemSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SystemConfig>({
    // Feature Flags
    enableFileUpload: true,
    enableEmailNotifications: false,
    enableAuditLog: true,
    enableAutoBackup: false,
    maintenanceMode: false,

    // Email Settings
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',

    // Upload Settings
    maxFileSize: 5,
    allowedFileTypes: '.pdf,.doc,.docx,.jpg,.png',

    // Security Settings
    sessionTimeout: 60,
    passwordMinLength: 8,
    requireStrongPassword: true,
    maxLoginAttempts: 5,

    // API Settings
    apiRateLimit: 100,

    // Backup Settings
    backupSchedule: '0 2 * * *', // 2 AM daily
    backupRetention: 30,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Save to database or config file
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: 'Success!',
        description: 'System settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (feature: keyof SystemConfig) => {
    setConfig({ ...config, [feature]: !config[feature] });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8 text-red-600" />
            System Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure system features and behavior
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Feature Flags
          </CardTitle>
          <CardDescription>
            Enable or disable system features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">File Upload</p>
                <p className="text-sm text-gray-600">Allow users to upload files</p>
              </div>
            </div>
            <button
              onClick={() => toggleFeature('enableFileUpload')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enableFileUpload ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enableFileUpload ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Send email notifications to users</p>
              </div>
            </div>
            <button
              onClick={() => toggleFeature('enableEmailNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enableEmailNotifications ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enableEmailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Audit Log */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Audit Log</p>
                <p className="text-sm text-gray-600">Track all system actions</p>
              </div>
            </div>
            <button
              onClick={() => toggleFeature('enableAuditLog')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enableAuditLog ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enableAuditLog ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Auto Backup */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">Auto Backup</p>
                <p className="text-sm text-gray-600">Automatic database backups</p>
              </div>
            </div>
            <button
              onClick={() => toggleFeature('enableAutoBackup')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enableAutoBackup ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enableAutoBackup ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-sm text-gray-600">Disable access for all users except superuser</p>
              </div>
            </div>
            <button
              onClick={() => toggleFeature('maintenanceMode')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.maintenanceMode ? 'bg-red-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-600" />
            Email Settings (SMTP)
          </CardTitle>
          <CardDescription>
            Configure email notification settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={config.smtpHost}
                onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div>
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                value={config.smtpPort}
                onChange={(e) => setConfig({ ...config, smtpPort: e.target.value })}
                placeholder="587"
              />
            </div>
            <div>
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                value={config.smtpUser}
                onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                placeholder="your-email@gmail.com"
              />
            </div>
            <div>
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={config.smtpPassword}
                onChange={(e) => setConfig({ ...config, smtpPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload & Security Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              Upload Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={config.maxFileSize}
                onChange={(e) => setConfig({ ...config, maxFileSize: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
              <Input
                id="allowedFileTypes"
                value={config.allowedFileTypes}
                onChange={(e) => setConfig({ ...config, allowedFileTypes: e.target.value })}
                placeholder=".pdf,.doc,.jpg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-600" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={config.sessionTimeout}
                onChange={(e) => setConfig({ ...config, sessionTimeout: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="passwordMinLength">Password Min Length</Label>
              <Input
                id="passwordMinLength"
                type="number"
                value={config.passwordMinLength}
                onChange={(e) => setConfig({ ...config, passwordMinLength: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={config.maxLoginAttempts}
                onChange={(e) => setConfig({ ...config, maxLoginAttempts: parseInt(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API & Backup Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              API Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="apiRateLimit">Rate Limit (requests/minute)</Label>
              <Input
                id="apiRateLimit"
                type="number"
                value={config.apiRateLimit}
                onChange={(e) => setConfig({ ...config, apiRateLimit: parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum API requests per minute per user
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Backup Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="backupSchedule">Backup Schedule (Cron)</Label>
              <Input
                id="backupSchedule"
                value={config.backupSchedule}
                onChange={(e) => setConfig({ ...config, backupSchedule: e.target.value })}
                placeholder="0 2 * * *"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: 2 AM daily
              </p>
            </div>
            <div>
              <Label htmlFor="backupRetention">Retention Period (days)</Label>
              <Input
                id="backupRetention"
                type="number"
                value={config.backupRetention}
                onChange={(e) => setConfig({ ...config, backupRetention: parseInt(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
