# 🔄 API Schema Migration Guide

## 📊 Database Schema Overview

Aplikasi ini telah di-update untuk **100% sesuai dengan schema database Supabase** yang actual.

---

## 🗂️ Database Tables

### 1. **profiles** (extends auth.users)
```sql
- id: UUID (PK, references auth.users)
- username: TEXT (UNIQUE, NOT NULL) -- Primary login identifier
- full_name: TEXT
- email: TEXT
- avatar_url: TEXT
- affiliation: TEXT -- University for interns or company
- role: TEXT (intern|mentor|superuser|admin) DEFAULT 'intern'
- google_connected: BOOLEAN DEFAULT false
- google_email: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 2. **projects**
```sql
- id: UUID (PK)
- name: TEXT (NOT NULL)
- description: TEXT
- charter_url: TEXT -- Link to file in storage
- start_date: DATE
- end_date: DATE
- deadline: TIMESTAMPTZ
- created_by: UUID (references auth.users)
- created_at: TIMESTAMPTZ
```

### 3. **project_participants** (many-to-many)
```sql
- project_id: UUID (PK, references projects)
- user_id: UUID (PK, references auth.users)
- role_in_project: TEXT DEFAULT 'member' -- e.g., 'lead', 'member'
```

### 4. **tasks** (per project)
```sql
- id: UUID (PK)
- project_id: UUID (references projects)
- title: TEXT (NOT NULL)
- description: TEXT
- assigned_to: UUID (references auth.users)
- percent_of_project: NUMERIC (0-100)
- deadline: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
```

### 5. **logbook_entries** ⭐ (CORE TABLE)
```sql
- id: UUID (PK)
- user_id: UUID (NOT NULL, references auth.users) -- Intern who wrote this
- project_id: UUID (references projects)
- task_id: UUID (references tasks)
- entry_date: DATE (NOT NULL) -- YYYY-MM-DD
- start_time: TIMESTAMPTZ
- end_time: TIMESTAMPTZ
- duration_minutes: INTEGER -- Auto-calculated
- content: TEXT (NOT NULL) -- What they did
- category: TEXT -- e.g., 'daily task', 'project', 'other'
- attachments: JSONB -- Array of {bucket, path, name, size, type}
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 6. **reviews** (mentor review & ratings)
```sql
- id: UUID (PK)
- entry_id: UUID (references logbook_entries)
- reviewer_id: UUID (references auth.users) -- Mentor
- rating: SMALLINT (1-5)
- comment: TEXT
- created_at: TIMESTAMPTZ
```

### 7. **project_documents** (charters/certificates)
```sql
- id: UUID (PK)
- project_id: UUID (references projects)
- uploaded_by: UUID (references auth.users)
- doc_type: TEXT -- 'charter', 'certificate', etc
- storage_path: TEXT -- bucket/path
- file_name: TEXT
- created_at: TIMESTAMPTZ
```

### 8. **audit_log** (optional tracking)
```sql
- id: UUID (PK)
- user_id: UUID (references auth.users)
- action: TEXT
- object_type: TEXT
- object_id: TEXT
- meta: JSONB
- created_at: TIMESTAMPTZ
```

---

## ⚠️ Breaking Changes from Old Implementation

### Old Schema (INCORRECT ❌)
```typescript
interface LogbookEntry {
  id: string
  user_id: string
  date: string              // ❌ Salah: gunakan entry_date
  activity: string          // ❌ Salah: gunakan content
  start_time: string        // ❌ Salah format: HH:MM (string)
  end_time: string          // ❌ Salah format: HH:MM (string)
  duration: string          // ❌ Salah: "2h 30m" (string)
  description?: string      // ❌ Salah: digabung ke content
  weekly_logbook_name?: string | null  // ❌ Tidak ada di schema!
}
```

### New Schema (CORRECT ✅)
```typescript
interface LogbookEntry {
  id: string
  user_id: string
  project_id?: string | null          // ✅ New: link to project
  task_id?: string | null             // ✅ New: link to task
  entry_date: string                  // ✅ Correct: YYYY-MM-DD
  start_time?: string | null          // ✅ Correct: ISO timestamp
  end_time?: string | null            // ✅ Correct: ISO timestamp
  duration_minutes?: number | null    // ✅ Correct: Integer minutes
  content: string                     // ✅ Correct: Combined activity + desc
  category?: string | null            // ✅ New: categorization
  attachments?: AttachmentFile[] | null  // ✅ New: file attachments
  created_at?: string
  updated_at?: string
}
```

---

## 📦 Updated API Structure

### Location: `src/lib/api/`

```
src/lib/api/
├── types.ts          ✅ All TypeScript interfaces (100% match schema)
├── profiles.ts       ✅ Profile management API
├── logbook.ts        ✅ Logbook entries CRUD (NEW comprehensive version)
├── projects.ts       ✅ Projects API
├── tasks.ts          ✅ Tasks API
├── participants.ts   ✅ Project participants API
├── reviews.ts        ✅ Reviews API
├── documents.ts      ✅ Project documents API
├── audit.ts          ✅ Audit log API
└── index.ts          ✅ Main exports
```

---

## 🔧 Key API Changes

### 1. **Logbook Entry Creation**

#### Old Way ❌
```typescript
// OLD: Using wrong fields
await createEntry({
  date: '2025-01-22',          // ❌ Wrong field
  activity: 'Coding',          // ❌ Wrong field
  start_time: '08:00',         // ❌ Wrong format
  end_time: '17:00',           // ❌ Wrong format
  description: 'Working on...' // ❌ Separate field
})
```

#### New Way ✅
```typescript
import { createLogbookEntry } from '@/lib/api/logbook'

await createLogbookEntry({
  entry_date: '2025-01-22',                    // ✅ Correct field
  start_time: '2025-01-22T08:00:00+07:00',     // ✅ ISO timestamp
  end_time: '2025-01-22T17:00:00+07:00',       // ✅ ISO timestamp
  content: 'Coding: Working on login feature', // ✅ Combined content
  category: 'daily task',                      // ✅ Optional category
  project_id: 'uuid-here',                     // ✅ Optional project link
  task_id: 'uuid-here',                        // ✅ Optional task link
})
// duration_minutes will be auto-calculated (540 minutes = 9 hours)
```

### 2. **Duration Handling**

#### Old Way ❌
```typescript
duration: "2h 30m"  // ❌ String format
```

#### New Way ✅
```typescript
duration_minutes: 150  // ✅ Integer minutes
// Display conversion:
// 150 minutes = 2 hours 30 minutes
```

### 3. **Query/Fetch Entries**

#### Old Way ❌
```typescript
// OLD: Limited filtering
const entries = await getDraftEntries()  // Only gets drafts
```

#### New Way ✅
```typescript
import { getMyLogbookEntries, getLogbookEntries } from '@/lib/api/logbook'

// Get my entries with filters
const myEntries = await getMyLogbookEntries({
  start_date: '2025-01-01',
  end_date: '2025-01-31',
  project_id: 'uuid-here'  // Optional
})

// Get all entries (admin/mentor)
const allEntries = await getLogbookEntries({
  user_id: 'uuid-here',
  category: 'project',
  start_date: '2025-01-01',
  end_date: '2025-01-31'
})

// Get entries grouped by date
const grouped = await getLogbookEntriesByDateRange(
  '2025-01-01',
  '2025-01-31',
  'user-uuid'
)
// Returns: Map<string, LogbookEntry[]>

// Get total duration
const totalMinutes = await getTotalDurationMinutes(
  'user-uuid',
  '2025-01-01',
  '2025-01-31'
)
// Returns: 2400 (minutes) = 40 hours
```

---

## 🎯 Migration Steps for Components

### Step 1: Update Imports
```typescript
// OLD ❌
import type { LogbookEntry } from '@/types/logbook.types'
import { createEntry, getDraftEntries } from '@/services/logbookService'

// NEW ✅
import type { LogbookEntry, CreateLogbookEntryDTO } from '@/lib/api/types'
import { createLogbookEntry, getMyLogbookEntries } from '@/lib/api/logbook'
```

### Step 2: Update Form Data Structure
```typescript
// OLD ❌
const formData = {
  date: getTodayDate(),
  activity: '',
  start_time: '07:30',
  end_time: '17:00',
  description: ''
}

// NEW ✅
const formData = {
  entry_date: getTodayDate(),      // YYYY-MM-DD
  content: '',                      // Combined activity + description
  start_time: '',                   // Will be converted to ISO timestamp
  end_time: '',                     // Will be converted to ISO timestamp
  category: 'daily task',           // Optional
  project_id: null,                 // Optional
  task_id: null                     // Optional
}
```

### Step 3: Convert Time Format
```typescript
// Helper function to convert HH:MM to ISO timestamp
function timeToISO(date: string, time: string): string {
  return `${date}T${time}:00+07:00`  // Adjust timezone as needed
}

// Usage:
const dto: CreateLogbookEntryDTO = {
  entry_date: formData.entry_date,
  start_time: timeToISO(formData.entry_date, formData.start_time),
  end_time: timeToISO(formData.entry_date, formData.end_time),
  content: formData.content,
}
```

### Step 4: Display Duration
```typescript
// Helper to format duration_minutes
function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '-'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

// Usage in component:
<td>{formatDuration(entry.duration_minutes)}</td>
```

---

## 📝 Profiles API Updates

### New Fields Available:
```typescript
interface Profile {
  id: string
  username: string                     // ✅ Used for login
  full_name?: string | null
  email?: string | null
  avatar_url?: string | null
  affiliation?: string | null          // ✅ NEW: University/Company
  role: 'intern' | 'mentor' | 'superuser' | 'admin'  // ✅ NEW
  google_connected?: boolean           // ✅ NEW
  google_email?: string | null         // ✅ NEW
  created_at?: string
  updated_at?: string
}
```

### New API Functions:
```typescript
import * as ProfileAPI from '@/lib/api/profiles'

// Get all profiles (admin/mentor)
const profiles = await ProfileAPI.getAllProfiles()

// Get only interns
const interns = await ProfileAPI.getInterns()

// Check username availability (for registration)
const available = await ProfileAPI.isUsernameAvailable('newusername')
```

---

## 🚨 Important Notes

### 1. **Weekly Logbook Feature**
⚠️ Field `weekly_logbook_name` **tidak ada di schema database!**

**Solusi**:
- Gunakan `category` untuk grouping
- Atau buat tabel terpisah `weekly_reports` dengan:
  ```sql
  - id: UUID
  - name: TEXT
  - start_date: DATE
  - end_date: DATE
  - user_id: UUID
  - entry_ids: UUID[] (array of logbook_entry ids)
  ```

### 2. **Time Zones**
- Database menggunakan `TIMESTAMPTZ` (timestamp with timezone)
- Pastikan convert time string ke ISO format dengan timezone
- Contoh: `2025-01-22T08:00:00+07:00`

### 3. **Attachments**
- Stored as JSONB array
- Structure: `{bucket, path, name, size, type}`
- Upload file ke Supabase Storage terlebih dahulu
- Simpan metadata ke `attachments` field

### 4. **Duration Calculation**
- `duration_minutes` adalah integer (bukan string)
- Auto-calculated saat create/update jika `start_time` dan `end_time` ada
- 1 hour = 60 minutes
- Display format: `150 minutes` → `"2h 30m"`

---

## ✅ Migration Checklist

- [x] Update `src/lib/api/types.ts` - All interfaces match schema
- [x] Update `src/lib/api/profiles.ts` - Add new fields and functions
- [x] Rewrite `src/lib/api/logbook.ts` - Comprehensive CRUD
- [ ] Migrate `src/services/logbookService.ts` → Use new API
- [ ] Migrate `src/types/logbook.types.ts` → Use `src/lib/api/types.ts`
- [ ] Update `src/components/dashboard/ActivityForm.tsx`
- [ ] Update `src/components/dashboard/DraftEntriesTable.tsx`
- [ ] Update `src/hooks/useLogbookEntries.ts`
- [ ] Add time conversion helpers
- [ ] Add duration formatting helpers
- [ ] Remove/refactor weekly logbook feature
- [ ] Test all CRUD operations
- [ ] Test with real Supabase database

---

## 📚 References

- **API Types**: `src/lib/api/types.ts`
- **Logbook API**: `src/lib/api/logbook.ts`
- **Profiles API**: `src/lib/api/profiles.ts`
- **Database Schema**: See schema.sql or Supabase dashboard

---

**Status**: ✅ API Layer Updated (100% match with database schema)  
**Next**: Migrate components to use new API  
**Date**: 22 Oktober 2025
