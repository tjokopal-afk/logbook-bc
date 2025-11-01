// =========================================
// LOGIN FORM COMPONENT - Reusable
// Split-screen layout: Form (left) + Branding (right)
// =========================================

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';

export function LoginForm() {
  const { signInWithUsername } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithUsername(username, password);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login gagal. Periksa kembali username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid w-full grid-cols-1 overflow-hidden rounded-xl bg-white shadow-xl md:grid-cols-2 lg:min-h-[480px]">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center px-6 py-8 md:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Selamat Datang
            </h1>
            <p className="mt-1.5 text-sm text-gray-600">
              Masuk username dan password Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label 
                htmlFor="username" 
                className="text-sm font-medium text-gray-700"
              >
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className="h-11 border-gray-300 focus:border-[#6B8E23] focus:ring-[#6B8E23]"
              />
            </div>

            <div className="space-y-2">
              <Label 
                htmlFor="password" 
                className="text-sm font-medium text-gray-700"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11 border-gray-300 focus:border-[#6B8E23] focus:ring-[#6B8E23]"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-[#6B8E23] hover:bg-[#556B2F] text-white font-semibold transition-colors shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <button
              type="button"
              className="text-sm font-medium text-[#6B8E23] hover:text-[#556B2F] transition-colors"
              onClick={() => alert('Hubungi administrator untuk reset password')}
            >
              Forgot your password?
            </button>
            <div className="text-sm text-gray-500">
              Forgot username? <button className="text-[#6B8E23] hover:text-[#556B2F] font-medium">Contact Admin</button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-[#3d4a2c] to-[#2c3620] p-0 overflow-hidden">
        <img
          src="/logo.png"
          alt="Log Book System"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
