import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kucgrtsvivkptrtgkawv.supabase.co'
const supabaseKey = 'sb_publishable_AkGiS9SnU1o6w4LwAALpoA_smrS6BWJ'

export const supabase = createClient(supabaseUrl, supabaseKey)

export type RoomStatus = 'waiting' | 'playing' | 'finished'

export interface Room {
  id: string
  room_code: string
  name: string
  status: RoomStatus
  host_id: string
  max_players: number
  created_at: string
}

export interface RoomPlayer {
  id: string
  room_id: string
  user_id: string
  name: string
  avatar: string
  seat_index: number
  is_ready: boolean
  joined_at: string
}

export interface GameMove {
  id: string
  room_id: string
  player_index: number
  move_type: 'play' | 'flip' | 'collect' | 'discard_reset' | 'turn_end'
  card_id?: string
  pair_index?: number
  accepted_reset?: boolean
  created_at: string
}

export interface GameSnapshot {
  id: string
  room_id: string
  player_index: number
  game_state_json: string
  created_at: string
}
