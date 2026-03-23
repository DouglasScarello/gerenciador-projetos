import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import './Login.css'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
})

export default function Login() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values) {
    try {
      const { data } = await api.post('/auth/login', values)
      toast.success('Bem-vindo!')
      navigate('/projects')
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Erro ao entrar'
      toast.error(msg)
    }
  }

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden>
            <path d="M12 1.5a5.25 5.25 0 00-5.25 5.25V9H5.25A2.25 2.25 0 003 11.25v7.5A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75v-7.5A2.25 2.25 0 0018.75 9H17.25V6.75A5.25 5.25 0 0012 1.5zm-3.75 7.5V6.75a3.75 3.75 0 117.5 0V9h-7.5z" />
          </svg>
        </div>
        <h2 className="login-title">Acesse sua conta</h2>
        <p className="login-subtitle">Use seu email e senha para continuar</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            type="email"
            placeholder="Email"
            className="login-input"
            {...register('email')}
          />
          {errors.email && (
            <p
              style={{
                marginTop: '-0.5rem',
                marginBottom: '0.5rem',
                fontSize: '0.75rem',
                color: '#000000',
                backgroundColor: '#ffe4e6',
                border: '1px solid #f87171',
                borderRadius: '6px',
                padding: '0.35rem 0.5rem',
              }}
            >
              {errors.email.message}
            </p>
          )}

          <input
            type="password"
            placeholder="Senha"
            className="login-input"
            {...register('password')}
          />
          {errors.password && (
            <p
              style={{
                marginTop: '-0.5rem',
                marginBottom: '0.5rem',
                fontSize: '0.75rem',
                color: '#000000',
                backgroundColor: '#ffe4e6',
                border: '1px solid #f87171',
                borderRadius: '6px',
                padding: '0.35rem 0.5rem',
              }}
            >
              {errors.password.message}
            </p>
          )}

          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="login-bottom">
          Não tem conta? <Link to="/register">Criar uma conta</Link>
        </p>
        <p className="login-footer">© 2025 Gerenciador</p>
      </div>
    </div>
  )
}


