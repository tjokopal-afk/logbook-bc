// =========================================
// PENILAIAN - Placeholder (coming soon)
// =========================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProgressIntern() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Penilaian</h1>
        <p className="text-muted-foreground mt-2">Halaman penilaian sedang disiapkan. Coming soon.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Konten belum tersedia</CardTitle>
          <CardDescription>Silakan kembali lagi nanti.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-28 rounded border border-dashed flex items-center justify-center text-sm text-muted-foreground">
            Placeholder
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
