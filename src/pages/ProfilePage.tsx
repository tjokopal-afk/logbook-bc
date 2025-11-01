// =========================================
// PROFILE PAGE - Flat-Able Style
// =========================================

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { ProfileFormReadOnly } from '@/components/settings/ProfileFormReadOnly';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superuser';

  return (
    <DashboardLayout 
      title="Informasi Profil" 
      breadcrumb={[{ label: 'Pengaturan' }, { label: 'Profil' }]}
    >
      <div className="max-w-4xl space-y-6">
        {profile?.email && (
          <p className="text-sm text-gray-500">
            Login sebagai: <span className="font-medium">{profile.email}</span>
          </p>
        )}

        {/* Profile Form - Different for Admin vs Non-Admin */}
        {isAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>Data Pribadi</CardTitle>
              <CardDescription>
                Update informasi pribadi dan data magang Anda. Data ini akan digunakan dalam PDF timesheet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm />
            </CardContent>
          </Card>
        ) : (
          <ProfileFormReadOnly />
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="text-blue-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">Informasi</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Data profil Anda disimpan dengan aman menggunakan Supabase. 
                  Foto dan tanda tangan akan digunakan saat generate PDF timesheet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
