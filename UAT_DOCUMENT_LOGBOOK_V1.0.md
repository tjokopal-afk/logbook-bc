# DOKUMEN USER ACCEPTANCE TEST (UAT)
**Sistem Logbook Magang Digital**

---

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Nama Proyek** | Logbook Magang Digital (Recommendation System) |
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 21 November 2025 |
| **Status** | Draft / **Final** |
| **Pemilik** | Tim Pengembang IT |

---

## DAFTAR ISI

1. [Pendahuluan](#1-pendahuluan)
2. [Lingkungan Pengujian](#2-lingkungan-pengujian)
3. [Kriteria Penerimaan](#3-kriteria-penerimaan)
4. [Skenario Pengujian: Modul Autentikasi](#4-skenario-pengujian-modul-autentikasi)
5. [Skenario Pengujian: Role Intern (Peserta Magang)](#5-skenario-pengujian-role-intern)
6. [Skenario Pengujian: Role Mentor](#6-skenario-pengujian-role-mentor)
7. [Skenario Pengujian: Role Admin/Superuser](#7-skenario-pengujian-role-admin)
8. [Skenario Pengujian: End-to-End Business Flow](#8-skenario-pengujian-end-to-end-business-flow)
9. [Lembar Persetujuan (Sign-Off)](#9-lembar-persetujuan)

<div style="page-break-after: always;"></div>

## 1. PENDAHULUAN

### 1.1 Tujuan
Dokumen ini bertujuan untuk memvalidasi bahwa sistem Logbook Magang Digital telah memenuhi kebutuhan bisnis dan berfungsi sesuai spesifikasi yang disepakati sebelum dirilis ke lingkungan produksi (Live).

### 1.2 Ruang Lingkup
Pengujian mencakup fungsionalitas utama untuk tiga peran pengguna:
1.  **Intern:** Pencatatan aktivitas harian, penyusunan laporan mingguan, dan pemantauan status.
2.  **Mentor:** Review logbook, persetujuan (approval), penolakan (rejection), dan monitoring dashboard.
3.  **Admin:** Manajemen pengguna (User Management) dan konfigurasi proyek.

## 2. LINGKUNGAN PENGUJIAN

*   **URL Aplikasi:** [URL Staging/Production]
*   **Browser:** Google Chrome (Latest), Microsoft Edge (Latest)
*   **Perangkat:** Desktop / Laptop (Resolusi min. 1366x768)

## 3. KRITERIA PENERIMAAN

Sistem dinyatakan diterima (Passed) apabila:
1.  Seluruh skenario pengujian berstatus **PASS**.
2.  Tidak ditemukan *Critical* atau *High Severity* bugs.
3.  Alur bisnis (Business Flow) berjalan lancar tanpa error sistem (White Screen/500 Error).

<div style="page-break-after: always;"></div>

## 4. SKENARIO PENGUJIAN: MODUL AUTENTIKASI

| ID | Skenario | Langkah Pengujian | Ekspektasi Hasil | Status | Catatan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Login Berhasil (Intern) | 1. Buka halaman login.<br>2. Masukkan email & password valid role Intern.<br>3. Klik Login. | Redirect ke **Intern Dashboard**. Menu sesuai hak akses Intern. | [ ] | |
| **AUTH-02** | Login Berhasil (Mentor) | 1. Buka halaman login.<br>2. Masukkan email & password valid role Mentor.<br>3. Klik Login. | Redirect ke **Mentor Dashboard**. Menu sesuai hak akses Mentor. | [ ] | |
| **AUTH-03** | Login Berhasil (Admin) | 1. Buka halaman login.<br>2. Masukkan email & password valid role Admin.<br>3. Klik Login. | Redirect ke **Admin Dashboard**. Menu manajemen user terlihat. | [ ] | |
| **AUTH-04** | Login Gagal | 1. Masukkan email/password salah.<br>2. Klik Login. | Muncul pesan error "Invalid login credentials". Tidak masuk ke sistem. | [ ] | |
| **AUTH-05** | Logout | 1. Klik avatar profil.<br>2. Klik Logout. | Sesi berakhir, redirect kembali ke halaman Login. | [ ] | |

## 5. SKENARIO PENGUJIAN: ROLE INTERN

| ID | Skenario | Langkah Pengujian | Ekspektasi Hasil | Status | Catatan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **INT-01** | Dashboard Overview | 1. Login sebagai Intern.<br>2. Lihat Dashboard. | Menampilkan statistik Draft, Approved, Rejected, dan Total Jam yang akurat. | [ ] | |
| **INT-02** | Input Daily Log (Draft) | 1. Masuk tab "Daily Log".<br>2. Isi Jam Mulai, Selesai, Aktivitas.<br>3. Klik Simpan. | Data muncul di tabel "Draft Entries" di bawah form secara real-time tanpa refresh. | [ ] | |
| **INT-03** | Edit Draft Entry | 1. Klik icon pensil pada salah satu draft.<br>2. Ubah deskripsi aktivitas.<br>3. Simpan. | Data pada tabel terupdate sesuai perubahan. | [ ] | |
| **INT-04** | Compile Weekly Log | 1. Masuk tab "Weekly Compilation".<br>2. Pilih Minggu (Week) yang sesuai.<br>3. Klik "Compile & Submit". | Status berubah menjadi **Submitted**. Draft hilang dari list harian (karena sudah disubmit). | [ ] | |
| **INT-05** | Cek Status & Detail | 1. Buka menu "Status & Review".<br>2. Cari logbook yang baru disubmit.<br>3. Klik "Lihat Detail". | Badge status berwarna Kuning (Pending). Detail aktivitas muncul saat tombol diklik. | [ ] | |
| **INT-06** | Resubmit (Revisi) | 1. Buka menu "Status & Review".<br>2. Cari logbook status **Rejected** (Merah).<br>3. Baca komentar mentor.<br>4. Klik "Edit Logbook", perbaiki entry.<br>5. Klik "Submit Ulang". | Status berubah kembali menjadi **Pending**. Mentor menerima notifikasi (jika ada). | [ ] | |

<div style="page-break-after: always;"></div>

## 6. SKENARIO PENGUJIAN: ROLE MENTOR

| ID | Skenario | Langkah Pengujian | Ekspektasi Hasil | Status | Catatan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MNT-01** | Dashboard Counters | 1. Login sebagai Mentor.<br>2. Cek kartu statistik. | Kartu **"Approved"** (Hijau) hanya menghitung logbook yang sudah disetujui. Kartu **"Pending"** (Kuning) menghitung antrian review. | [ ] | |
| **MNT-02** | Filter Review List | 1. Buka menu "Review Logbook".<br>2. Klik filter "Pending". | List hanya menampilkan logbook yang butuh review. | [ ] | |
| **MNT-03** | View Logbook Detail | 1. Klik salah satu logbook pending.<br>2. Expand detail. | Terlihat ringkasan mingguan, tantangan, pembelajaran, dan detail aktivitas harian intern. | [ ] | |
| **MNT-04** | Approve Logbook | 1. Pada logbook pending, klik **Approve**.<br>2. Konfirmasi dialog. | Status logbook berubah jadi **Approved**. Badge menjadi Hijau. Counter dashboard terupdate. | [ ] | |
| **MNT-05** | Reject Logbook | 1. Pada logbook pending, kosongkan komentar.<br>2. Klik Reject (Harus Gagal).<br>3. Isi komentar revisi.<br>4. Klik **Reject**. | Status berubah jadi **Rejected**. Badge Merah. Komentar tersimpan dan bisa dibaca Intern. | [ ] | |

## 7. SKENARIO PENGUJIAN: ROLE ADMIN

| ID | Skenario | Langkah Pengujian | Ekspektasi Hasil | Status | Catatan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ADM-01** | Create User (Batch) | 1. Buka menu User Management.<br>2. Klik "Add Batch".<br>3. Upload CSV/Input data. | User baru (Intern/Mentor) berhasil dibuat dan muncul di list. | [ ] | |
| **ADM-02** | Assign Mentor | 1. Edit user Intern.<br>2. Assign Mentor spesifik.<br>3. Simpan. | Intern tersebut muncul di dashboard Mentor yang di-assign. | [ ] | |
| **ADM-03** | Project Management | 1. Buat Project baru.<br>2. Tambahkan partisipan (Intern & Mentor). | Project muncul di dropdown saat Intern mengisi logbook. | [ ] | |

<div style="page-break-after: always;"></div>

## 8. SKENARIO PENGUJIAN: END-TO-END BUSINESS FLOW

Skenario ini menguji interaksi bolak-balik antara Intern dan Mentor untuk memastikan siklus hidup data valid.

**Skenario: Siklus Revisi Logbook (The "Happy Path" with Revision)**

| Langkah | Aktor | Aksi | Verifikasi Sistem | Hasil (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Intern** | Membuat 3 draft aktivitas harian untuk Week 1. | Data tersimpan di database dengan status `draft`. | |
| 2 | **Intern** | Melakukan Submit Weekly Logbook Week 1. | Status berubah menjadi `weekly_1_log_submitted`. Muncul di dashboard Mentor. | |
| 3 | **Mentor** | Membuka menu Review, melihat submission Intern tersebut. | Data aktivitas terlihat lengkap. Tombol Approve/Reject aktif. | |
| 4 | **Mentor** | Melakukan **Reject** dengan catatan: "Deskripsi kurang detail". | Status berubah menjadi `weekly_1_log_rejected_1`. Badge merah muncul di dashboard Intern. | |
| 5 | **Intern** | Melihat status Rejected & komentar Mentor. Melakukan Edit pada aktivitas. | Data aktivitas terupdate. Tombol "Submit Ulang" aktif. | |
| 6 | **Intern** | Klik **Submit Ulang**. | Status kembali menjadi `weekly_1_log_submitted`. | |
| 7 | **Mentor** | Melihat kembali logbook yang sudah direvisi. Klik **Approve**. | Status menjadi `weekly_1_log_approved`. Logbook terkunci (tidak bisa diedit lagi). | |
| 8 | **System** | Cek Dashboard Mentor & Intern. | Counter "Approved" bertambah 1 pada kedua dashboard. | |

---

## 9. LEMBAR PERSETUJUAN

Dengan ini dinyatakan bahwa sistem **Logbook Magang Digital** telah melalui proses User Acceptance Test (UAT) dengan hasil sebagai berikut:

**Kesimpulan Pengujian:**
[ ] DITERIMA (Accepted)
[ ] DITERIMA DENGAN CATATAN (Accepted with Notes)
[ ] DITOLAK (Rejected)

**Catatan Tambahan:**
_________________________________________________________________________
_________________________________________________________________________

<br>
<br>

| Diserahkan Oleh (Tim IT/Developer) | Diperiksa Oleh (QA/Tester) | Disetujui Oleh (User/Business Owner) |
| :---: | :---: | :---: |
| &nbsp;<br><br><br>_________________________ | &nbsp;<br><br><br>_________________________ | &nbsp;<br><br><br>_________________________ |
| **Nama:** ................................... | **Nama:** ................................... | **Nama:** ................................... |
| **Tanggal:** ................................ | **Tanggal:** ................................ | **Tanggal:** ................................ |

---
*Dokumen ini bersifat rahasia dan hanya untuk kepentingan internal perusahaan.*
