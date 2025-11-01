import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  function logout() {
    localStorage.removeItem('token')
    navigate('/login')
  }
  return (
    <div className="mb-8">
      <div className="mx-auto mt-4 flex max-w-5xl items-center justify-center rounded-2xl border border-gray-200 bg-white/75 px-4 py-2 shadow-sm backdrop-blur">
        <div className="flex items-center gap-4">
          <Link className="text-sm text-gray-700 hover:text-gray-900" to="/projects">Projetos</Link>
          <button onClick={logout} className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black cursor-pointer">Sair</button>
        </div>
      </div>
    </div>
  )
}


