interface PlaceholderProps {
  icon: string
  title: string
  description: string
}

export default function Placeholder({ icon, title, description }: PlaceholderProps) {
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-5xl mb-4">{icon}</div>
        <h2 className="text-xl font-black text-white mb-2" style={{ fontFamily: "'Arial Black', sans-serif" }}>
          {title}
        </h2>
        <p className="text-[#4A6888] text-sm max-w-xs mx-auto">{description}</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-[#00C6EF]/10 border border-[#00C6EF]/20 text-[#00C6EF] text-xs font-semibold px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00C6EF] animate-pulse" />
          Próximamente en desarrollo
        </div>
      </div>
    </div>
  )
}
