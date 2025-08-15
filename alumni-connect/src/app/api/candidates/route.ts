import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const candidatesSchema = z.object({
  lat: z.string().transform(Number),
  lng: z.string().transform(Number),
  radius: z.string().transform(Number).optional().default(6000)
})

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
    const validation = candidatesSchema.safeParse({
      lat: searchParams.get('lat'),
      lng: searchParams.get('lng'),
      radius: searchParams.get('radius')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { lat, lng, radius } = validation.data

    // Call the database function to find candidates
    const { data: candidates, error } = await supabase
      .rpc('find_candidates', {
        target_user_id: user.id,
        user_lat: lat,
        user_lng: lng,
        radius_meters: radius
      })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch candidates' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      candidates: candidates || [],
      total: candidates?.length || 0
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}