import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const startIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#00C48C;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const endIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#E84A5F;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const liveIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#00C6EF;border:3px solid #fff;box-shadow:0 0 0 4px rgba(0,198,239,.25)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

interface Props {
  points: [number, number][]
  live?: boolean
  color?: string
}

function AutoFit({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [30, 30] })
    } else if (points.length === 1) {
      map.setView(points[0], 15)
    }
  }, [points.length])
  return null
}

export default function RouteMap({ points, live = false, color = '#00C6EF' }: Props) {
  const center: [number, number] = points.length > 0 ? points[0] : [4.711, -74.0721]

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <AutoFit points={points} />
      {points.length > 1 && (
        <Polyline positions={points} color={color} weight={4} opacity={0.9} />
      )}
      {points.length > 0 && !live && (
        <Marker position={points[0]} icon={startIcon} />
      )}
      {points.length > 1 && !live && (
        <Marker position={points[points.length - 1]} icon={endIcon} />
      )}
      {points.length > 0 && live && (
        <Marker position={points[points.length - 1]} icon={liveIcon} />
      )}
    </MapContainer>
  )
}
