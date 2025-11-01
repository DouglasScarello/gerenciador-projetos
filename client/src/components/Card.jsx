export default function Card({ children, className = '' }) {
  return (
    <div className={'rounded-2xl border-0 bg-white p-10 shadow-[0_8px_24px_rgba(0,0,0,0.05)] ' + className}>{children}</div>
  )
}


