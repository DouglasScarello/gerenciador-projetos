export default function Input({ label, className = '', ...props }) {
  return (
    <label className="block">
      {label && <div className="mb-1 text-sm font-medium text-gray-800">{label}</div>}
      <input
        className={
          'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-text ' +
          className
        }
        {...props}
      />
    </label>
  )
}


