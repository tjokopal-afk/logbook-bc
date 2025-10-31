// =========================================
// SUPERUSER - PERFORMANCE METRICS
// Response time and query analytics
// =========================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
  BarChart3,
  Database
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  avg: number;
  p95: number;
  p99: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

interface EndpointMetric {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  requestCount: number;
  errorRate: number;
  status: 'good' | 'warning' | 'critical';
}

interface SlowQuery {
  id: string;
  query: string;
  executionTime: number;
  table: string;
  timestamp: string;
  count: number;
}

export default function PerformanceMetrics() {
  const [metrics] = useState<PerformanceMetric[]>([
    {
      name: 'API Response Time',
      avg: 45,
      p95: 120,
      p99: 250,
      unit: 'ms',
      status: 'good',
    },
    {
      name: 'Database Query Time',
      avg: 12,
      p95: 45,
      p99: 89,
      unit: 'ms',
      status: 'good',
    },
    {
      name: 'Page Load Time',
      avg: 1.2,
      p95: 2.5,
      p99: 4.1,
      unit: 's',
      status: 'good',
    },
  ]);

  const [endpoints] = useState<EndpointMetric[]>([
    {
      endpoint: '/api/logbook/entries',
      method: 'GET',
      avgResponseTime: 45,
      requestCount: 12543,
      errorRate: 0.2,
      status: 'good',
    },
    {
      endpoint: '/api/projects',
      method: 'GET',
      avgResponseTime: 32,
      requestCount: 8765,
      errorRate: 0.1,
      status: 'good',
    },
    {
      endpoint: '/api/reviews/create',
      method: 'POST',
      avgResponseTime: 156,
      requestCount: 2341,
      errorRate: 1.2,
      status: 'warning',
    },
    {
      endpoint: '/api/users/search',
      method: 'GET',
      avgResponseTime: 234,
      requestCount: 5432,
      errorRate: 0.5,
      status: 'warning',
    },
    {
      endpoint: '/api/reports/generate',
      method: 'POST',
      avgResponseTime: 3456,
      requestCount: 234,
      errorRate: 2.8,
      status: 'critical',
    },
  ]);

  const [slowQueries] = useState<SlowQuery[]>([
    {
      id: '1',
      query: 'SELECT * FROM logbook_entries WHERE user_id = ? ORDER BY created_at DESC',
      executionTime: 456,
      table: 'logbook_entries',
      timestamp: new Date().toISOString(),
      count: 234,
    },
    {
      id: '2',
      query: 'SELECT COUNT(*) FROM reviews JOIN logbook_entries ON reviews.entry_id = logbook_entries.id',
      executionTime: 389,
      table: 'reviews',
      timestamp: new Date().toISOString(),
      count: 156,
    },
    {
      id: '3',
      query: 'SELECT * FROM projects WHERE status = ? AND end_date > NOW()',
      executionTime: 234,
      table: 'projects',
      timestamp: new Date().toISOString(),
      count: 89,
    },
  ]);

  const [systemStats] = useState({
    totalRequests: 45678,
    successRate: 99.2,
    avgResponseTime: 45,
    errorCount: 365,
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      good: { label: 'Good', className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      warning: { label: 'Warning', className: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
      critical: { label: 'Critical', className: 'bg-red-100 text-red-700', icon: AlertTriangle },
    };
    return badges[status as keyof typeof badges] || badges.good;
  };

  const getMethodBadge = (method: string) => {
    const badges = {
      GET: 'bg-blue-100 text-blue-700',
      POST: 'bg-green-100 text-green-700',
      PUT: 'bg-yellow-100 text-yellow-700',
      DELETE: 'bg-red-100 text-red-700',
    };
    return badges[method as keyof typeof badges] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="w-8 h-8 text-red-600" />
          Performance Metrics
        </h1>
        <p className="text-muted-foreground mt-2">
          Response time and query analytics
        </p>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{systemStats.totalRequests.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{systemStats.successRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Successful responses</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Avg Response</p>
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{systemStats.avgResponseTime}ms</p>
            <p className="text-xs text-gray-500 mt-1">Average time</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{systemStats.errorCount}</p>
            <p className="text-xs text-gray-500 mt-1">Failed requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Response Time Metrics
          </CardTitle>
          <CardDescription>
            Average, P95, and P99 response times
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric) => {
              const badge = getStatusBadge(metric.status);
              const Icon = badge.icon;

              return (
                <div
                  key={metric.name}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{metric.name}</p>
                      <Badge className={badge.className}>
                        <Icon className="w-3 h-3 mr-1" />
                        {badge.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Average</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {metric.avg}{metric.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">P95</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {metric.p95}{metric.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">P99</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {metric.p99}{metric.unit}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            API Endpoint Performance
          </CardTitle>
          <CardDescription>
            Most frequently accessed endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {endpoints.map((endpoint) => {
              const statusBadge = getStatusBadge(endpoint.status);
              const StatusIcon = statusBadge.icon;
              const methodClass = getMethodBadge(endpoint.method);

              return (
                <div
                  key={endpoint.endpoint}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge className={methodClass}>
                        {endpoint.method}
                      </Badge>
                      <p className="font-mono text-sm text-gray-900 truncate">
                        {endpoint.endpoint}
                      </p>
                    </div>
                    <Badge className={statusBadge.className}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusBadge.label}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Response Time</p>
                      <p className="font-semibold text-gray-900">{endpoint.avgResponseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Requests</p>
                      <p className="font-semibold text-gray-900">{endpoint.requestCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Error Rate</p>
                      <p className={`font-semibold ${
                        endpoint.errorRate > 2 ? 'text-red-600' :
                        endpoint.errorRate > 1 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {endpoint.errorRate}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Slow Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-yellow-600" />
            Slow Queries
          </CardTitle>
          <CardDescription>
            Database queries that need optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {slowQueries.map((query) => (
              <div
                key={query.id}
                className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-yellow-100 text-yellow-700">
                        {query.table}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Executed {query.count} times
                      </span>
                    </div>
                    <p className="font-mono text-sm text-gray-900 mb-2 break-all">
                      {query.query}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Last execution: {new Date(query.timestamp).toLocaleString()}
                  </span>
                  <span className="font-semibold text-red-600">
                    {query.executionTime}ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Add Database Index</p>
                <p className="text-sm text-blue-700">
                  Consider adding an index on logbook_entries.user_id to improve query performance
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Enable Query Caching</p>
                <p className="text-sm text-blue-700">
                  Frequently accessed data can be cached to reduce database load
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Optimize Report Generation</p>
                <p className="text-sm text-blue-700">
                  /api/reports/generate endpoint is slow. Consider background job processing
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
