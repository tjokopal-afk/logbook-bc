// =========================================
// SUPERUSER - SYSTEM HEALTH
// Server status and resource monitoring
// =========================================

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Server,
  Cpu,
  HardDrive,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';

interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: { warning: number; critical: number };
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number; // percentage
  lastCheck: string;
  responseTime: number; // ms
}

export default function SystemHealth() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([
    {
      name: 'CPU Usage',
      value: 45,
      unit: '%',
      status: 'healthy',
      threshold: { warning: 70, critical: 90 },
    },
    {
      name: 'Memory Usage',
      value: 62,
      unit: '%',
      status: 'healthy',
      threshold: { warning: 80, critical: 95 },
    },
    {
      name: 'Disk Usage',
      value: 38,
      unit: '%',
      status: 'healthy',
      threshold: { warning: 80, critical: 90 },
    },
    {
      name: 'Network Latency',
      value: 45,
      unit: 'ms',
      status: 'healthy',
      threshold: { warning: 100, critical: 200 },
    },
  ]);

  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Database',
      status: 'online',
      uptime: 99.9,
      lastCheck: new Date().toISOString(),
      responseTime: 12,
    },
    {
      name: 'API Server',
      status: 'online',
      uptime: 99.8,
      lastCheck: new Date().toISOString(),
      responseTime: 45,
    },
    {
      name: 'Storage',
      status: 'online',
      uptime: 100,
      lastCheck: new Date().toISOString(),
      responseTime: 8,
    },
    {
      name: 'Email Service',
      status: 'degraded',
      uptime: 98.5,
      lastCheck: new Date().toISOString(),
      responseTime: 234,
    },
  ]);

  const [systemUptime, setSystemUptime] = useState({
    days: 45,
    hours: 12,
    minutes: 34,
    percentage: 99.9,
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev.map((metric) => ({
          ...metric,
          value: Math.max(0, Math.min(100, metric.value + (Math.random() - 0.5) * 10)),
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const badges = {
      healthy: { label: 'Healthy', className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      warning: { label: 'Warning', className: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
      critical: { label: 'Critical', className: 'bg-red-100 text-red-700', icon: XCircle },
      online: { label: 'Online', className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      offline: { label: 'Offline', className: 'bg-red-100 text-red-700', icon: XCircle },
      degraded: { label: 'Degraded', className: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
    };
    return badges[status as keyof typeof badges] || badges.healthy;
  };

  const getMetricStatus = (metric: HealthMetric): 'healthy' | 'warning' | 'critical' => {
    if (metric.value >= metric.threshold.critical) return 'critical';
    if (metric.value >= metric.threshold.warning) return 'warning';
    return 'healthy';
  };

  const getProgressColor = (status: string) => {
    const colors = {
      healthy: 'bg-green-500',
      warning: 'bg-yellow-500',
      critical: 'bg-red-500',
    };
    return colors[status as keyof typeof colors] || colors.healthy;
  };

  const overallHealth = metrics.every((m) => getMetricStatus(m) === 'healthy') ? 'healthy' : 
                       metrics.some((m) => getMetricStatus(m) === 'critical') ? 'critical' : 'warning';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8 text-red-600" />
            System Health
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time server status and resource monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const badge = getStatusBadge(overallHealth);
            const Icon = badge.icon;
            return (
              <Badge className={badge.className}>
                <Icon className="w-3 h-3 mr-1" />
                {badge.label}
              </Badge>
            );
          })()}
          <span className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* System Uptime */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">System Uptime</p>
                <p className="text-3xl font-bold text-gray-900">
                  {systemUptime.days}d {systemUptime.hours}h {systemUptime.minutes}m
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {systemUptime.percentage}% uptime (last 30 days)
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Status</p>
              <Badge className="bg-green-100 text-green-700 mt-1">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Operational
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resource Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const status = getMetricStatus(metric);
          const badge = getStatusBadge(status);
          const Icon = badge.icon;
          const progressColor = getProgressColor(status);

          const icons = {
            'CPU Usage': Cpu,
            'Memory Usage': HardDrive,
            'Disk Usage': Server,
            'Network Latency': Wifi,
          };
          const MetricIcon = icons[metric.name as keyof typeof icons] || Activity;

          return (
            <Card key={metric.name} className={`border-l-4 border-l-${status === 'healthy' ? 'green' : status === 'warning' ? 'yellow' : 'red'}-500`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MetricIcon className="w-5 h-5 text-gray-600" />
                  </div>
                  <Icon className={`w-5 h-5 ${status === 'healthy' ? 'text-green-600' : status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`} />
                </div>
                <p className="text-sm text-gray-600 mb-2">{metric.name}</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metric.value.toFixed(1)}{metric.unit}
                </p>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${progressColor} transition-all duration-500`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>Warning: {metric.threshold.warning}{metric.unit}</span>
                    <span>100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            Service Status
          </CardTitle>
          <CardDescription>
            Monitor critical system services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {services.map((service) => {
              const badge = getStatusBadge(service.status);
              const Icon = badge.icon;

              return (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      service.status === 'online' ? 'bg-green-100' :
                      service.status === 'degraded' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      <Server className={`w-5 h-5 ${
                        service.status === 'online' ? 'text-green-600' :
                        service.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{service.name}</p>
                        <Badge className={badge.className}>
                          <Icon className="w-3 h-3 mr-1" />
                          {badge.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Uptime: {service.uptime}%</span>
                        <span>•</span>
                        <span>Response: {service.responseTime}ms</span>
                        <span>•</span>
                        <span>Last check: {new Date(service.lastCheck).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-16">
                      <svg className="transform -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="3"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke={service.status === 'online' ? '#10b981' : service.status === 'degraded' ? '#f59e0b' : '#ef4444'}
                          strokeWidth="3"
                          strokeDasharray={`${service.uptime}, 100`}
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Performance Trends
          </CardTitle>
          <CardDescription>
            24-hour performance overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-gray-700">Avg Response Time</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">45ms</p>
              <p className="text-xs text-gray-600 mt-1">↓ 12% from yesterday</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-gray-700">Success Rate</p>
              </div>
              <p className="text-2xl font-bold text-green-600">99.8%</p>
              <p className="text-xs text-gray-600 mt-1">↑ 0.2% from yesterday</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-medium text-gray-700">Requests/min</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">1,234</p>
              <p className="text-xs text-gray-600 mt-1">↑ 8% from yesterday</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
