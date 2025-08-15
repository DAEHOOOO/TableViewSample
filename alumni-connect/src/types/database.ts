export type AffiliationType = 
  | 'elementary'
  | 'middle' 
  | 'high'
  | 'univ'
  | 'grad'
  | 'company'

export type MessageStatus = 'sent' | 'delivered' | 'read'

export interface AppUser {
  user_id: string
  nickname: string
  birth_year: number
  created_at: string
  updated_at: string
  is_active: boolean
  last_seen_at: string
}

export interface Affiliation {
  affil_id: number
  user_id: string
  type: AffiliationType
  name: string
  start_year?: number
  end_year?: number
  department?: string
  major?: string
  created_at: string
}

export interface UserLocation {
  user_id: string
  coord: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
  }
  updated_at: string
  grid_id?: string
}

export interface ChatRoom {
  room_id: string
  user_a: string
  user_b: string
  created_at: string
  last_message_at: string
}

export interface Message {
  msg_id: number
  room_id: string
  sender_id: string
  body: string
  sent_at: string
  status: MessageStatus
  client_id?: string
}

export interface UserBlock {
  blocker_id: string
  blocked_id: string
  created_at: string
}

export interface UserReport {
  report_id: number
  reporter_id: string
  target_id: string
  reason: string
  details?: string
  status: string
  created_at: string
}

export interface UserEvent {
  event_id: number
  user_id: string
  event_name: string
  event_data: Record<string, unknown>
  created_at: string
}

export interface Candidate {
  candidate_id: string
  nickname: string
  distance_meters: number
  common_affiliations: string[]
}

// Form types
export interface OnboardingForm {
  nickname: string
  birthYear: number
  affiliations: {
    type: AffiliationType
    name: string
    startYear?: number
    endYear?: number
    department?: string
    major?: string
  }[]
}

export interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
}