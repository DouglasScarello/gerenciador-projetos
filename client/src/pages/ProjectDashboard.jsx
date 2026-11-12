import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { 
  FolderKanban, 
  Plus, 
  Trash2, 
  LogOut, 
  Circle, 
  Clock, 
  CheckCircle2, 
  MoreHorizontal, 
  ChevronRight, 
  ChevronLeft,
  X,
  Layers,
  Sparkles,
  Search,
  Filter,
  Calendar,
  Tag,
  AlertCircle,
  AlertTriangle,
  SlidersHorizontal,
  ArrowDown,
  Minus
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import './ProjectDashboard.css'

const STAGES = [
  { key: 'todo', label: 'Backlog / Para fazer', icon: Circle, indicator: 'indicator-todo' },
  { key: 'in_progress', label: 'Em andamento', icon: Clock, indicator: 'indicator-in_progress' },
  { key: 'done', label: 'Concluído', icon: CheckCircle2, indicator: 'indicator-done' },
]

const stageOrder = STAGES.map((s) => s.key)

export const PRIORITIES = [
  { key: 'urgent', label: 'Urgente', color: '#ef4444', icon: AlertCircle },
  { key: 'high', label: 'Alta', color: '#f97316', icon: AlertTriangle },
  { key: 'medium', label: 'Média', color: '#eab308', icon: SlidersHorizontal },
  { key: 'low', label: 'Baixa', color: '#3b82f6', icon: ArrowDown },
  { key: 'none', label: 'Nenhuma', color: '#71717a', icon: Minus },
]

export const LABELS = [
  { key: 'feature', label: 'Feature', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)' },
  { key: 'bug', label: 'Bug', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' },
  { key: 'improvement', label: 'Melhoria', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' },
  { key: 'design', label: 'Design', color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)' },
]

function formatDueDate(dateStr) {
  if (!dateStr) return null
  const [year, month, day] = String(dateStr).split('-')
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isOverdue = date < today
  const formatted = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return { formatted, isOverdue }
}

export default function ProjectDashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedProjectId, setSelectedProjectId] = useState(null)

  // Filtros rápidos
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [labelFilter, setLabelFilter] = useState('all')

  // Estado do formulário de criação
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    priority: 'none',
    label: 'feature',
    dueDate: ''
  })

  // Estado de edição
  const [editingTicket, setEditingTicket] = useState(null)
  const [editingValues, setEditingValues] = useState({
    title: '',
    description: '',
    priority: 'none',
    label: 'feature',
    dueDate: ''
  })

  const [draggingTicketId, setDraggingTicketId] = useState(null)
  const [activeDropStage, setActiveDropStage] = useState(null)

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [newProjectValues, setNewProjectValues] = useState({ title: '', description: '' })
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false)

  // 1. Buscar todos os projetos
  const { data: projectsResponse } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projetos')
      return res.data
    }
  })

  const projects = projectsResponse?.data || []

  // Auto-selecionar primeiro projeto
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  const currentProject = projects.find(p => p.id === selectedProjectId)

  // Atalhos de teclado estilo Linear
  useEffect(() => {
    function handleKeyDown(e) {
      const activeTag = document.activeElement?.tagName?.toLowerCase()
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || document.activeElement?.isContentEditable

      if (e.key === 'Escape') {
        setIsNewTicketModalOpen(false)
        setIsNewProjectModalOpen(false)
        setEditingTicket(null)
        return
      }

      if (!isInput && (e.key === 'c' || e.key === 'C')) {
        if (selectedProjectId) {
          e.preventDefault()
          setFormValues({ title: '', description: '', priority: 'none', label: 'feature', dueDate: '' })
          setIsNewTicketModalOpen(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedProjectId])

  // Mutations de Projeto
  const createProjectMutation = useMutation({
    mutationFn: (newProj) => api.post('/projetos', newProj),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Projeto criado!')
      setIsNewProjectModalOpen(false)
      setNewProjectValues({ title: '', description: '' })
      if (res.data?.data?.id) setSelectedProjectId(res.data.data.id)
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Erro ao criar projeto')
  })

  const deleteProjectMutation = useMutation({
    mutationFn: (projId) => api.delete(`/projetos/${projId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Projeto excluído!')
      setSelectedProjectId(null)
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Erro ao excluir')
  })

  // 2. Buscar tarefas
  const { data: tasksResponse, isLoading } = useQuery({
    queryKey: ['tasks', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return { data: [] }
      const res = await api.get(`/tarefas?projectId=${selectedProjectId}`)
      return res.data
    },
    enabled: !!selectedProjectId
  })

  const tickets = tasksResponse?.data || []

  // Filtragem instantânea client-side
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesTitle = t.title?.toLowerCase().includes(q)
        const matchesDesc = t.description?.toLowerCase().includes(q)
        if (!matchesTitle && !matchesDesc) return false
      }
      if (priorityFilter !== 'all') {
        if ((t.priority || 'none') !== priorityFilter) return false
      }
      if (labelFilter !== 'all') {
        if ((t.label || 'feature') !== labelFilter) return false
      }
      return true
    })
  }, [tickets, searchQuery, priorityFilter, labelFilter])

  // Mutation para criar tarefa
  const createMutation = useMutation({
    mutationFn: (newTask) => api.post('/tarefas', { ...newTask, project_id: selectedProjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId] })
      toast.success('Issue criada!')
      setFormValues({ title: '', description: '', priority: 'none', label: 'feature', dueDate: '' })
      setIsNewTicketModalOpen(false)
    },
    onError: (err) => toast.error(err.response?.data?.error?.message || 'Erro ao criar issue')
  })

  // Mutation para atualizar (com Optimistic UI)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/tarefas/${id}`, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', selectedProjectId] })
      const previousData = queryClient.getQueryData(['tasks', selectedProjectId])

      queryClient.setQueryData(['tasks', selectedProjectId], (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((t) => (String(t.id) === String(id) ? { ...t, ...data } : t))
        }
      })
      return { previousData }
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previousData) queryClient.setQueryData(['tasks', selectedProjectId], ctx.previousData)
      toast.error(err.response?.data?.error?.message || 'Erro ao atualizar')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId] })
  })

  // Mutation para excluir tarefa
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tarefas/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', selectedProjectId] })
      const previousData = queryClient.getQueryData(['tasks', selectedProjectId])

      queryClient.setQueryData(['tasks', selectedProjectId], (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.filter((t) => String(t.id) !== String(id))
        }
      })
      return { previousData }
    },
    onSuccess: () => toast.success('Issue removida'),
    onError: (err, _id, ctx) => {
      if (ctx?.previousData) queryClient.setQueryData(['tasks', selectedProjectId], ctx.previousData)
      toast.error(err.response?.data?.error?.message || 'Erro ao remover')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId] })
  })

  // Sincronização em tempo real via WebSockets
  useEffect(() => {
    if (!selectedProjectId) return
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      withCredentials: true
    })
    socket.emit('join-project', selectedProjectId)
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId] })
    socket.on('task:created', invalidate)
    socket.on('task:updated', invalidate)
    socket.on('task:deleted', invalidate)
    return () => socket.disconnect()
  }, [selectedProjectId, queryClient])

  const groupedTickets = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage.key] = filteredTickets.filter((t) => (t.status || 'todo') === stage.key)
      return acc
    }, {})
  }, [filteredTickets])

  // Drag and Drop
  function handleDragStart(e, ticket) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(ticket.id))
    setDraggingTicketId(String(ticket.id))
  }

  function handleDragEnd() {
    setDraggingTicketId(null)
    setActiveDropStage(null)
  }

  function handleDrop(e, stageKey) {
    e.preventDefault()
    const ticketId = e.dataTransfer.getData('text/plain')
    setActiveDropStage(null)
    if (!ticketId) return
    const ticket = tickets.find((t) => String(t.id) === ticketId)
    if (!ticket || (ticket.status || 'todo') === stageKey) return
    updateMutation.mutate({ id: ticketId, data: { status: stageKey } })
  }

  function handleMoveTicket(ticket, direction) {
    const currentIndex = stageOrder.indexOf(ticket.status || 'todo')
    const nextStage = stageOrder[currentIndex + direction]
    if (!nextStage) return
    updateMutation.mutate({ id: ticket.id, data: { status: nextStage } })
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
      toast.success('Até logo!')
      navigate('/login')
    } catch {
      navigate('/login')
    }
  }

  const hasActiveFilters = searchQuery.trim() !== '' || priorityFilter !== 'all' || labelFilter !== 'all'

  return (
    <div className="linear-app">
      {/* SIDEBAR */}
      <aside className="linear-sidebar">
        <div>
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <div className="sidebar-icon">
                <Sparkles size={14} />
              </div>
              <span>Workspace</span>
            </div>
            <button
              className="card-icon-btn"
              title="Novo Projeto"
              onClick={() => setIsNewProjectModalOpen(true)}
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <span>Projetos ({projects.length})</span>
            </div>

            <div className="space-y-1">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`project-item ${p.id === selectedProjectId ? 'active' : ''}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FolderKanban size={14} className={p.id === selectedProjectId ? 'text-indigo-400' : 'text-zinc-500'} />
                    <span className="truncate">{p.title}</span>
                  </div>
                </button>
              ))}
              {projects.length === 0 && (
                <div className="text-xs text-zinc-500 px-2 py-3">Nenhum projeto ainda.</div>
              )}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="flex items-center gap-2 text-zinc-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="text-xs font-mono">Realtime Live</span>
          </div>
          <button
            onClick={logout}
            className="card-icon-btn hover:text-red-400"
            title="Sair da conta"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="linear-main">
        {/* TOPBAR COM BUSCA E FILTROS */}
        <header className="linear-topbar">
          <div className="topbar-left">
            <div className="topbar-title">
              <Layers size={16} className="text-indigo-400" />
              <span>{currentProject ? currentProject.title : 'Selecione um projeto'}</span>
            </div>
            {currentProject?.description && (
              <span className="text-xs text-zinc-500 hidden xl:inline truncate max-w-xs">
                — {currentProject.description}
              </span>
            )}
          </div>

          {selectedProjectId && (
            <div className="topbar-filters">
              {/* Busca Instantânea */}
              <div className="search-box">
                <Search size={13} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar issues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => setSearchQuery('')}>
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filtro Prioridade */}
              <div className="filter-select-wrapper">
                <Filter size={12} className="filter-icon" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Prioridade</option>
                  {PRIORITIES.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Etiqueta */}
              <div className="filter-select-wrapper">
                <Tag size={12} className="filter-icon" />
                <select
                  value={labelFilter}
                  onChange={(e) => setLabelFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Etiqueta</option>
                  {LABELS.map((l) => (
                    <option key={l.key} value={l.key}>{l.label}</option>
                  ))}
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  className="btn-clear-filters"
                  onClick={() => { setSearchQuery(''); setPriorityFilter('all'); setLabelFilter('all') }}
                >
                  Limpar ({filteredTickets.length}/{tickets.length})
                </button>
              )}
            </div>
          )}

          <div className="topbar-actions">
            {selectedProjectId && (
              <>
                <button
                  onClick={() => {
                    setFormValues({ title: '', description: '', priority: 'none', label: 'feature', dueDate: '' })
                    setIsNewTicketModalOpen(true)
                  }}
                  className="btn-linear-primary"
                  title="Atalho: tecla C"
                >
                  <Plus size={14} />
                  <span>Nova Issue</span>
                  <kbd className="linear-kbd">C</kbd>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Deseja excluir este projeto e todas as suas tarefas?')) {
                      deleteProjectMutation.mutate(selectedProjectId)
                    }
                  }}
                  className="btn-linear-danger"
                  title="Excluir Projeto Atual"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        </header>

        {/* KANBAN BOARD */}
        <div className="linear-board">
          {STAGES.map((stage) => {
            const stageTickets = groupedTickets[stage.key] || []

            return (
              <div
                key={stage.key}
                className={`linear-column ${activeDropStage === stage.key ? 'drag-over' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setActiveDropStage(stage.key)}
                onDragLeave={() => setActiveDropStage(null)}
                onDrop={(e) => handleDrop(e, stage.key)}
              >
                <div className="column-header">
                  <div className="column-title-group">
                    <span className={`column-indicator ${stage.indicator}`}></span>
                    <span>{stage.label}</span>
                  </div>
                  <span className="column-badge">{stageTickets.length}</span>
                </div>

                <div className="column-content">
                  {isLoading && (
                    <div className="text-xs text-zinc-600 p-4 text-center">Carregando issues...</div>
                  )}

                  {!isLoading && stageTickets.length === 0 && (
                    <div className="text-xs text-zinc-600 p-6 text-center border border-dashed border-zinc-800 rounded-md">
                      {hasActiveFilters ? 'Nenhuma issue corresponde aos filtros' : 'Nenhuma issue nesta coluna'}
                    </div>
                  )}

                  {stageTickets.map((ticket) => {
                    const canBack = stageOrder.indexOf(stage.key) > 0
                    const canNext = stageOrder.indexOf(stage.key) < stageOrder.length - 1

                    const priorityObj = PRIORITIES.find(p => p.key === (ticket.priority || 'none')) || PRIORITIES[4]
                    const PriorityIcon = priorityObj.icon
                    const labelObj = LABELS.find(l => l.key === (ticket.label || 'feature'))
                    const dueInfo = formatDueDate(ticket.due_date || ticket.dueDate)

                    return (
                      <article
                        key={ticket.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, ticket)}
                        onDragEnd={handleDragEnd}
                        className={`linear-card ${String(ticket.id) === draggingTicketId ? 'is-dragging' : ''}`}
                      >
                        {/* Meta: prioridade, etiqueta, prazo */}
                        <div className="card-meta-row">
                          <div className="card-meta-badges">
                            <span
                              className="priority-pill"
                              style={{ color: priorityObj.color }}
                              title={`Prioridade: ${priorityObj.label}`}
                            >
                              <PriorityIcon size={12} />
                              {priorityObj.key !== 'none' && <span>{priorityObj.label}</span>}
                            </span>

                            {labelObj && (
                              <span
                                className="label-badge"
                                style={{ backgroundColor: labelObj.bg, color: labelObj.color }}
                              >
                                {labelObj.label}
                              </span>
                            )}
                          </div>

                          {dueInfo && (
                            <span
                              className={`due-date-pill${dueInfo.isOverdue ? ' overdue' : ''}`}
                              title={dueInfo.isOverdue ? 'Prazo expirado!' : 'Prazo de conclusão'}
                            >
                              <Calendar size={11} />
                              <span>{dueInfo.formatted}</span>
                            </span>
                          )}
                        </div>

                        <div className="card-title">{ticket.title}</div>
                        {ticket.description && (
                          <div className="card-desc">{ticket.description}</div>
                        )}

                        <div className="card-footer">
                          <span className="card-id-tag">#{ticket.id}</span>
                          <div className="card-actions">
                            <button
                              type="button"
                              className="card-icon-btn"
                              disabled={!canBack}
                              onClick={() => handleMoveTicket(ticket, -1)}
                              title="Mover para esquerda"
                            >
                              <ChevronLeft size={13} />
                            </button>
                            <button
                              type="button"
                              className="card-icon-btn hover:text-indigo-400"
                              onClick={() => {
                                setEditingTicket(ticket)
                                setEditingValues({
                                  title: ticket.title,
                                  description: ticket.description || '',
                                  priority: ticket.priority || 'none',
                                  label: ticket.label || 'feature',
                                  dueDate: ticket.due_date ? ticket.due_date.split('T')[0] : (ticket.dueDate || '')
                                })
                              }}
                              title="Editar detalhes"
                            >
                              <MoreHorizontal size={13} />
                            </button>
                            <button
                              type="button"
                              className="card-icon-btn hover:text-red-400"
                              onClick={() => {
                                if (window.confirm('Excluir esta tarefa?')) {
                                  deleteMutation.mutate(ticket.id)
                                }
                              }}
                              title="Excluir"
                            >
                              <Trash2 size={13} />
                            </button>
                            <button
                              type="button"
                              className="card-icon-btn"
                              disabled={!canNext}
                              onClick={() => handleMoveTicket(ticket, 1)}
                              title="Mover para direita"
                            >
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* MODAL: CRIAR ISSUE */}
      {isNewTicketModalOpen && (
        <div className="linear-modal-overlay">
          <div className="linear-modal-box">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={15} style={{ color: '#818cf8' }} />
                <span>Nova Issue</span>
              </div>
              <button className="card-icon-btn" onClick={() => setIsNewTicketModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!formValues.title.trim()) return
                createMutation.mutate({
                  title: formValues.title.trim(),
                  description: formValues.description.trim() || null,
                  priority: formValues.priority,
                  label: formValues.label,
                  dueDate: formValues.dueDate || null,
                  status: 'todo'
                })
              }}
            >
              <div className="modal-body">
                <div>
                  <label className="text-xs text-zinc-400 font-medium mb-1 block">Título da Issue</label>
                  <input
                    type="text"
                    className="linear-input"
                    placeholder="O que precisa ser feito?"
                    value={formValues.title}
                    onChange={(e) => setFormValues(v => ({ ...v, title: e.target.value }))}
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-medium mb-1 block">Descrição (opcional)</label>
                  <textarea
                    rows={3}
                    className="linear-textarea"
                    placeholder="Adicione contexto, passos para reproduzir ou critérios de aceite..."
                    value={formValues.description}
                    onChange={(e) => setFormValues(v => ({ ...v, description: e.target.value }))}
                  />
                </div>

                <div className="modal-field-grid">
                  <div>
                    <label className="modal-field-label">Prioridade</label>
                    <select
                      className="linear-select"
                      value={formValues.priority}
                      onChange={(e) => setFormValues(v => ({ ...v, priority: e.target.value }))}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.key} value={p.key}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="modal-field-label">Etiqueta</label>
                    <select
                      className="linear-select"
                      value={formValues.label}
                      onChange={(e) => setFormValues(v => ({ ...v, label: e.target.value }))}
                    >
                      {LABELS.map((l) => (
                        <option key={l.key} value={l.key}>{l.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="modal-field-label">Prazo de Entrega</label>
                    <input
                      type="date"
                      className="linear-input"
                      value={formValues.dueDate}
                      onChange={(e) => setFormValues(v => ({ ...v, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-linear-secondary"
                  onClick={() => setIsNewTicketModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-linear-primary"
                  disabled={createMutation.isPending || !formValues.title.trim()}
                >
                  {createMutation.isPending ? 'Criando...' : 'Criar Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR PROJETO */}
      {isNewProjectModalOpen && (
        <div className="linear-modal-overlay">
          <div className="linear-modal-box">
            <div className="modal-header">
              <span>Criar Novo Projeto</span>
              <button className="card-icon-btn" onClick={() => setIsNewProjectModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const trimmed = newProjectValues.title.trim()
                if (!trimmed) return
                createProjectMutation.mutate({
                  title: trimmed,
                  description: newProjectValues.description.trim() || null
                })
              }}
            >
              <div className="modal-body">
                <div>
                  <label className="text-xs text-zinc-400 font-medium mb-1 block">Nome do Projeto</label>
                  <input
                    type="text"
                    className="linear-input"
                    placeholder="Ex.: Redesign do Dashboard"
                    value={newProjectValues.title}
                    onChange={(e) => setNewProjectValues(v => ({ ...v, title: e.target.value }))}
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-medium mb-1 block">Descrição</label>
                  <textarea
                    rows={3}
                    className="linear-textarea"
                    placeholder="Metas ou escopo do projeto..."
                    value={newProjectValues.description}
                    onChange={(e) => setNewProjectValues(v => ({ ...v, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-linear-secondary"
                  onClick={() => setIsNewProjectModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-linear-primary"
                  disabled={createProjectMutation.isPending || !newProjectValues.title.trim()}
                >
                  {createProjectMutation.isPending ? 'Criando...' : 'Salvar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR TICKET */}
      {editingTicket && (
        <div className="linear-modal-overlay">
          <div className="linear-modal-box">
            <div className="modal-header">
              <span>Detalhes da Issue #{editingTicket.id}</span>
              <button className="card-icon-btn" onClick={() => setEditingTicket(null)}>
                <X size={16} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!editingValues.title.trim()) return
                updateMutation.mutate({
                  id: editingTicket.id,
                  data: {
                    title: editingValues.title.trim(),
                    description: editingValues.description?.trim() || null,
                    priority: editingValues.priority,
                    label: editingValues.label,
                    dueDate: editingValues.dueDate || null
                  }
                })
                setEditingTicket(null)
              }}
            >
              <div className="modal-body">
                <div>
                  <label className="text-xs text-zinc-400 font-medium mb-1 block">Título</label>
                  <input
                    type="text"
                    className="linear-input"
                    value={editingValues.title}
                    onChange={(e) => setEditingValues(v => ({ ...v, title: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-zinc-400 font-medium mb-1 block">Descrição</label>
                  <textarea
                    rows={3}
                    className="linear-textarea"
                    value={editingValues.description}
                    onChange={(e) => setEditingValues(v => ({ ...v, description: e.target.value }))}
                  />
                </div>

                <div className="modal-field-grid">
                  <div>
                    <label className="modal-field-label">Prioridade</label>
                    <select
                      className="linear-select"
                      value={editingValues.priority}
                      onChange={(e) => setEditingValues(v => ({ ...v, priority: e.target.value }))}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.key} value={p.key}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="modal-field-label">Etiqueta</label>
                    <select
                      className="linear-select"
                      value={editingValues.label}
                      onChange={(e) => setEditingValues(v => ({ ...v, label: e.target.value }))}
                    >
                      {LABELS.map((l) => (
                        <option key={l.key} value={l.key}>{l.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="modal-field-label">Prazo de Entrega</label>
                    <input
                      type="date"
                      className="linear-input"
                      value={editingValues.dueDate}
                      onChange={(e) => setEditingValues(v => ({ ...v, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-linear-secondary"
                  onClick={() => setEditingTicket(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-linear-primary"
                  disabled={updateMutation.isPending}
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
