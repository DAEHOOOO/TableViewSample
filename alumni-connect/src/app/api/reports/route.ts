import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const reportUserSchema = z.object({
  targetUserId: z.string().uuid(),
  reason: z.enum([
    'harassment',
    'inappropriate_content',
    'spam',
    'fake_profile',
    'other'
  ]),
  details: z.string().max(500).optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validation = reportUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { targetUserId, reason, details } = validation.data

    // Prevent self-reporting
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot report yourself' },
        { status: 400 }
      )
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('app_user')
      .select('user_id')
      .eq('user_id', targetUserId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    // Check if user has already reported this user recently (within 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentReport } = await supabase
      .from('user_report')
      .select('report_id')
      .eq('reporter_id', user.id)
      .eq('target_id', targetUserId)
      .gt('created_at', oneDayAgo)
      .single()

    if (recentReport) {
      return NextResponse.json(
        { error: 'You have already reported this user recently' },
        { status: 429 }
      )
    }

    // Insert report record
    const { data: report, error: reportError } = await supabase
      .from('user_report')
      .insert({
        reporter_id: user.id,
        target_id: targetUserId,
        reason,
        details
      })
      .select()
      .single()

    if (reportError) {
      console.error('Database error:', reportError)
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      )
    }

    // Track event for analytics
    await supabase
      .from('user_event')
      .insert({
        user_id: user.id,
        event_name: 'report_user',
        event_data: {
          target_user_id: targetUserId,
          reason,
          report_id: report.report_id
        }
      })

    return NextResponse.json({ 
      success: true,
      message: 'Report submitted successfully',
      reportId: report.report_id
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    // Get user's submitted reports
    const { data: reports, error } = await supabase
      .from('user_report')
      .select(`
        report_id,
        target_id,
        reason,
        details,
        status,
        created_at
      `)
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    const formattedReports = reports?.map(report => ({
      reportId: report.report_id,
      targetUserId: report.target_id,
      targetNickname: 'Reported User',
      reason: report.reason,
      details: report.details,
      status: report.status,
      createdAt: report.created_at
    }))

    return NextResponse.json({ 
      reports: formattedReports || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}