import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'
import AuthLayout from '../components/AuthLayout'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'

const schema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
})

export default function Register() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  })

  async function onSubmit(values) {
    try {
      await api.post('/auth/register', values)
      toast.success('Conta criada! Faça login.')
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao registrar'
      toast.error(msg)
    }
  }

  return (
    <AuthLayout>
      <Card className="w-full text-center shadow-2xl ring-1 ring-black/5">
        <div className="mb-6">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-teal-100 text-teal-600 shadow">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.125a7.125 7.125 0 0114.25 0V21H4.5v-1.875z" />
            </svg>
          </div>
          <h2 className="text-3xl font-semibold text-gray-900">Crie sua conta</h2>
          <p className="mt-1 text-sm text-gray-600">Leva menos de um minuto</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input placeholder="Nome" {...register('name')} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <Input placeholder="Email" {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <Input placeholder="Senha" type="password" {...register('password')} />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Registrando...' : 'Registrar'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Já tem conta? <Link className="text-primary-600 hover:underline" to="/login">Entrar</Link>
        </p>
      </Card>
    </AuthLayout>
  )
}


