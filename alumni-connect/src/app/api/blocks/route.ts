import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const blockUserSchema = z.object({
  targetUserId: z.string().uuid()
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
    const validation = blockUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { targetUserId } = validation.data

    // Prevent self-blocking
    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: 'Cannot block yourself' },
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

    // Insert block record (will ignore if already exists due to primary key)
    const { error: blockError } = await supabase
      .from('user_block')
      .upsert({
        blocker_id: user.id,
        blocked_id: targetUserId
      })

    if (blockError) {
      console.error('Database error:', blockError)
      return NextResponse.json(
        { error: 'Failed to block user' },
        { status: 500 }
      )
    }

    // Track event for analytics
    await supabase
      .from('user_event')
      .insert({
        user_id: user.id,
        event_name: 'block_user',
        event_data: {
          target_user_id: targetUserId
        }
      })

    return NextResponse.json({ 
      success: true,
      message: 'User blocked successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    // Get targetUserId from query params
    const searchParams = request.nextUrl.searchParams
    const targetUserId = searchParams.get('targetUserId')

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Missing targetUserId parameter' },
        { status: 400 }
      )
    }

    // Remove block record
    const { error: unblockError } = await supabase
      .from('user_block')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', targetUserId)

    if (unblockError) {
      console.error('Database error:', unblockError)
      return NextResponse.json(
        { error: 'Failed to unblock user' },
        { status: 500 }
      )
    }

    // Track event for analytics
    await supabase
      .from('user_event')
      .insert({
        user_id: user.id,
        event_name: 'unblock_user',
        event_data: {
          target_user_id: targetUserId
        }
      })

    return NextResponse.json({ 
      success: true,
      message: 'User unblocked successfully'
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

    // Get user's blocked users
    const { data: blocks, error } = await supabase
      .from('user_block')
      .select(`
        blocked_id,
        created_at
      `)
      .eq('blocker_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch blocked users' },
        { status: 500 }
      )
    }

    const formattedBlocks = blocks?.map(block => ({
      userId: block.blocked_id,
      nickname: 'Blocked User',
      blockedAt: block.created_at
    }))

    return NextResponse.json({ 
      blockedUsers: formattedBlocks || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}