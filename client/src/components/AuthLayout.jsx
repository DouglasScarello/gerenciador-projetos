export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[#f0f2f5]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.6)_0%,_rgba(255,255,255,0)_70%)]" />
      <div className="absolute -right-14 -bottom-14 h-40 w-40 rounded-3xl bg-white/60 blur-2xl" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center">
          {title && <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>}
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
        {children}
        <p className="mt-6 text-center text-xs text-gray-500">© {new Date().getFullYear()} Gerenciador</p>
      </div>
    </div>
  )
}


