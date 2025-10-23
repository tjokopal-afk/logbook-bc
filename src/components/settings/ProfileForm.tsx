// =========================================
// PROFILE FORM COMPONENT
// Optimized with better validation and UX
// =========================================

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUploader } from './FileUploader';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/supabase';
import type { UserMetadata } from '@/types/logbook.types';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';

export function ProfileForm() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<UserMetadata>({
    name: '',
    university: '',
    whatsapp: '',
    nim: '',
    department: '',
    mentor_name: '',
    mentor_id: '',
    photo_url: '',
    signature_url: '',
  });

  // Load user metadata on mount
  useEffect(() => {
    if (user?.user_metadata) {
      setFormData({
        name: user.user_metadata.name || '',
        university: user.user_metadata.university || '',
        whatsapp: user.user_metadata.whatsapp || '',
        nim: user.user_metadata.nim || '',
        department: user.user_metadata.department || '',
        mentor_name: user.user_metadata.mentor_name || '',
        mentor_id: user.user_metadata.mentor_id || '',
        photo_url: user.user_metadata.photo_url || '',
        signature_url: user.user_metadata.signature_url || '',
      });
    }
  }, [user]);

  const handleChange = (field: keyof UserMetadata, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePhotoUploaded = (url: string) => {
    setFormData((prev) => ({ ...prev, photo_url: url }));
    setSaveSuccess(false);
  };

  const handleSignatureUploaded = (url: string) => {
    setFormData((prev) => ({ ...prev, signature_url: url }));
    setSaveSuccess(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Nama lengkap harus diisi';
    }

    if (!formData.university?.trim()) {
      newErrors.university = 'Universitas harus diisi';
    }

    // Optional: Validate WhatsApp format
    if (formData.whatsapp && !/^[0-9]{10,15}$/.test(formData.whatsapp.replace(/\D/g, ''))) {
      newErrors.whatsapp = 'Format WhatsApp tidak valid (gunakan angka saja)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.updateUser({
        data: formData,
      });

      if (error) throw error;

      setSaveSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Gagal memperbarui profil';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Alert */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-3 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Profil berhasil diperbarui!
        </div>
      )}

      {/* Error Alert */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
          {errors.submit}
        </div>
      )}

      {/* Photo Upload */}
      <div className="space-y-2">
        <Label>Foto Profil</Label>
        <FileUploader
          type="photo"
          currentUrl={formData.photo_url}
          onUploadSuccess={handlePhotoUploaded}
        />
      </div>

      {/* Personal Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Nama Lengkap <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="John Doe"
            className={errors.name ? 'border-red-500' : ''}
            required
          />
          {errors.name && (
            <p className="text-xs text-red-600">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="university">
            Universitas <span className="text-red-500">*</span>
          </Label>
          <Input
            id="university"
            type="text"
            value={formData.university}
            onChange={(e) => handleChange('university', e.target.value)}
            placeholder="Universitas Indonesia"
            className={errors.university ? 'border-red-500' : ''}
            required
          />
          {errors.university && (
            <p className="text-xs text-red-600">{errors.university}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nim">NIM</Label>
          <Input
            id="nim"
            type="text"
            value={formData.nim}
            onChange={(e) => handleChange('nim', e.target.value)}
            placeholder="1234567890"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            type="text"
            value={formData.whatsapp}
            onChange={(e) => handleChange('whatsapp', e.target.value)}
            placeholder="08123456789"
            className={errors.whatsapp ? 'border-red-500' : ''}
          />
          {errors.whatsapp && (
            <p className="text-xs text-red-600">{errors.whatsapp}</p>
          )}
        </div>
      </div>

      {/* Internship Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Informasi Magang</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Departemen</Label>
            <Input
              id="department"
              type="text"
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              placeholder="IT Department"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mentor_name">Nama Mentor</Label>
            <Input
              id="mentor_name"
              type="text"
              value={formData.mentor_name}
              onChange={(e) => handleChange('mentor_name', e.target.value)}
              placeholder="Jane Smith"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="mentor_id">ID Mentor / NIK</Label>
            <Input
              id="mentor_id"
              type="text"
              value={formData.mentor_id}
              onChange={(e) => handleChange('mentor_id', e.target.value)}
              placeholder="EMP001"
            />
          </div>
        </div>
      </div>

      {/* Signature Upload */}
      <div className="space-y-2">
        <Label>Tanda Tangan</Label>
        <FileUploader
          type="signature"
          currentUrl={formData.signature_url}
          onUploadSuccess={handleSignatureUploaded}
        />
        <p className="text-xs text-gray-500">
          Upload gambar tanda tangan untuk digunakan dalam PDF timesheet
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          type="submit"
          disabled={isSaving}
          className="min-w-[150px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Profil
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
