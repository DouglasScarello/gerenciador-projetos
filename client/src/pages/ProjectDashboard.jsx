import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import api from '../services/api'
import toast from 'react-hot-toast'
import './ProjectDashboard.css'

const STAGES = [
  { key: 'todo', label: 'Para fazer', helper: 'Tickets que ainda precisam ser iniciados.' },
  { key: 'in_progress', label: 'Em andamento', helper: 'Atividades nas quais você já começou a trabalhar.' },
  { key: 'done', label: 'Concluído', helper: 'Tudo que foi finalizado e arquivado.' },
]

const stageOrder = STAGES.map((stage) => stage.key)

// Removido getTicketId legado do MongoDB (Senior standardization)

export default function ProjectDashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [formValues, setFormValues] = useState({ title: '', description: '' })
  const [editingTicket, setEditingTicket] = useState(null)
  const [editingValues, setEditingValues] = useState({ title: '', description: '' })
  const [draggingTicketId, setDraggingTicketId] = useState(null)
  const [activeDropStage, setActiveDropStage] = useState(null)

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [newProjectValues, setNewProjectValues] = useState({ title: '', description: '' })

  // 1. Buscar todos os projetos para o seletor
  const { data: projectsResponse } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projetos')
      return res.data
    }
  })

  const projects = projectsResponse?.data || []

  // Auto-selecionar o primeiro projeto se nada estiver selecionado
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  // Mutation para criar Projeto
  const createProjectMutation = useMutation({
    mutationFn: (newProj) => api.post('/projetos', newProj),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Projeto criado com sucesso!')
      setIsNewProjectModalOpen(false)
      setNewProjectValues({ title: '', description: '' })
      if (res.data?.data?.id) {
        setSelectedProjectId(res.data.data.id)
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Erro ao criar projeto')
    }
  })

  // Mutation para excluir Projeto
  const deleteProjectMutation = useMutation({
    mutationFn: (projId) => api.delete(`/projetos/${projId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Projeto excluído com sucesso!')
      setSelectedProjectId(null)
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Erro ao excluir projeto')
    }
  })

  // 2. Buscar TAREFAS do projeto selecionado (Alinhamento Arquitetural)
  const { data: tasksResponse, isLoading, error: fetchError } = useQuery({
    queryKey: ['tasks', selectedProjectId],
    queryFn: async () => {
      if (!selectedProjectId) return { data: [] }
      const res = await api.get(`/tarefas?projectId=${selectedProjectId}`)
      return res.data
    },
    enabled: !!selectedProjectId
  })

  const tickets = tasksResponse?.data || []

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newTask) => api.post('/tarefas', { ...newTask, project_id: selectedProjectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId] })
      toast.success('Tarefa criada com sucesso!')
      setFormValues({ title: '', description: '' })
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Erro ao criar tarefa')
    }
  })

  // ⚡ OPTIMISTIC UPDATE: Mover Ticket
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/tarefas/${id}`, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', selectedProjectId] })
      const previousData = queryClient.getQueryData(['tasks', selectedProjectId])

      queryClient.setQueryData(['tasks', selectedProjectId], (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((ticket) =>
            String(ticket.id) === String(id) ? { ...ticket, ...data } : ticket
          )
        }
      })

      return { previousData }
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['tasks', selectedProjectId], context.previousData)
      }
      toast.error(err.response?.data?.error?.message || 'Erro ao atualizar')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId] })
    }
  })

  // ⚡ OPTIMISTIC UPDATE: Deletar Ticket
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/tarefas/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', selectedProjectId] })
      const previousData = queryClient.getQueryData(['tasks', selectedProjectId])

      queryClient.setQueryData(['tasks', selectedProjectId], (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.filter((ticket) => String(ticket.id) !== String(id))
        }
      })

      return { previousData }
    },
    onSuccess: () => {
      toast.success('Tarefa removida')
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['tasks', selectedProjectId], context.previousData)
      }
      toast.error(err.response?.data?.error?.message || 'Erro ao remover')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId] })
    }
  })

  useEffect(() => {
    document.body.style.backgroundColor = '#f0f2f5'
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [])

  // ⚡ SINCRONIZAÇÃO EM TEMPO REAL (Sênior)
  useEffect(() => {
    if (!selectedProjectId) return

    // Conectar ao servidor de WebSockets
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      withCredentials: true
    })

    // Entrar na "sala" do projeto atual
    socket.emit('join-project', selectedProjectId)

    // Listeners para invalidar cache
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks', selectedProjectId] })

    socket.on('task:created', invalidate)
    socket.on('task:updated', invalidate)
    socket.on('task:deleted', invalidate)

    return () => {
      socket.disconnect()
    }
  }, [selectedProjectId, queryClient])

  const groupedTickets = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage.key] = tickets.filter((ticket) => (ticket.status || 'todo') === stage.key)
      return acc
    }, {})
  }, [tickets])

  async function handleCreateTicket(event) {
    event.preventDefault()
    const trimmedTitle = formValues.title?.trim() || ''
    if (!trimmedTitle) {
      toast.error('O título é obrigatório')
      return
    }

    createMutation.mutate({
      title: trimmedTitle,
      description: formValues.description?.trim() || null,
      status: 'todo',
    })
  }

  async function handleDeleteTicket(ticket) {
    const ticketId = ticket.id
    if (!ticketId) return
    if (window.confirm('Tem certeza que deseja excluir este ticket?')) {
      deleteMutation.mutate(ticketId)
    }
  }

  async function handleMoveTicket(ticket, direction) {
    const ticketId = ticket.id
    if (!ticketId) return

    const currentIndex = stageOrder.indexOf(ticket.status || 'todo')
    const nextStage = stageOrder[currentIndex + direction]
    if (!nextStage) return

    updateMutation.mutate({ id: ticketId, data: { status: nextStage } })
  }

  function handleDragStart(event, ticket) {
    const ticketId = ticket.id
    if (!ticketId) return
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(ticketId))
    setDraggingTicketId(String(ticketId))
  }

  function handleDragEnd() {
    setDraggingTicketId(null)
    setActiveDropStage(null)
  }

  function handleDragEnter(event, stageKey) {
    event.preventDefault()
    if (!draggingTicketId) return
    setActiveDropStage(stageKey)
  }

  function handleDragLeave(event, stageKey) {
    if (!draggingTicketId) return
    const relatedTarget = event.relatedTarget
    if (relatedTarget && event.currentTarget.contains(relatedTarget)) return
    setActiveDropStage((current) => (current === stageKey ? null : current))
  }

  async function handleDrop(event, stageKey) {
    event.preventDefault()
    const ticketId = event.dataTransfer.getData('text/plain')
    setActiveDropStage(null)
    if (!ticketId) return

    const ticket = tickets.find((item) => String(item.id) === ticketId)
    if (!ticket || (ticket.status || 'todo') === stageKey) return

    updateMutation.mutate({ id: ticketId, data: { status: stageKey } })
  }

  function openEditModal(ticket) {
    setEditingTicket(ticket)
    setEditingValues({
      title: ticket.title || '',
      description: ticket.description || '',
    })
  }

  function closeEditModal() {
    setEditingTicket(null)
    setEditingValues({ title: '', description: '' })
  }

  async function handleEditSubmit(event) {
    event.preventDefault()
    if (!editingTicket) return
    const ticketId = editingTicket.id
    if (!ticketId) return

    updateMutation.mutate({
      id: ticketId,
      data: {
        title: editingValues.title.trim(),
        description: editingValues.description?.trim() || null
      }
    })
    closeEditModal()
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
      toast.success('Até logo!')
      navigate('/login')
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
      navigate('/login')
    }
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <header className="dashboard-top">
          <div>
            <h1>Central de tickets</h1>
            <p>Organize suas tarefas pessoais por estágio e acompanhe o progresso.</p>
          </div>

          <div className="project-selector-wrapper flex items-center gap-2">
            <label htmlFor="project-select">Projeto:</label>
            <select
              id="project-select"
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              className="project-select"
            >
              {projects.length === 0 && <option value="">Nenhum projeto cadastrado</option>}
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <button
              type="button"
              className="ghost-button"
              title="Criar novo projeto"
              onClick={() => setIsNewProjectModalOpen(true)}
            >
              + Novo Projeto
            </button>
            {selectedProjectId && (
              <button
                type="button"
                className="danger-button"
                title="Excluir este projeto"
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja excluir este projeto e todas as suas tarefas?')) {
                    deleteProjectMutation.mutate(selectedProjectId)
                  }
                }}
                disabled={deleteProjectMutation.isPending}
              >
                {deleteProjectMutation.isPending ? 'Excluindo...' : 'Excluir Projeto'}
              </button>
            )}
          </div>

          <button type="button" className="logout-button" onClick={logout}>
            Sair
          </button>
        </header>

        <section className="create-card">
          <h2>Novo ticket</h2>
          <form className="create-form" onSubmit={handleCreateTicket}>
            <div className="form-field">
              <label htmlFor="ticket-title">Título</label>
              <input
                id="ticket-title"
                type="text"
                value={formValues.title}
                onChange={(event) => setFormValues((state) => ({ ...state, title: event.target.value }))}
                placeholder="Ex.: Ajustar layout da home"
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="ticket-description">Descrição</label>
              <textarea
                id="ticket-description"
                value={formValues.description}
                onChange={(event) => setFormValues((state) => ({ ...state, description: event.target.value }))}
                placeholder="Adicione detalhes importantes"
                rows={3}
              />
            </div>
            <button type="submit" className="primary-button" disabled={createMutation.isPending || !formValues.title.trim()}>
              {createMutation.isPending ? 'Criando...' : 'Criar ticket'}
            </button>
          </form>
        </section>

        {fetchError && <div className="error-banner">Erro ao carregar tickets.</div>}

        <section className="board">
          {STAGES.map((stage) => (
            <div
              key={stage.key}
              className={`ticket-column${activeDropStage === stage.key ? ' ticket-column--droppable' : ''}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, stage.key)}
              onDragEnter={(event) => handleDragEnter(event, stage.key)}
              onDragLeave={(event) => handleDragLeave(event, stage.key)}
            >
              <header className="ticket-column__header">
                <div>
                  <span className="ticket-column__title">{stage.label}</span>
                  <p className="ticket-column__helper">{stage.helper}</p>
                </div>
                <span className="ticket-column__badge">{groupedTickets[stage.key]?.length || 0}</span>
              </header>

              <div className="ticket-column__body">
                {isLoading && <p className="column-placeholder">Carregando...</p>}
                {!isLoading && groupedTickets[stage.key]?.length === 0 && (
                  <p className="column-placeholder">Sem tickets aqui ainda.</p>
                )}

                {groupedTickets[stage.key]?.map((ticket) => {
                  const ticketId = ticket.id
                  const canMoveBackward = stageOrder.indexOf(stage.key) > 0
                  const canMoveForward = stageOrder.indexOf(stage.key) < stageOrder.length - 1

                  // 🎯 Loading Granular Sênior
                  const isUpdating = updateMutation.isPending && String(updateMutation.variables?.id) === String(ticketId)
                  const isDeleting = deleteMutation.isPending && String(deleteMutation.variables) === String(ticketId)

                  return (
                    <article
                      key={ticketId}
                      className={`ticket-card ticket-card--${stage.key}${String(ticketId) === draggingTicketId ? ' is-dragging' : ''}${isDeleting ? ' is-deleting' : ''}`}
                      draggable
                      role="listitem"
                      aria-grabbed={String(ticketId) === draggingTicketId}
                      tabIndex={0}
                      onDragStart={(event) => handleDragStart(event, ticket)}
                      onDragEnd={handleDragEnd}
                    >
                      <h3>{ticket.title}</h3>
                      {ticket.description && <p>{ticket.description}</p>}
                      <div className="ticket-card__actions" role="toolbar" aria-label="Ações do ticket">
                        <button
                          type="button"
                          className="ghost-button"
                          aria-label={`Mover ${ticket.title} para trás`}
                          onClick={() => handleMoveTicket(ticket, -1)}
                          disabled={!canMoveBackward || isUpdating || isDeleting}
                        >
                          {isUpdating ? '...' : '←'}
                        </button>
                        <button 
                          type="button" 
                          className="ghost-button" 
                          aria-label={`Editar ${ticket.title}`}
                          onClick={() => openEditModal(ticket)} 
                          disabled={isUpdating || isDeleting}
                        >
                          Detalhes
                        </button>
                        <button 
                          type="button" 
                          className="danger-button" 
                          aria-label={`Excluir ${ticket.title}`}
                          onClick={() => handleDeleteTicket(ticket)} 
                          disabled={isDeleting || isUpdating}
                        >
                          {isDeleting ? 'Excluindo...' : 'Excluir'}
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
                          aria-label={`Mover ${ticket.title} para frente`}
                          onClick={() => handleMoveTicket(ticket, 1)}
                          disabled={!canMoveForward || isUpdating || isDeleting}
                        >
                          {isUpdating ? '...' : '→'}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          ))}
        </section> board
      </div> dashboard-container

      {isNewProjectModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <button type="button" className="modal-close" onClick={() => setIsNewProjectModalOpen(false)}>×</button>
            <h2>Novo Projeto</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const trimmed = newProjectValues.title.trim()
                if (!trimmed) {
                  toast.error('Informe o título do projeto')
                  return
                }
                createProjectMutation.mutate({
                  title: trimmed,
                  description: newProjectValues.description.trim() || null
                })
              }}
              className="modal-form"
            >
              <label>Título do Projeto</label>
              <input
                type="text"
                placeholder="Ex.: Lançamento do Produto"
                value={newProjectValues.title}
                onChange={(e) => setNewProjectValues(v => ({ ...v, title: e.target.value }))}
                required
              />
              <label>Descrição (opcional)</label>
              <textarea
                rows={3}
                placeholder="Detalhes ou metas do projeto"
                value={newProjectValues.description}
                onChange={(e) => setNewProjectValues(v => ({ ...v, description: e.target.value }))}
              />
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={() => setIsNewProjectModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-button" disabled={createProjectMutation.isPending}>
                  {createProjectMutation.isPending ? 'Criando...' : 'Criar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTicket && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <button type="button" className="modal-close" onClick={closeEditModal}>×</button>
            <h2>Editar ticket</h2>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <label>Título</label>
              <input
                type="text"
                value={editingValues.title}
                onChange={(event) => setEditingValues((state) => ({ ...state, title: event.target.value }))}
                required
              />
              <label>Descrição</label>
              <textarea
                rows={4}
                value={editingValues.description}
                onChange={(event) => setEditingValues((state) => ({ ...state, description: event.target.value }))}
              />
              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeEditModal}>Cancelar</button>
                <button type="submit" className="primary-button" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar mudanças'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
