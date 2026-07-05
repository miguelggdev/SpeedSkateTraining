import { useState, useRef, useCallback } from 'react'

export interface GpsPoint {
  lat: number
  lng: number
  alt: number | null
  ts: number
  speed: number | null
}

export interface TrackerState {
  tracking: boolean
  points: GpsPoint[]
  distanceKm: number
  durationS: number
  speedCurrent: number
  speedMax: number
  error: string
}

function haversineKm(a: GpsPoint, b: GpsPoint) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sin2 = Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(sin2))
}

export function useGpsTracker() {
  const watchId = useRef<number | null>(null)
  const startTs = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [state, setState] = useState<TrackerState>({
    tracking: false,
    points: [],
    distanceKm: 0,
    durationS: 0,
    speedCurrent: 0,
    speedMax: 0,
    error: '',
  })

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'Geolocalización no disponible' }))
      return
    }
    startTs.current = Date.now()
    timerRef.current = setInterval(() => {
      setState(s => ({ ...s, durationS: Math.floor((Date.now() - startTs.current) / 1000) }))
    }, 1000)

    watchId.current = navigator.geolocation.watchPosition(
      pos => {
        const pt: GpsPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          alt: pos.coords.altitude,
          ts: pos.timestamp,
          speed: pos.coords.speed,
        }
        setState(s => {
          const pts = [...s.points, pt]
          const last = s.points[s.points.length - 1]
          const added = last ? haversineKm(last, pt) : 0
          const dist = s.distanceKm + added
          const speedMs = pos.coords.speed ?? 0
          const speedKmh = speedMs * 3.6
          return {
            ...s,
            points: pts,
            distanceKm: dist,
            speedCurrent: Math.round(speedKmh * 10) / 10,
            speedMax: Math.max(s.speedMax, speedKmh),
            error: '',
          }
        })
      },
      err => setState(s => ({ ...s, error: err.message })),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    )
    setState(s => ({ ...s, tracking: true, points: [], distanceKm: 0, durationS: 0, speedCurrent: 0, speedMax: 0, error: '' }))
  }, [])

  const stop = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    if (timerRef.current) clearInterval(timerRef.current)
    setState(s => ({ ...s, tracking: false }))
  }, [])

  return { state, start, stop }
}
