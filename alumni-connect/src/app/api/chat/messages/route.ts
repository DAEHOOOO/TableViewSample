import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const sendMessageSchema = z.object({
  roomId: z.string().uuid(),
  body: z.string().min(1).max(1000),
  clientId: z.string().optional()
})

const getMessagesSchema = z.object({
  roomId: z.string().uuid(),
  limit: z.string().transform(Number).optional().default(50),
  before: z.string().optional() // timestamp for pagination
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
    const validation = sendMessageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { roomId, body: messageBody, clientId } = validation.data

    // Verify user is part of this chat room
    const { data: room, error: roomError } = await supabase
      .from('chat_room')
      .select('user_a, user_b')
      .eq('room_id', roomId)
      .single()

    if (roomError || !room || (room.user_a !== user.id && room.user_b !== user.id)) {
      return NextResponse.json(
        { error: 'Chat room not found or access denied' },
        { status: 404 }
      )
    }

    // Check if users have blocked each other
    const otherUserId = room.user_a === user.id ? room.user_b : room.user_a
    const { data: blocks } = await supabase
      .from('user_block')
      .select('*')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${user.id})`)

    if (blocks && blocks.length > 0) {
      return NextResponse.json(
        { error: 'Cannot send message to blocked user' },
        { status: 403 }
      )
    }

    // Insert message with idempotency support
    const messageClientId = clientId || uuidv4()
    const { data: message, error: messageError } = await supabase
      .from('message')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        body: messageBody,
        client_id: messageClientId
      })
      .select()
      .single()

    if (messageError) {
      // Check if it's a duplicate client_id (idempotency)
      if (messageError.code === '23505') {
        const { data: existingMessage } = await supabase
          .from('message')
          .select()
          .eq('client_id', messageClientId)
          .single()
        
        if (existingMessage) {
          return NextResponse.json({ 
            message: existingMessage,
            success: true
          })
        }
      }
      
      console.error('Database error:', messageError)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // Track event for analytics
    await supabase
      .from('user_event')
      .insert({
        user_id: user.id,
        event_name: 'send_message',
        event_data: {
          room_id: roomId,
          message_length: messageBody.length
        }
      })

    return NextResponse.json({ 
      message,
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

export async function GET(request: NextRequest) {
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

    // Validate query parameters
    const searchParams = request.nextUrl.searchParams
    const validation = getMessagesSchema.safeParse({
      roomId: searchParams.get('roomId'),
      limit: searchParams.get('limit'),
      before: searchParams.get('before')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { roomId, limit, before } = validation.data

    // Verify user is part of this chat room
    const { data: room, error: roomError } = await supabase
      .from('chat_room')
      .select('user_a, user_b')
      .eq('room_id', roomId)
      .single()

    if (roomError || !room || (room.user_a !== user.id && room.user_b !== user.id)) {
      return NextResponse.json(
        { error: 'Chat room not found or access denied' },
        { status: 404 }
      )
    }

    // Build query for messages
    let query = supabase
      .from('message')
      .select(`
        msg_id,
        room_id,
        sender_id,
        body,
        sent_at,
        status
      `)
      .eq('room_id', roomId)
      .order('sent_at', { ascending: false })
      .limit(limit)

    if (before) {
      query = query.lt('sent_at', before)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      messages: messages?.reverse() || [], // Reverse to show chronological order
      hasMore: messages?.length === limit
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}