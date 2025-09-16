export default function GlowingBox() {
  return (
    <div className="glowing-box absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 transform">
      <div className="relative flex h-40 w-64 items-center justify-center">
        {/* Outer box with glow */}
        <div className="absolute inset-0 rounded-md border-2 border-cyan-400 shadow-[0_0_15px_3px_rgba(34,211,238,0.6)]" />

        {/* Label “cut” into border */}
        <div className="absolute -bottom-3 left-6 bg-black px-2 font-semibold text-cyan-300">
          Text
        </div>

        {/* Content inside */}
        <div className="relative z-10 text-white">Hello World</div>
      </div>
    </div>
  )
}
