# RMS Dashboard - Deployment Guide

Panduan lengkap untuk deploy RMS Dashboard ke Vercel dengan otomatisasi sync Google Sheets.

## 🏗️ Arsitektur Sistem

- **Frontend**: Next.js 15 dengan TypeScript
- **Database**: Supabase (PostgreSQL)
- **Sync**: Google Sheets API dengan GitHub Actions
- **Deployment**: Vercel (Serverless)

## � Persiapan

### 1. Persyaratan
- Node.js 18+ 
- Akun GitHub
- Akun Vercel
- Akun Supabase
- Akun Google Cloud (untuk Sheets API)

### 2. Clone Repository
```bash
git clone https://github.com/masteradminrms/rms_web.git
cd rms_web
npm install
```

## 🗄️ Setup Database (Supabase)

### 1. Buat Project Supabase
1. Buka https://supabase.com
2. Klik "New Project"
3. Isi nama project: `rms-dashboard`
4. Pilih region terdekat
5. Buat password yang kuat

### 2. Setup Database Schema
1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste isi file `database/complete-setup.sql`
3. Klik "Run" untuk membuat semua tabel dan view

### 3. Dapatkan Credentials
1. Buka Settings → API
2. Catat:
   - `Project URL` (untuk `NEXT_PUBLIC_SUPABASE_URL`)
   - `anon public` key (untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` key (untuk `SUPABASE_SERVICE_KEY`)

## 🔑 Setup Google Sheets API

### 1. Buat Service Account
1. Buka https://console.cloud.google.com
2. Buat project baru atau pilih existing
3. Enable "Google Sheets API"
4. Buka "Credentials" → "Create Credentials" → "Service Account"
5. Isi nama: `rms-sheets-sync`
6. Buat key (JSON) dan download

### 2. Share Google Sheets
1. Buka Google Sheets yang berisi data
2. Klik "Share" 
3. Tambahkan email service account dengan akses "Editor"
4. Catat ID sheets dari URL (bagian setelah `/spreadsheets/d/`)

### 3. Persiapkan Environment Variables
Convert JSON service account ke string untuk environment:
```bash
# Windows PowerShell
$json = Get-Content "path/to/service-account.json" | ConvertTo-Json -Compress
Write-Host $json
```

## 🚀 Deploy ke Vercel

### 1. Connect Repository
1. Buka https://vercel.com
2. Klik "New Project"
3. Import dari GitHub: `masteradminrms/rms_web`
4. Framework: Next.js (auto-detect)

### 2. Configure Environment Variables
Di Vercel Dashboard → Settings → Environment Variables, tambahkan:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_SHEETS_ID_2025=1abc123def456ghi789jkl
GOOGLE_SHEETS_ID_INVOICE=1xyz987uvw654rst321opq
```

### 3. Deploy
1. Klik "Deploy"
2. Tunggu proses build selesai
3. Akses URL yang diberikan

## ⚙️ Setup Automated Sync

### 1. Configure GitHub Secrets
Di GitHub Repository → Settings → Secrets and Variables → Actions:

```
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_SHEETS_ID_2025=1abc123def456ghi789jkl
GOOGLE_SHEETS_ID_INVOICE=1xyz987uvw654rst321opq
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

### 2. Verifikasi Workflow
1. GitHub Actions akan sync otomatis setiap 4 jam
2. Untuk test manual: Actions → "Smart Sync Google Sheets to Supabase" → "Run workflow"

## 🔧 Script Management

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build production
npm run start           # Start production server

# Database
npm run setup-db        # Setup database tables
npm run test-connection # Test database connection
npm run cleanup-db      # Clean database (DANGER!)

# Data Sync
npm run sync            # Smart sync (recommended)
npm run sync-optimized  # Optimized sync (faster)
npm run sync-original   # Original sync (full)
```

### Manual Sync (Local)
```bash
# Set environment variables terlebih dahulu
export SUPABASE_SERVICE_KEY="your-key"
export GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
export GOOGLE_SHEETS_ID_2025="your-sheet-id"
export GOOGLE_SHEETS_ID_INVOICE="your-sheet-id"
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"

# Run sync
npm run sync
```

## 🎯 Fitur Dashboard

### 1. Data Management
- **Real-time data** dari Supabase
- **Advanced filtering** berdasarkan customer, tanggal, dll
- **Search function** untuk semua field
- **Export CSV** untuk data yang difilter

### 2. Performance
- **Smart sync** - hanya sync data yang berubah
- **Pagination** untuk handling data besar
- **Caching** untuk performa optimal
- **Lazy loading** untuk komponen berat

### 3. UI/UX
- **Responsive design** (mobile-friendly)
- **Modern interface** dengan Tailwind CSS
- **Loading states** untuk UX yang baik
- **Error handling** yang informatif

## � Troubleshooting

### Build Errors

**Error: `supabaseUrl is required`**
```bash
# Pastikan environment variables sudah diset di Vercel
# Cek di Vercel Dashboard → Settings → Environment Variables
```

**Error: `Cannot find module '@supabase/supabase-js'`**
```bash
npm install @supabase/supabase-js
```

### Sync Issues

**Error: `Authentication failed`**
```bash
# Pastikan service account key valid dan sheets sudah di-share
# Cek format JSON dalam environment variable
```

**Error: `No data found in sheets`**
```bash
# Pastikan sheet name dan ID benar
# Cek data di Google Sheets tidak kosong
```

### Performance Issues

**Dashboard loading lambat**
```bash
# Cek koneksi Supabase
npm run test-connection

# Pastikan index database sudah optimal
# Lihat query performance di Supabase Dashboard
```

## 📊 Monitoring

### 1. Vercel Analytics
- Buka Vercel Dashboard → Analytics
- Monitor performance, errors, dan usage

### 2. Supabase Monitoring
- Buka Supabase Dashboard → Logs
- Monitor database queries dan errors

### 3. GitHub Actions
- Buka GitHub → Actions
- Monitor sync job success/failure

## 🔄 Maintenance

### Regular Tasks
1. **Weekly**: Cek sync logs di GitHub Actions
2. **Monthly**: Review database performance di Supabase
3. **Quarterly**: Update dependencies: `npm audit fix`

### Updates
```bash
# Update dependencies
npm update

# Update Node.js version di GitHub Actions
# Edit .github/workflows/sync-data.yml jika perlu

# Re-deploy di Vercel
git push origin main
```

## 📝 Structure Overview

```
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main dashboard
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client
│   │   └── utils.ts          # Utility functions
│   └── types/
│       └── index.ts          # TypeScript types
├── scripts/
│   ├── sync-smart.js         # Smart sync logic
│   └── setup-db.js           # Database setup
├── database/
│   ├── schema.sql            # Database schema
│   └── complete-setup.sql    # Complete setup script
├── .github/workflows/
│   └── sync-data.yml         # GitHub Actions workflow
└── package.json              # Dependencies & scripts
```

## 🎉 Success!

Setelah semua step selesai, Anda akan memiliki:

✅ **Dashboard** yang berjalan di Vercel  
✅ **Database** yang tersync dengan Google Sheets  
✅ **Otomatisasi** sync setiap 4 jam  
✅ **Monitoring** penuh di semua platform  

Dashboard siap digunakan untuk manage data shipment dan invoice RMS!

---

**Need Help?** 
- Check GitHub Issues
- Review logs di Vercel/Supabase/GitHub Actions
- Ensure all environment variables are correctly set

## 🔧 Fix Build Error

Jika mengalami error build seperti `supabaseUrl is required`, ikuti langkah berikut:

### 1. Update Supabase Client
File `src/lib/supabase.ts` perlu diupdate untuk handle missing environment variables:

```typescript
import { createClient } from '@supabase/supabase-js'

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Create Supabase client with error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
```

### 2. Update Dashboard Page
File `src/app/page.tsx` perlu error handling:

```typescript
// Di bagian atas component
const [error, setError] = useState<string | null>(null)

// Di fetchData function
if (!supabase) {
  setError('Database tidak tersedia. Silakan konfigurasi environment variables.')
  setLoading(false)
  return
}

// Di return JSX
if (error) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-red-500">{error}</p>
      </div>
    </div>
  )
}
```

### 3. Redeploy
Setelah update kode, push ke GitHub dan Vercel akan auto-deploy:

```bash
git add .
git commit -m "Fix build error - handle missing environment variables"
git push origin main
```3. ✅ Build akan berhasil karena environment variables sudah tersedia
4. Click link untuk membuka website Anda 🎉

**📝 Jika sudah terlanjur deploy tanpa environment variables:**
1. Buka project di Vercel dashboard
2. **Settings** → **Environment Variables** → add variables di atas  
3. **Deployments** → **Redeploy** deployment terakhir
4. Tunggu build ulang selesaiub account  
- ✅ Supabase account
- ✅ Vercel account

## 🗃️ Step 1: Setup Database (Supabase)

### 1.1 Create Supabase Project
1. Buka [supabase.com](https://supabase.com)
2. Click **"Start your project"** → **"New project"**
3. Pilih organization & beri nama project: `rms-web`
4. Tunggu database setup selesai (~2 menit)

### 1.2 Setup Database Schema
1. Di Supabase dashboard, buka **SQL Editor**
2. Copy semua code dari file `database/schema.sql`
3. Paste ke SQL Editor dan click **"Run"**
4. Verifikasi tables berhasil dibuat di **Table Editor**

### 1.3 Get API Keys
1. Buka **Settings** → **API**
2. Copy dan simpan:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`
   - **service_role**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...` ⚠️ **SECRET**

### 1.4 Security Setup (PENTING!)
Database schema sudah dilengkapi dengan Row Level Security (RLS) policies:

```sql
-- Tables sudah enable RLS
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_details ENABLE ROW LEVEL SECURITY;

-- Policy untuk read-only access (aman untuk anon key)
CREATE POLICY "Public read access" ON shipments FOR SELECT USING (true);
CREATE POLICY "Public read access" ON invoices FOR SELECT USING (true);
CREATE POLICY "Public read access" ON shipment_details FOR SELECT USING (true);
```

**🔒 Mengapa AMAN menggunakan `NEXT_PUBLIC_SUPABASE_ANON_KEY`:**
- ✅ **RLS enabled**: Data dilindungi oleh Row Level Security policies
- ✅ **Read-only**: Anon key hanya bisa SELECT, tidak bisa INSERT/UPDATE/DELETE
- ✅ **Public by design**: Supabase anon key memang dirancang untuk client-side
- ✅ **No sensitive data exposed**: Semua data sudah dipublikasikan via dashboard

⚠️ **JANGAN PERNAH** gunakan `service_role` key di frontend!

## 📊 Step 2: Setup Google Sheets

### 2.1 Prepare Your Google Sheets
1. Buka Google Sheets Anda yang berisi data
2. Pastikan ada 2 sheet dengan nama:
   - **"2025"** - untuk data shipments
   - **"INVOICE"** - untuk data invoices

**📋 Contoh Sheets yang Digunakan:**
- **Sheet 1 (2025)**: https://docs.google.com/spreadsheets/d/1AXQx6Y7wLlVCRHV2VxMY5qx_XBoamvBTO7hIfifzmKY/edit?gid=991457949#gid=991457949
  - Data dimulai dari **baris ke-3**
  - Kolom A ("No.") diabaikan, data diambil dari kolom B-W
  
- **Sheet 2 (INVOICE)**: https://docs.google.com/spreadsheets/d/1QyM33Xrdqld_BARb2-AHj0o2ODEu4ErPv_ofC_NHuMg/edit?gid=1727765235#gid=1727765235
  - Data dimulai dari **baris ke-5**
  - Data diambil dari kolom B-I

### 2.2 Format Data
**Sheet "2025" columns (Data starts from row 3, kolom A diabaikan):**
```
B: Pick Up | C: No SJ | D: No SP | E: Customer | F: Tujuan | G: VIA | 
H: QTY | I: Berat | J: Jenis Barang | K: Dikirim Oleh | L: Armada | M: OPS |
N: Data armada | O: Berangkat | P: ETA | Q: Diterima | R: Penerima | S: QC |
T: Waktu Diterima | U: No SMU/BL | V: No Flight/Countr | W: DO Balik
```

**Sheet "INVOICE" columns (Data starts from row 5):**
```
B: No. Invoice | C: Tanggal Invoice | D: Nama Customer | E: Tujuan | 
F: No. SP | G: Tanggal Pick Up | H: Keterangan | I: No. STT
```

⚠️ **Important**: 
- **Sheet "2025"**: Data dimulai dari **baris ke-3** (row 3), **kolom A ("No.") diabaikan**
- **Sheet "INVOICE"**: Data dimulai dari **baris ke-5** (row 5)
- **No SP** di sheet "2025" (kolom D) harus sama dengan **No SP** di sheet "INVOICE" (kolom F) untuk join data
- Script sync akan otomatis mengambil data dari baris yang benar sesuai konfigurasi

**🔗 Data Relationship:**
```
Sheet "2025" (Shipments) ←→ Sheet "INVOICE" (Invoices)
      ↓                           ↓
   Kolom D (No SP)  =  Kolom F (No SP)
```

### 2.3 Get Sheets ID
Dari URL Google Sheets Anda:
```
https://docs.google.com/spreadsheets/d/1ABC123DEF456GHI789/edit
                                    ^^^^^^^^^^^^^^^^^^
                                    Ini Sheets ID Anda
```

**📝 Contoh untuk sheets di atas:**
- **Sheet "2025"**: ID = `1AXQx6Y7wLlVCRHV2VxMY5qx_XBoamvBTO7hIfifzmKY`
- **Sheet "INVOICE"**: ID = `1QyM33Xrdqld_BARb2-AHj0o2ODEu4ErPv_ofC_NHuMg`

⚠️ **PENTING**: Jika Anda menggunakan sheets berbeda, ganti dengan ID sheets Anda sendiri di GitHub Secrets!

### 2.4 Create Google Service Account

**Opsi A: Service Account (Recommended)**
1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Create new project atau pilih existing
3. **APIs & Services** → **Enable APIs** → cari "Google Sheets API" → Enable
4. **APIs & Services** → **Credentials** → **Create Credentials** → **Service Account**
5. Beri nama: `rms-sync-service`
6. **Create Key** → **JSON** → Download file JSON

**Opsi B: Personal Account (Jika read-only access)**
1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: `rms-sheets-reader`
3. **APIs & Services** → **Enable APIs** → cari "Google Sheets API" → Enable
4. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Application type: **Desktop application**
6. Download JSON credentials
7. Gunakan Google OAuth flow untuk mendapatkan refresh token

### 2.5 Share Sheets with Service Account

**Jika menggunakan Service Account:**
1. Buka file JSON yang didownload
2. Copy email dari field `"client_email"`
3. Di Google Sheets, click **Share** → paste email service account
4. Set permission: **Viewer** → **Send**

**Jika menggunakan Personal Account:**
- Tidak perlu share tambahan, karena email Anda sudah punya akses read-only
- Pastikan email yang digunakan untuk OAuth sama dengan email yang punya akses ke sheets

## 🐙 Step 3: Setup GitHub Repository

### 3.1 Upload Project ke GitHub
**Jika belum punya repository GitHub:**
1. Buka [github.com](https://github.com) dan login
2. Click **"New"** atau **"+"** → **"New repository"**
3. Nama repository: `RMS-WEB` 
4. Set **Public** atau **Private** (terserah Anda)
5. **JANGAN** centang "Add a README file" (sudah ada)
6. Click **"Create repository"**

**Upload project dari komputer Anda:**
1. Download/copy semua file dari folder `RMS-WEB` ini
2. Zip semua file dan folder
3. Di repository GitHub yang baru dibuat:
   - Click **"uploading an existing file"**
   - Drag & drop zip file atau pilih file
   - **Commit** changes

**Alternative (jika familiar dengan Git):**
```bash
git init
git add .
git commit -m "Initial RMS Dashboard setup"
git remote add origin https://github.com/USERNAME/RMS-WEB.git
git push -u origin main
```

### 3.2 Add GitHub Secrets (PENTING!)
1. Di repository GitHub Anda, click **Settings** (tab paling kanan)
2. Sidebar kiri → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** untuk setiap secret berikut:

**Required Secrets (6 secrets wajib untuk 2 sheets):**

**Secret 1 & 2 (Google Sheets IDs):**
```
Name: GOOGLE_SHEETS_ID_2025
Value: 1AXQx6Y7wLlVCRHV2VxMY5qx_XBoamvBTO7hIfifzmKY
```
*ID untuk sheet "2025" (shipments data)*

```
Name: GOOGLE_SHEETS_ID_INVOICE  
Value: 1QyM33Xrdqld_BARb2-AHj0o2ODEu4ErPv_ofC_NHuMg
```
*ID untuk sheet "INVOICE" (invoice data)*

⚠️ **Jika menggunakan sheets berbeda**, ganti dengan ID sheets Anda:
- Ambil ID dari URL: `https://docs.google.com/spreadsheets/d/[ID_SHEETS_ANDA]/edit`
- Pastikan kedua sheets bisa diakses oleh service account yang sama

**Secret 3:**
```
Name: GOOGLE_SERVICE_ACCOUNT_KEY  
Value: [Seluruh isi file JSON service account]
```
*Copy paste SELURUH isi file JSON yang didownload dari Google Cloud Console, termasuk kurung kurawal {}*

**Secret 4:**
```
Name: SUPABASE_URL
Value: https://xxxxx.supabase.co
```
*URL project Supabase Anda dari dashboard*

**Secret 5:**
```
Name: SUPABASE_SERVICE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6...
```
*Service role key dari Supabase dashboard (bukan anon key!)*

**Secret 6:**
```
Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6...
```
*Anonymous key dari Supabase dashboard untuk client-side access*

### 3.3 Verifikasi Secrets
Setelah menambahkan semua secrets:
1. Pastikan ada **6 secrets** di list:
   - `GOOGLE_SHEETS_ID_2025`
   - `GOOGLE_SHEETS_ID_INVOICE`
   - `GOOGLE_SERVICE_ACCOUNT_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `SUPABASE_ANON_KEY`
2. **Nama secrets harus PERSIS** seperti di atas (case-sensitive)
3. **Value tidak boleh** ada spasi di awal/akhir

**Screenshot lokasi secrets:**
```
Repository → Settings → Secrets and variables → Actions → Repository secrets
```

## 🚀 Step 4: Deploy to Vercel

### 4.1 Connect to Vercel
1. Buka [vercel.com](https://vercel.com)
2. Login dengan GitHub account
3. Click **"New Project"**
4. **Import** repository `RMS-WEB` Anda
5. **JANGAN** deploy dulu - set environment variables terlebih dahulu

### 4.2 Add Environment Variables (SEBELUM Deploy)
1. Di halaman import project, scroll ke bawah ke section **"Environment Variables"**
2. Atau klik **"Configure Project"** sebelum deploy
3. Add variables berikut **sebagai Environment Variables, BUKAN Secrets**:

```bash
# Variable Name: NEXT_PUBLIC_SUPABASE_URL
# Value: https://xxx.supabase.co (dari step 1.3)

# Variable Name: NEXT_PUBLIC_SUPABASE_ANON_KEY  
# Value: eyJhbGciOiJIUzI... (anon key dari step 1.3)
```

**🔧 PENTING - Perbedaan Environment Variables vs Secrets:**
- ✅ **Environment Variables**: Diset langsung dengan nilai (yang kita gunakan)
- ❌ **Secrets**: Menggunakan format `@secret-name` (JANGAN gunakan ini)
- 📝 **Lokasi**: Project Settings → Environment Variables → bukan di "Secrets"

**🔒 Catatan Keamanan:**
- ✅ **AMAN**: `NEXT_PUBLIC_` variables akan terlihat di browser (client-side)
- ✅ **SUPABASE_URL**: Dirancang untuk akses publik
- ✅ **SUPABASE_ANON_KEY**: Key khusus untuk client-side, dibatasi oleh RLS policies
- ❌ **JANGAN** gunakan `SUPABASE_SERVICE_KEY` dengan prefix `NEXT_PUBLIC_` (berbahaya!)
- 🛡️ **Keamanan data** dijamin oleh Row Level Security (RLS) di Supabase, bukan key

### 4.3 Deploy
1. Setelah environment variables sudah diset, click **"Deploy"**
2. Tunggu build selesai (~2 menit)
3. ✅ Build akan berhasil karena environment variables sudah tersedia
3. Click link untuk membuka website Anda 🎉

## 🔄 Step 5: Test Automated Sync

### 5.1 Manual Trigger Test
1. Di GitHub repository, buka **Actions** tab
2. Click workflow **"Sync Google Sheets to Supabase"**
3. Click **"Run workflow"** → **"Run workflow"**
4. Monitor progress di logs

### 5.2 Verify Data
1. Buka website Vercel Anda
2. Lihat apakah data dari Google Sheets sudah muncul
3. Check statistics cards menunjukkan angka yang benar

### 5.3 Schedule Settings
Sync otomatis sudah diatur untuk jalan setiap hari jam 2 pagi UTC.
Untuk mengubah jadwal, edit file `.github/workflows/sync-data.yml`:

```yaml
schedule:
  - cron: '0 2 * * *'  # Daily at 2 AM UTC
  # - cron: '0 */6 * * *'  # Every 6 hours  
  # - cron: '0 8 * * 1'   # Monday at 8 AM
```

## ✅ Step 6: Verification Checklist

Pastikan semua bekerja dengan baik:

- [ ] **Supabase**: Tables created, data visible in Table Editor
- [ ] **Google Sheets**: Service account has access, data format correct
- [ ] **GitHub Actions**: Sync workflow runs successfully  
- [ ] **Vercel**: Website deployed, environment variables set
- [ ] **Data Flow**: Data from Sheets → Supabase → Website
- [ ] **Dashboard**: Statistics cards show correct numbers
- [ ] **Filters**: Customer filter, date range, search working
- [ ] **Export**: CSV export downloads filtered data

## 🎯 Common Issues & Solutions

### ❌ "Failed to fetch data"
**Cause**: Supabase connection issue
**Solution**: 
- Check environment variables in Vercel
- Verify API keys are correct
- Check RLS policies in Supabase

### ❌ "Sync failed" in GitHub Actions
**Cause**: Google Sheets access or Supabase connection
**Solution**:
- Check GitHub secrets are set correctly
- Verify service account has Sheets access
- Check Sheets ID is correct

### ❌ "No data found" in dashboard
**Cause**: Data not synced or wrong table format
**Solution**:
- Run manual sync from GitHub Actions
- Check database schema matches
- Verify data format in Google Sheets

### ❌ "Dependencies lock file is not found" in GitHub Actions
**Cause**: GitHub Actions mencoba menggunakan npm cache tapi tidak ada package-lock.json
**Solution**:
- File workflow sudah diperbaiki - menghapus `cache: 'npm'` 
- Workflow akan install dependencies tanpa caching
- Tidak mempengaruhi functionality, hanya sedikit lebih lambat

### ❌ "Synchronous scripts should not be used"
**Cause**: Bootstrap dan Tabulator.js scripts dimuat secara synchronous
**Solution**:
- Script tags sudah diperbaiki dengan menambahkan `async` attribute
- Commit dan push perubahan terbaru ke GitHub
- Redeploy di Vercel untuk menggunakan kode terbaru

### ❌ "Module not found: Can't resolve sync-sheets"
**Cause**: API route mencoba import Node.js script yang tidak kompatibel dengan Edge runtime
**Solution**: 
- File API route sudah dihapus (tidak diperlukan)
- Sync dilakukan via GitHub Actions, bukan API route
- Jika masih ada file `src/app/api/sync/route.ts`, hapus folder `src/app/api/sync/`

### ❌ "Invalid next.config.js options: appDir"
**Cause**: Opsi `appDir` sudah deprecated di Next.js 14
**Solution**:
- File `next.config.js` sudah diperbaiki
- Opsi `experimental.appDir` sudah dihapus
- Environment variables sudah disesuaikan dengan `NEXT_PUBLIC_` prefix

## 🎉 Success!

Jika semua steps berhasil, Anda sekarang punya:

✅ **Fully automated system** yang sync data dari Google Sheets  
✅ **Real-time dashboard** dengan filtering dan export  
✅ **Zero maintenance** - semua berjalan otomatis di cloud  
✅ **Scalable architecture** - handle 100k+ rows dengan mudah  
✅ **Mobile responsive** - bisa diakses dari mana saja  

**🌐 Your Live Dashboard:** `https://your-project.vercel.app`  
**📊 Automated Sync:** Every day at 2 AM UTC  
**🔄 Manual Sync:** GitHub Actions → Run workflow  

---

## 📞 Need Help?

1. **GitHub Actions Logs**: Check sync process details
2. **Vercel Logs**: Check deployment and runtime errors  
3. **Supabase Logs**: Check database queries and errors
4. **Browser Console**: Check frontend JavaScript errors

**Happy data managing! 🚀**
