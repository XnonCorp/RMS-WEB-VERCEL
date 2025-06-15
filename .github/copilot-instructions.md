<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# RMS Dashboard Project Instructions

This is a Next.js project with Supabase integration for managing customer shipment and invoice data.

## Project Structure
- **Frontend**: Next.js 14 with TypeScript, Bootstrap 5, and Tabulator.js
- **Backend**: Supabase (PostgreSQL database with auto-generated APIs)
- **Data Sync**: GitHub Actions for automated Google Sheets synchronization
- **Deployment**: Vercel (serverless)

## Key Features
- Customer data dashboard with filtering and search
- Real-time data from Supabase
- Automated sync from Google Sheets using GitHub Actions
- Export functionality (CSV)
- Responsive design with Bootstrap 5
- Advanced data tables with Tabulator.js

## Database Schema
- `shipments` table: Contains shipping data from "2025" Google Sheet
- `invoices` table: Contains invoice data from "INVOICE" Google Sheet  
- `shipment_details` view: Joins shipments and invoices data

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key for client-side
- `SUPABASE_SERVICE_KEY`: Supabase service role key for server-side operations
- `GOOGLE_SERVICE_ACCOUNT_KEY`: Google service account JSON for Sheets API
- `GOOGLE_SHEETS_ID`: The ID of the Google Sheets document

## Development Guidelines
- Use TypeScript for type safety
- Follow React best practices with hooks
- Use Bootstrap classes for styling
- Implement proper error handling
- Add loading states for better UX
- Use Supabase client for data operations
- Test sync operations thoroughly

## Deployment
- Push to GitHub repository
- Connect to Vercel
- Set environment variables in Vercel dashboard
- Configure GitHub Actions secrets for automated sync
