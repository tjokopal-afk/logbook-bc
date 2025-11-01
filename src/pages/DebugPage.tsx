// =========================================
// DEBUG PAGE - For Troubleshooting
// =========================================

import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugPage() {
  const { user, profile, role, loading } = useAuth();

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Debug Information</h1>
        <p className="text-muted-foreground mt-2">
          System status and authentication details
        </p>
      </div>

      {/* Loading Status */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-lg font-semibold ${loading ? 'text-orange-500' : 'text-green-500'}`}>
            {loading ? '⏳ Loading...' : '✅ Loaded'}
          </p>
        </CardContent>
      </Card>

      {/* User Status */}
      <Card>
        <CardHeader>
          <CardTitle>User Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Status:</strong> {user ? '✅ Authenticated' : '❌ Not Authenticated'}</p>
          {user && (
            <>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Profile Status */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Status:</strong> {profile ? '✅ Loaded' : '❌ Not Loaded'}</p>
          {profile ? (
            <>
              <p><strong>Username:</strong> {profile.username}</p>
              <p><strong>Full Name:</strong> {profile.full_name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Role:</strong> {profile.role}</p>
              <p><strong>Affiliation:</strong> {profile.affiliation || 'N/A'}</p>
            </>
          ) : (
            <p className="text-orange-500">⚠️ Profile data not loaded</p>
          )}
        </CardContent>
      </Card>

      {/* Role Status */}
      <Card>
        <CardHeader>
          <CardTitle>Role Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Current Role:</strong> {role || 'Not set'}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Role determines which pages you can access
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={() => window.location.reload()} className="w-full">
            🔄 Reload Page
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="outline" className="w-full">
            🏠 Go to Login
          </Button>
          {user && (
            <Button onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }} variant="destructive" className="w-full">
              🗑️ Clear Cache & Logout
            </Button>
          )}
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><strong>Path:</strong> {window.location.pathname}</p>
          <p><strong>Origin:</strong> {window.location.origin}</p>
          <p><strong>Browser:</strong> {navigator.userAgent}</p>
          <p><strong>LocalStorage Keys:</strong> {Object.keys(localStorage).length}</p>
        </CardContent>
      </Card>
    </div>
  );
}
