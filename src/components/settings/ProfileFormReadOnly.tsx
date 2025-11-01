// =========================================
// PROFILE FORM - READ-ONLY VIEW
// Professional layout for intern/mentor
// =========================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/common/FileUpload';
import { 
  User, 
  Mail, 
  Building, 
  GraduationCap, 
  Phone, 
  IdCard,
  UserCheck,
  Save,
  Loader2
} from 'lucide-react';
import { supabase } from '@/supabase';

interface UserMetadata {
  signature_url: string;
}

export function ProfileFormReadOnly() {
  const { profile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState('');

  useEffect(() => {
    if (profile) {
      // Load signature from user metadata or profile
      setSignatureUrl(''); // TODO: Load from database
    }
  }, [profile]);

  const handleSignatureUploaded = (url: string) => {
    setSignatureUrl(url);
    setSaveSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Save only signature
      const { error } = await supabase.auth.updateUser({
        data: { signature_url: signatureUrl },
      });

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating signature:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      intern: { label: 'Intern', className: 'bg-green-100 text-green-700' },
      mentor: { label: 'Mentor', className: 'bg-blue-100 text-blue-700' },
      admin: { label: 'Admin', className: 'bg-purple-100 text-purple-700' },
      superuser: { label: 'Superuser', className: 'bg-red-100 text-red-700' },
    };
    return badges[role as keyof typeof badges] || badges.intern;
  };

  if (!profile) return null;

  const roleBadge = getRoleBadge(profile.role);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Alert */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="font-medium">Tanda tangan berhasil diperbarui!</span>
        </div>
      )}

      {/* Profile Header Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-24"></div>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center -mt-12">
            {/* Profile Photo */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(profile.full_name || profile.email)
              )}
            </div>

            {/* Name & Role */}
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              {profile.full_name || 'No Name'}
            </h2>
            <Badge className={`mt-2 ${roleBadge.className}`}>
              {roleBadge.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="text-blue-600 mt-0.5">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900">Informasi Profil</h4>
            <p className="text-sm text-blue-800 mt-1">
              Data profil Anda hanya dapat diubah oleh admin. Anda hanya dapat mengupload tanda tangan untuk keperluan PDF timesheet.
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            Data Pribadi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="font-medium text-gray-900 truncate">{profile.email}</p>
              </div>
            </div>

            {/* Full Name */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Nama Lengkap</p>
                <p className="font-medium text-gray-900">{profile.full_name || '-'}</p>
              </div>
            </div>

            {/* Affiliation/University */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">
                  {profile.role === 'intern' ? 'Universitas' : 'Institusi'}
                </p>
                <p className="font-medium text-gray-900">{profile.affiliation || '-'}</p>
              </div>
            </div>

            {/* NIM */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-red-100 rounded-lg">
                <IdCard className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">NIM</p>
                <p className="font-medium text-gray-900">{(profile as any).nim || '-'}</p>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Phone className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">WhatsApp</p>
                <p className="font-medium text-gray-900">{(profile as any).phone || '-'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Internship Information Section */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-green-600" />
            Informasi Magang
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <GraduationCap className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Jurusan</p>
                <p className="font-medium text-gray-900">{(profile as any).department || '-'}</p>
              </div>
            </div>

            {/* Batch */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <UserCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Batch</p>
                <p className="font-medium text-gray-900">{(profile as any).batch || '-'}</p>
              </div>
            </div>

            {/* Mentor Name */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Nama Mentor</p>
                <p className="font-medium text-gray-900">-</p>
              </div>
            </div>

            {/* Mentor ID */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg">
                <IdCard className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">ID Mentor / NIK</p>
                <p className="font-medium text-gray-900">-</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Upload Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Tanda Tangan</h3>
            </div>
            <p className="text-sm text-gray-600">
              Upload gambar tanda tangan Anda untuk digunakan dalam PDF timesheet
            </p>
            <FileUploader
              type="signature"
              currentUrl={signatureUrl}
              onUploadSuccess={handleSignatureUploaded}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Tanda Tangan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
