export type SportType = 'skating' | 'cycling' | 'gym'

export type TrainingType =
  | 'strength_plyo'
  | 'dry_technique'
  | 'endurance'
  | 'sprint_start'
  | 'flexibility'

export type TrackType = 'track_400' | 'track_200' | 'open_road' | 'park_circuit'

export type AthleteCategory = 'velocista' | 'fondista'

export type UserRole = 'athlete' | 'coach' | 'admin'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  gender: string | null
  birth_date: string | null
  height_cm: number | null
  weight_kg: number | null
  category: AthleteCategory | null
  years_practice: number | null
  skate_club: string | null
  coach_id: string | null
  role: UserRole
  hr_max: number | null
  hr_zone2_top: number | null
  hr_zone3_top: number | null
  hr_zone4_top: number | null
  avatar_url: string | null
  instagram_handle: string | null
  strava_link: string | null
  gfit_connected: boolean
  updated_at: string
  created_at: string
}

export interface TrainingSession {
  id: string
  user_id: string
  sport_type: SportType
  training_type: TrainingType | null
  athlete_category: AthleteCategory | null
  focus: string | null
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  nfc_tag_id: string | null
  location_name: string | null
  location_lat: number | null
  location_lng: number | null
  track_type: TrackType | null
  lap_count: number | null
  lap_times: number[] | null
  sprint_sets: SprintSet[] | null
  fartlek_intervals: FartlekInterval[] | null
  distance_km: number | null
  speed_avg: number | null
  speed_max: number | null
  elevation_gain: number | null
  avg_hr: number | null
  max_hr: number | null
  hr_zone: string | null
  calories: number | null
  rpe: number | null
  power_avg_w: number | null
  cadence_rpm: number | null
  total_sets: number | null
  total_reps: number | null
  gym_load: string | null
  weather_temp_c: number | null
  weather_wind_kmh: number | null
  weather_condition: string | null
  wheel_id: string | null
  comments: string | null
  created_at: string
}

export interface SprintSet {
  distance_m: number
  time_s: number
  rest_s: number
}

export interface FartlekInterval {
  type: 'fast' | 'slow'
  duration_s: number
  laps: number
}

export interface NfcTag {
  id: string
  uid: string
  athlete_id: string
  label: string | null
  is_active: boolean
  registered_at: string
  registered_by: string | null
}

export interface Wheel {
  id: string
  user_id: string
  name: string
  type: string
  diameter: number
  hardness: number | null
  brand: string | null
  start_date: string
  end_date: string | null
  is_active: boolean
  total_km: number
  total_minutes: number
  created_at: string
}

export interface Route {
  id: string
  session_id: string
  user_id: string
  geojson: GeoJsonFeature
  distance_km: number | null
  duration_s: number | null
  elevation_gain: number | null
  speed_avg: number | null
  speed_max: number | null
  calories: number | null
  start_lat: number | null
  start_lng: number | null
  end_lat: number | null
  end_lng: number | null
  splits: RouteSplit[] | null
  created_at: string
}

export interface RouteSplit {
  km: number
  time_s: number
  speed_avg: number
}

export interface GeoJsonFeature {
  type: 'Feature'
  geometry: {
    type: 'LineString'
    coordinates: [number, number, number?][]
  }
}

export interface DailyWellness {
  id: string
  user_id: string
  date: string
  sleep_hours: number | null
  sleep_quality: number | null
  soreness: number | null
  mood: string | null
  energy: number | null
  hydration: number | null
  notes: string | null
  created_at: string
}
