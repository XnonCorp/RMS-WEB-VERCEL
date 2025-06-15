# RMS Dashboard 🚀

Customer Data Management System with automated Google Sheets synchronization to Supabase database.

## ✨ Features

- **📊 Real-time Dashboard** - View shipment and invoice data with interactive filters
- **🔄 Automated Sync** - GitHub Actions automatically sync data from Google Sheets daily
- **🎯 Advanced Filtering** - Filter by customer, date range, and global search
- **📤 Export Functionality** - Export filtered data to CSV
- **📱 Responsive Design** - Bootstrap 5 responsive UI that works on all devices
- **⚡ Fast Performance** - Next.js with Supabase for optimal speed

## 🏗️ Architecture

```
Google Sheets → GitHub Actions → Supabase → Next.js Frontend → Vercel
```

- **Frontend**: Next.js 14 + TypeScript + Bootstrap 5
- **Database**: Supabase (PostgreSQL)
- **Sync**: GitHub Actions (daily automated sync)
- **Hosting**: Vercel (serverless deployment)

## 📋 Prerequisites

### 1. Supabase Setup
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Run the SQL in `database/schema.sql` in Supabase SQL Editor
4. Get your project URL and API keys

### 2. Google Sheets Setup
1. Create Google Cloud project
2. Enable Google Sheets API
3. Create Service Account and download JSON key
4. Share your Google Sheets with the service account email
5. Note your Google Sheets ID from the URL

### 3. GitHub Setup
1. Fork this repository
2. Add the following secrets in GitHub Settings → Secrets:
   - `GOOGLE_SERVICE_ACCOUNT_KEY`: Your service account JSON (as string)
   - `GOOGLE_SHEETS_ID_2025`: Your "2025" sheet document ID
   - `GOOGLE_SHEETS_ID_INVOICE`: Your "INVOICE" sheet document ID
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key

## 🚀 Deployment (100% Cloud-based)

### Deploy to Vercel
1. Connect your GitHub repository to [Vercel](https://vercel.com)
2. Add environment variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Deploy! 🎉

### Enable Automated Sync
The GitHub Actions workflow will automatically:
- Run every day at 2 AM UTC
- Sync data from your Google Sheets to Supabase
- Handle data validation and error logging

You can also trigger sync manually from GitHub Actions tab.

## 📊 Google Sheets Format

### Sheet "2025" (Shipments)
**Data starts from row 3, columns B to W (22 columns):**
| Col | Header | Description |
|-----|--------|-------------|
| B | Pick Up | Pickup date |
| C | No SJ | Surat Jalan number |
| D | No SP | Surat Perintah number (Primary Key) |
| E | Customer | Customer name |
| F | Tujuan | Destination |
| G | VIA | Shipping method |
| H | QTY | Quantity |
| I | Berat | Weight |
| J | Jenis Barang | Item type |
| K | Dikirim Oleh | Sent by |
| L | Armada | Fleet/Vehicle |
| M | OPS | Operations |
| N | Data armada | Fleet data |
| O | Berangkat | Departure date |
| P | ETA | Estimated arrival |
| Q | Diterima | Received date |
| R | Penerima | Receiver |
| S | QC | Quality control |
| T | Waktu Diterima | Received time |
| U | No SMU / No BL | AWB/BL number |
| V | No Flight / No Countr | Flight/Counter number |
| W | DO Balik | Return DO |

**Note**: Kolom A ("No.") diabaikan karena hanya nomor urut.

### Sheet "INVOICE" (Invoices)
**Data starts from row 5, columns B to I:**
| Col | Header | Description |
|-----|--------|-------------|
| B | No. Invoice | Invoice number |
| C | Tanggal Invoice | Invoice date |
| D | Nama Customer | Customer name |
| E | Tujuan | Destination |
| F | No. SP | Surat Perintah number (Foreign Key) |
| G | Tanggal Pick Up | Pickup date |
| H | Keterangan | Description/Notes |
| I | No. STT | STT number |

## 🛠️ Local Development (Optional)

If you want to run locally:

```bash
# Clone repository
git clone <your-repo-url>
cd rms-web

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Add your environment variables to .env.local

# Run development server
npm run dev

# Manual sync (for testing)
npm run sync-sheets
```

## 📈 Usage

1. **Dashboard**: View all your data with statistics cards
2. **Filters**: Use customer dropdown, date range, and search
3. **Export**: Click "Export CSV" to download filtered data
4. **Refresh**: Click refresh button to get latest data
5. **Automated Sync**: Data syncs automatically every day

## 🔧 Configuration

### Environment Variables
```bash
# Required for frontend
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required for sync (GitHub Secrets)
SUPABASE_SERVICE_KEY=your-service-key
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_SHEETS_ID_2025=your-sheets-id-for-2025-sheet
GOOGLE_SHEETS_ID_INVOICE=your-sheets-id-for-invoice-sheet
```

### Database Schema
The system automatically creates:
- `shipments` table for shipping data
- `invoices` table for invoice data  
- `shipment_details` view for joined data
- Proper indexes for performance
- Row Level Security for data protection

## 🔄 Sync Process

1. **GitHub Actions** runs on schedule or manual trigger
2. **Fetches data** from both Google Sheets
3. **Validates and cleans** data (handles dates, numbers, empty values)
4. **Upserts to Supabase** (insert new, update existing)
5. **Logs results** for monitoring

## 📱 Mobile Responsive

The dashboard is fully responsive and works great on:
- 📱 Mobile phones
- 📱 Tablets  
- 💻 Laptops
- 🖥️ Desktop computers

## 🎨 UI Components

- **Statistics Cards**: Show key metrics at a glance
- **Advanced Filters**: Customer dropdown, date range, search
- **Data Table**: Sortable, searchable table with Bootstrap styling
- **Export Button**: One-click CSV export
- **Loading States**: Smooth loading indicators
- **Error Handling**: Friendly error messages

## 🚨 Troubleshooting

### Sync Issues
- Check GitHub Actions logs
- Verify Google Sheets permissions
- Confirm environment variables are set correctly

### Display Issues  
- Check Supabase connection
- Verify API keys in Vercel dashboard
- Check browser console for errors

### Data Issues
- Ensure Google Sheets format matches expected columns
- Check for data validation errors in sync logs
- Verify date formats are consistent

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Support

For support:
1. Check the logs in GitHub Actions
2. Review Vercel deployment logs
3. Check Supabase dashboard for database issues
4. Create an issue in this repository

---

**🎉 Ready to deploy! No local setup required - everything runs in the cloud!**
#
