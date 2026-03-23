import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import toast from 'react-hot-toast'
import './ProjectDashboard.css'

const STAGES = [
  { key: 'todo', label: 'Para fazer', helper: 'Tickets que ainda precisam ser iniciados.' },
  { key: 'in_progress', label: 'Em andamento', helper: 'Atividades nas quais você já começou a trabalhar.' },
  { key: 'done', label: 'Concluído', helper: 'Tudo que foi finalizado e arquivado.' },
]

const stageOrder = STAGES.map((stage) => stage.key)

function getTicketId(ticket) {
  return ticket.id ?? ticket._id
}

export default function ProjectDashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [formValues, setFormValues] = useState({ title: '', description: '' })
  const [editingTicket, setEditingTicket] = useState(null)
  const [editingValues, setEditingValues] = useState({ title: '', description: '' })
  const [draggingTicketId, setDraggingTicketId] = useState(null)
  const [activeDropStage, setActiveDropStage] = useState(null)

  // Fetching tickets with React Query
  const { data: response, isLoading, error: fetchError } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projetos')
      return res.data // { success: true, data: [...] }
    }
  })

  const tickets = response?.data || []

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newTicket) => api.post('/projetos', newTicket),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Ticket criado com sucesso!')
      setFormValues({ title: '', description: '' })
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message || 'Erro ao criar ticket')
    }
  })

  // ⚡ OPTIMISTIC UPDATE: Mover Ticket
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/projetos/${id}`, data),
    onMutate: async ({ id, data }) => {
      // Cancelar refetches em andamento
      await queryClient.cancelQueries({ queryKey: ['projects'] })

      // Salvar estado anterior para rollback
      const previousData = queryClient.getQueryData(['projects'])

      // Aplicar update otimista no cache
      queryClient.setQueryData(['projects'], (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((ticket) =>
            String(getTicketId(ticket)) === String(id)
              ? { ...ticket, ...data }
              : ticket
          )
        }
      })

      return { previousData }
    },
    onError: (err, variables, context) => {
      // Rollback se falhar
      if (context?.previousData) {
        queryClient.setQueryData(['projects'], context.previousData)
      }
      toast.error(err.response?.data?.error?.message || 'Erro ao atualizar')
    },
    onSettled: () => {
      // Sincronizar com o servidor no final
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })

  // ⚡ OPTIMISTIC UPDATE: Deletar Ticket
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/projetos/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      const previousData = queryClient.getQueryData(['projects'])

      queryClient.setQueryData(['projects'], (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.filter((ticket) => String(getTicketId(ticket)) !== String(id))
        }
      })

      return { previousData }
    },
    onSuccess: () => {
      toast.success('Ticket removido')
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['projects'], context.previousData)
      }
      toast.error(err.response?.data?.error?.message || 'Erro ao remover')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })

  useEffect(() => {
    document.body.style.backgroundColor = '#f0f2f5'
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [])

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
    const ticketId = getTicketId(ticket)
    if (!ticketId) return
    if (window.confirm('Tem certeza que deseja excluir este ticket?')) {
      deleteMutation.mutate(ticketId)
    }
  }

  async function handleMoveTicket(ticket, direction) {
    const ticketId = getTicketId(ticket)
    if (!ticketId) return

    const currentIndex = stageOrder.indexOf(ticket.status || 'todo')
    const nextStage = stageOrder[currentIndex + direction]
    if (!nextStage) return

    updateMutation.mutate({ id: ticketId, data: { status: nextStage } })
  }

  function handleDragStart(event, ticket) {
    const ticketId = getTicketId(ticket)
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

    const ticket = tickets.find((item) => String(getTicketId(item)) === ticketId)
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
    const ticketId = getTicketId(editingTicket)
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
                  const ticketId = getTicketId(ticket)
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
                      onDragStart={(event) => handleDragStart(event, ticket)}
                      onDragEnd={handleDragEnd}
                    >
                      <h3>{ticket.title}</h3>
                      {ticket.description && <p>{ticket.description}</p>}
                      <div className="ticket-card__actions">
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => handleMoveTicket(ticket, -1)}
                          disabled={!canMoveBackward || isUpdating || isDeleting}
                        >
                          {isUpdating ? '...' : '←'}
                        </button>
                        <button type="button" className="ghost-button" onClick={() => openEditModal(ticket)} disabled={isUpdating || isDeleting}>
                          Detalhes
                        </button>
                        <button type="button" className="danger-button" onClick={() => handleDeleteTicket(ticket)} disabled={isDeleting || isUpdating}>
                          {isDeleting ? 'Excluindo...' : 'Excluir'}
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
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
