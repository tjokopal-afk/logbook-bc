# ⚡ QUICK START GUIDE

> **Get started with Logbook Application in 10 minutes**

---

## 🚀 Setup (5 menit)

### 1. Install Dependencies

```bash
cd d:\Magang\Log-Book
npm install
```

### 2. Setup Database

1. Buka: https://supabase.com/dashboard
2. Project: `agquhjvxcyjhjybmnqyc`
3. Klik **SQL Editor**
4. Copy paste dari: `updated_documentation/03_DATABASE_SCHEMA.md`
5. Klik **Run**

✅ **Done!** Database ready.

### 3. Run Application

```bash
npm run dev
```

Buka: http://localhost:5173

---

## 📖 Usage Flow (5 menit)

### Step 1: Login
- Klik **"Login with Google"**
- Pilih akun Google
- Authorize aplikasi

### Step 2: Setup Profile (Optional)
- Menu **Pengaturan**
- Isi nama, universitas, dll
- Upload foto & tanda tangan
- Klik **Simpan**

### Step 3: Input Aktivitas
- Menu **Dashboard**
- Isi form:
  - Tanggal (default: hari ini)
  - Aktivitas: "Coding"
  - Jam: 08:00 - 17:00
  - Deskripsi (optional)
- Klik **Tambah Aktivitas**
- Muncul di tabel draft

### Step 4: Save Weekly
- Setelah ada beberapa aktivitas
- Klik **Simpan Logbook Mingguan**
- Beri nama: "Minggu 1 - Jan 2024"
- Klik **Simpan**

### Step 5: View & Export
- Menu **Data Management**
- Lihat card logbook
- Klik **Lihat Detail**
- Klik **Download PDF** (coming soon)

---

## 📁 File Structure

```
Log-Book/
├── updated_documentation/     # 📚 Dokumentasi lengkap
│   ├── README.md             # Index
│   ├── 01_PROJECT_OVERVIEW.md
│   ├── 02_SETUP_INSTALLATION.md
│   └── 03_DATABASE_SCHEMA.md
│
├── src/
│   ├── pages/                # ✅ 3 halaman
│   ├── components/           # ✅ 8 komponen
│   ├── hooks/                # ✅ React Query
│   ├── services/             # ✅ API layer
│   ├── types/                # ✅ TypeScript
│   └── context/              # ✅ Auth (OPTIMIZED)
│
├── SUMMARY.md                # 📊 Implementation summary
├── QUICK_START.md            # ⚡ This file
└── package.json
```

---

## 🎯 Key Features

| Feature | Location | Description |
|---------|----------|-------------|
| **Input Aktivitas** | Dashboard | Form dengan auto-duration |
| **Draft Entries** | Dashboard | Preview table editable |
| **Save Weekly** | Dashboard → Dialog | Batch save |
| **View Logbooks** | Data Management | Card grid |
| **Detail View** | Data Management → Modal | Table entries |
| **Profile** | Settings | Upload foto & ttd |

---

## 🔧 Troubleshooting

### Error: "User not authenticated"
**Fix:** Logout → Login ulang

### Error: "Failed to create entry"
**Fix:** Run database SQL script

### Error: "Upload failed"
**Fix:** 
- File < 5MB
- Format: JPG, PNG, WebP
- Check storage bucket di Supabase

### TypeScript Errors in IDE
**Fix:** 
- Restart TS Server
- Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

---

## 📞 Help & Resources

**Documentation:**
- Full Docs: `updated_documentation/README.md`
- Implementation: `SUMMARY.md`
- Database: `updated_documentation/03_DATABASE_SCHEMA.md`

**Tech Stack:**
- React 19 + TypeScript
- Supabase (Backend)
- TailwindCSS + shadcn/ui
- React Query v5

---

## ✅ Quick Checklist

- [ ] `npm install` done
- [ ] Database SQL run successfully
- [ ] `npm run dev` running
- [ ] Login with Google works
- [ ] Can create activity
- [ ] Can save weekly logbook
- [ ] Can view in Data Management
- [ ] Profile update works

---

**Ready to code! 🚀**

For detailed info, check: `updated_documentation/README.md`
