// =========================================
// SUPERUSER - STORAGE ANALYTICS
// Disk usage and file analytics
// =========================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  HardDrive, 
  File,
  Image,
  FileText,
  Database,
  Trash2,
  TrendingUp,
  PieChart,
  FolderOpen,
  AlertCircle
} from 'lucide-react';

interface StorageCategory {
  name: string;
  size: number; // bytes
  fileCount: number;
  color: string;
  icon: any;
}

interface LargeFile {
  id: string;
  name: string;
  type: string;
  size: number; // bytes
  uploadedBy: string;
  uploadedAt: string;
  path: string;
}

export default function StorageAnalytics() {
  const [totalStorage] = useState({
    used: 1.2 * 1024 * 1024 * 1024, // 1.2 GB in bytes
    total: 10 * 1024 * 1024 * 1024, // 10 GB in bytes
  });

  const [categories] = useState<StorageCategory[]>([
    {
      name: 'Images',
      size: 450 * 1024 * 1024, // 450 MB
      fileCount: 1234,
      color: 'blue',
      icon: Image,
    },
    {
      name: 'Documents',
      size: 320 * 1024 * 1024, // 320 MB
      fileCount: 567,
      color: 'green',
      icon: FileText,
    },
    {
      name: 'Database',
      size: 280 * 1024 * 1024, // 280 MB
      fileCount: 1,
      color: 'purple',
      icon: Database,
    },
    {
      name: 'Other Files',
      size: 150 * 1024 * 1024, // 150 MB
      fileCount: 234,
      color: 'yellow',
      icon: File,
    },
  ]);

  const [largeFiles] = useState<LargeFile[]>([
    {
      id: '1',
      name: 'project_presentation.pdf',
      type: 'PDF',
      size: 45 * 1024 * 1024, // 45 MB
      uploadedBy: 'John Doe',
      uploadedAt: '2025-10-15T10:30:00Z',
      path: '/uploads/documents/',
    },
    {
      id: '2',
      name: 'training_video.mp4',
      type: 'Video',
      size: 120 * 1024 * 1024, // 120 MB
      uploadedBy: 'Jane Smith',
      uploadedAt: '2025-10-10T14:20:00Z',
      path: '/uploads/media/',
    },
    {
      id: '3',
      name: 'backup_2025-10-01.sql',
      type: 'SQL',
      size: 85 * 1024 * 1024, // 85 MB
      uploadedBy: 'System',
      uploadedAt: '2025-10-01T02:00:00Z',
      path: '/backups/',
    },
    {
      id: '4',
      name: 'company_photos.zip',
      type: 'Archive',
      size: 67 * 1024 * 1024, // 67 MB
      uploadedBy: 'Admin User',
      uploadedAt: '2025-09-28T16:45:00Z',
      path: '/uploads/archives/',
    },
  ]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const usagePercentage = (totalStorage.used / totalStorage.total) * 100;
  const remainingStorage = totalStorage.total - totalStorage.used;

  const getCategoryColor = (color: string) => {
    const colors = {
      blue: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700' },
      green: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700' },
      purple: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700' },
      yellow: { bg: 'bg-yellow-500', light: 'bg-yellow-100', text: 'text-yellow-700' },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <HardDrive className="w-8 h-8 text-red-600" />
            Storage Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Disk usage and file management
          </p>
        </div>
        <Button variant="outline" disabled>
          <Trash2 className="w-4 h-4 mr-2" />
          Cleanup Storage
        </Button>
      </div>

      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Storage</p>
              <HardDrive className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatBytes(totalStorage.total)}</p>
            <p className="text-xs text-gray-500 mt-1">Allocated space</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Used Storage</p>
              <Database className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatBytes(totalStorage.used)}</p>
            <p className="text-xs text-gray-500 mt-1">{usagePercentage.toFixed(1)}% used</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <FolderOpen className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatBytes(remainingStorage)}</p>
            <p className="text-xs text-gray-500 mt-1">Free space</p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Storage Usage
          </CardTitle>
          <CardDescription>
            Current disk space utilization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">
                  {formatBytes(totalStorage.used)} / {formatBytes(totalStorage.total)}
                </span>
                <span className={`font-semibold ${
                  usagePercentage > 80 ? 'text-red-600' : 
                  usagePercentage > 60 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {usagePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    usagePercentage > 80 ? 'bg-red-500' : 
                    usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>

            {usagePercentage > 80 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Storage Warning</p>
                  <p className="text-sm text-red-700">
                    Storage usage is above 80%. Consider cleaning up old files or increasing storage capacity.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Storage by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            Storage by Category
          </CardTitle>
          <CardDescription>
            File distribution across categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => {
              const colors = getCategoryColor(category.color);
              const Icon = category.icon;
              const percentage = (category.size / totalStorage.used) * 100;

              return (
                <div
                  key={category.name}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 ${colors.light} rounded-lg`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{category.name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span>{formatBytes(category.size)}</span>
                        <span>•</span>
                        <span>{category.fileCount.toLocaleString()} files</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`${colors.light} ${colors.text}`}>
                      {percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Largest Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="w-5 h-5 text-yellow-600" />
            Largest Files
          </CardTitle>
          <CardDescription>
            Files consuming the most storage space
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {largeFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <File className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate">{file.name}</p>
                      <Badge className="bg-gray-100 text-gray-700 text-xs">
                        {file.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>{formatBytes(file.size)}</span>
                      <span>•</span>
                      <span>By {file.uploadedBy}</span>
                      <span>•</span>
                      <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{file.path}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Storage Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Storage Trends
          </CardTitle>
          <CardDescription>
            Growth over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Daily Growth</p>
              <p className="text-2xl font-bold text-blue-600">+15 MB</p>
              <p className="text-xs text-gray-600 mt-1">Average per day</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Files Added</p>
              <p className="text-2xl font-bold text-green-600">+234</p>
              <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Estimated Full</p>
              <p className="text-2xl font-bold text-purple-600">~580 days</p>
              <p className="text-xs text-gray-600 mt-1">At current rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
