export default function Button({ children, className = '', ...props }) {
  return (
    <button
      className={
        'inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 px-5 py-2.5 text-white shadow-md transition-colors duration-300 hover:from-primary-500 hover:to-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ' +
        className
      }
      {...props}
    >
      {children}
    </button>
  )
}


