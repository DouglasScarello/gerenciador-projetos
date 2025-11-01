import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'
import Card from '../components/Card'
import Input from '../components/Input'
import Button from '../components/Button'

export default function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [description, setDescription] = useState('')

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    try {
      const { data } = await api.get(`/tarefas/${id}`)
      setTasks(data)
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
    }
  }

  async function addTask(e) {
    e.preventDefault()
    await api.post(`/tarefas/${id}`, { description })
    setDescription('')
    load()
  }

  async function toggle(task) {
    const next = task.status === 'done' ? 'todo' : 'done'
    await api.put(`/tarefas/${task._id}`, { status: next })
    load()
  }

  async function remove(task) {
    await api.delete(`/tarefas/${task._id}`)
    load()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4">
        <header className="mb-6 text-center">
          <Link to="/projects" className="text-xs text-primary-700 hover:underline">← Voltar</Link>
          <h2 className="mt-2 text-3xl font-semibold text-gray-900">Tarefas</h2>
          <p className="text-sm text-gray-600">Adicione, conclua e gerencie as tarefas do projeto</p>
        </header>
        <Card className="mb-8 bg-gray-100 rounded-2xl p-6 border-0 shadow">
          <form onSubmit={addTask} className="flex items-center gap-3">
            <Input placeholder="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} required className="flex-1" />
            <Button type="submit">Adicionar</Button>
          </form>
        </Card>
        <section className="space-y-3">
          {tasks.map((t) => (
            <Card key={t._id} className="flex items-center justify-between rounded-2xl">
              <span className={t.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-800'}>{t.description}</span>
              <div className="flex items-center gap-2">
                <Button onClick={() => toggle(t)} className="bg-gray-800 hover:bg-black">
                  {t.status === 'done' ? 'Reabrir' : 'Concluir'}
                </Button>
                <Button onClick={() => remove(t)} className="bg-red-600 hover:bg-red-700">Excluir</Button>
              </div>
            </Card>
          ))}
          {tasks.length === 0 && <Card className="rounded-2xl text-center text-gray-600">Sem tarefas ainda.</Card>}
        </section>
      </main>
    </div>
  )
}


