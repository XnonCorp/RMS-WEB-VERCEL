import { NextRequest, NextResponse } from 'next/server'
import { syncGoogleSheetsToSupabase } from '../../../scripts/sync-sheets'

export async function POST(request: NextRequest) {
  try {
    // Check if all required environment variables are present
    const requiredEnvVars = [
      'GOOGLE_SERVICE_ACCOUNT_KEY',
      'GOOGLE_SHEETS_ID', 
      'SUPABASE_URL',
      'SUPABASE_SERVICE_KEY'
    ]
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing environment variables', 
          missing: missingEnvVars 
        },
        { status: 500 }
      )
    }

    // Run the sync
    console.log('Starting manual sync...')
    const result = await syncGoogleSheetsToSupabase()
    
    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      ...result
    })
    
  } catch (error) {
    console.error('Sync failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Sync failed', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Manual sync endpoint',
    usage: 'Send POST request to trigger sync',
    status: 'ready'
  })
}
