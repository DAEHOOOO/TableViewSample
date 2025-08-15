import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createRoomSchema = z.object({
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
    const validation = createRoomSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { targetUserId } = validation.data

    // Check if target user exists and is not blocked
    const { data: targetUser, error: userError } = await supabase
      .from('app_user')
      .select('user_id, is_active')
      .eq('user_id', targetUserId)
      .single()

    if (userError || !targetUser?.is_active) {
      return NextResponse.json(
        { error: 'Target user not found or inactive' },
        { status: 404 }
      )
    }

    // Check if users have blocked each other
    const { data: blocks } = await supabase
      .from('user_block')
      .select('*')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${user.id})`)

    if (blocks && blocks.length > 0) {
      return NextResponse.json(
        { error: 'Cannot create chat room with blocked user' },
        { status: 403 }
      )
    }

    // Get or create chat room
    const { data: roomId, error: roomError } = await supabase
      .rpc('get_or_create_chat_room', {
        user_a_id: user.id,
        user_b_id: targetUserId
      })

    if (roomError) {
      console.error('Database error:', roomError)
      return NextResponse.json(
        { error: 'Failed to create chat room' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      roomId,
      success: true
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

    // Get user's chat rooms with last message info
    const { data: rooms, error } = await supabase
      .from('chat_room')
      .select(`
        room_id,
        user_a,
        user_b,
        created_at,
        last_message_at
      `)
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch chat rooms' },
        { status: 500 }
      )
    }

    // Format the response to include partner info
    const formattedRooms = rooms?.map(room => {
      const isUserA = room.user_a === user.id
      const partnerId = isUserA ? room.user_b : room.user_a

      return {
        roomId: room.room_id,
        partnerId,
        partnerNickname: 'Chat Partner',
        lastMessageAt: room.last_message_at,
        createdAt: room.created_at
      }
    })

    return NextResponse.json({ 
      rooms: formattedRooms || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}