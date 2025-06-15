# 🚀 Deployment Guide - 100% Cloud Setup

Panduan lengkap untuk deploy RMS Dashboard tanpa setup lokal sama sekali.

## 📋 Prerequisites

Sebelum mulai, pastikan Anda punya:
- ✅ Google account (untuk Google Sheets & Cloud Console)
- ✅ GitHub account  
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

## 📊 Step 2: Setup Google Sheets

### 2.1 Prepare Your Google Sheets
1. Buka Google Sheets Anda yang berisi data
2. Pastikan ada 2 sheet dengan nama:
   - **"2025"** - untuk data shipments
   - **"INVOICE"** - untuk data invoices

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
- Sheet "2025": Data dimulai dari **baris ke-3** (row 3), **kolom A ("No.") diabaikan**
- Sheet "INVOICE": Data dimulai dari **baris ke-5** (row 5)
- No SP di sheet "2025" (kolom D) harus sama dengan No SP di sheet "INVOICE" (kolom F)

### 2.3 Get Sheets ID
Dari URL Google Sheets Anda:
```
https://docs.google.com/spreadsheets/d/1ABC123DEF456GHI789/edit
                                    ^^^^^^^^^^^^^^^^^^
                                    Ini Sheets ID Anda
```

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

**Required Secrets (4 secrets wajib):**

**Secret 1:**
```
Name: GOOGLE_SHEETS_ID
Value: [ID dari URL Google Sheets Anda]
```
*Contoh: Jika URL sheets Anda `https://docs.google.com/spreadsheets/d/1ABC123DEF456GHI789/edit`, maka ID-nya adalah `1ABC123DEF456GHI789`*

**Secret 2:**
```
Name: GOOGLE_SERVICE_ACCOUNT_KEY  
Value: [Seluruh isi file JSON service account]
```
*Copy paste SELURUH isi file JSON yang didownload dari Google Cloud Console, termasuk kurung kurawal {}*

**Secret 3:**
```
Name: SUPABASE_URL
Value: https://xxxxx.supabase.co
```
*URL project Supabase Anda dari dashboard*

**Secret 4:**
```
Name: SUPABASE_SERVICE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6...
```
*Service role key dari Supabase dashboard (bukan anon key!)*

### 3.3 Verifikasi Secrets
Setelah menambahkan semua secrets:
1. Pastikan ada **4 secrets** di list
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
5. **Deploy** (akan gagal pertama kali, ini normal)

### 4.2 Add Environment Variables
1. Di Vercel dashboard, buka project Anda
2. **Settings** → **Environment Variables**
3. Add variables berikut:

```bash
# Variable Name: NEXT_PUBLIC_SUPABASE_URL
# Value: https://xxx.supabase.co (dari step 1.3)

# Variable Name: NEXT_PUBLIC_SUPABASE_ANON_KEY  
# Value: eyJhbGciOiJIUzI... (anon key dari step 1.3)
```

### 4.3 Redeploy
1. **Deployments** → click **"Redeploy"** pada deployment terakhir
2. Tunggu build selesai (~2 menit)
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

### ❌ "Build failed" in Vercel
**Cause**: Missing environment variables
**Solution**:
- Add all required environment variables
- Redeploy after adding variables

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
