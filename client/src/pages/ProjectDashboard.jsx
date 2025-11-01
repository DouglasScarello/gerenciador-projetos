import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
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
  const [tickets, setTickets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [formValues, setFormValues] = useState({ title: '', description: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingTicket, setEditingTicket] = useState(null)
  const [editingValues, setEditingValues] = useState({ title: '', description: '' })
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [draggingTicketId, setDraggingTicketId] = useState(null)
  const [activeDropStage, setActiveDropStage] = useState(null)

  useEffect(() => {
    document.body.style.backgroundColor = '#f0f2f5'
    loadTickets()
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

  async function loadTickets() {
    try {
      setIsLoading(true)
      const { data } = await api.get('/projetos')
      setTickets(data)
      setError('')
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login')
        return
      }
      setError(err.response?.data?.message || 'Não foi possível carregar os tickets.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateTicket(event) {
    event.preventDefault()
    setError('')
    
    const trimmedTitle = formValues.title?.trim() || ''
    if (!trimmedTitle) {
      setError('O título é obrigatório')
      return
    }

    try {
      setIsSubmitting(true)
      const trimmedDescription = formValues.description?.trim()
      const payload = {
        title: trimmedTitle,
        description: trimmedDescription && trimmedDescription.length > 0 ? trimmedDescription : undefined,
        status: 'todo',
      }
      
      console.log('Criando ticket com payload:', payload)
      const response = await api.post('/projetos', payload)
      console.log('Resposta do servidor:', response)
      console.log('Response data:', response.data)
      
      // Se chegou aqui, a criação foi bem-sucedida
      setFormValues({ title: '', description: '' })
      await loadTickets()
    } catch (err) {
      console.error('Erro completo ao criar ticket:', err)
      console.error('Response:', err.response)
      console.error('Data:', err.response?.data)
      console.error('Status:', err.response?.status)
      
      let errorMessage = 'Não foi possível criar o ticket.'
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteTicket(ticket) {
    const ticketId = getTicketId(ticket)
    if (!ticketId) {
      setError('ID do ticket não encontrado')
      return
    }

    if (!window.confirm('Tem certeza que deseja excluir este ticket?')) {
      return
    }

    try {
      setError('')
      await api.delete(`/projetos/${ticketId}`)
      await loadTickets()
    } catch (err) {
      console.error('Erro ao excluir ticket:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao excluir o ticket.'
      setError(errorMessage)
    }
  }

  async function handleMoveTicket(ticket, direction) {
    const ticketId = getTicketId(ticket)
    if (!ticketId) {
      setError('ID do ticket não encontrado')
      return
    }

    const currentIndex = stageOrder.indexOf(ticket.status || 'todo')
    const nextStage = stageOrder[currentIndex + direction]
    if (!nextStage) {
      return
    }

    try {
      setError('')
      const response = await api.put(`/projetos/${ticketId}`, { status: nextStage })
      if (response.data) {
        await loadTickets()
      }
    } catch (err) {
      console.error('Erro ao mover ticket:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Não foi possível atualizar o status.'
      setError(errorMessage)
    }
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
    if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
      return
    }

    setActiveDropStage((current) => (current === stageKey ? null : current))
  }

  async function handleDrop(event, stageKey) {
    event.preventDefault()
    const ticketId = event.dataTransfer.getData('text/plain')
    setActiveDropStage(null)
    if (!ticketId) {
      return
    }

    const ticket = tickets.find((item) => String(getTicketId(item)) === ticketId)
    if (!ticket) {
      setError('Ticket não encontrado')
      return
    }

    const currentStage = ticket.status || 'todo'
    if (currentStage === stageKey) {
      return
    }

    try {
      setError('')
      const response = await api.put(`/projetos/${ticketId}`, { status: stageKey })
      if (response.data) {
        await loadTickets()
      }
    } catch (err) {
      console.error('Erro ao mover ticket por drag:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Não foi possível atualizar o status.'
      setError(errorMessage)
    }
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
    setIsSavingEdit(false)
  }

  async function handleEditSubmit(event) {
    event.preventDefault()
    if (!editingTicket) return

    const ticketId = getTicketId(editingTicket)
    if (!ticketId) {
      setError('ID do ticket não encontrado')
      return
    }

    if (!editingValues.title || !editingValues.title.trim()) {
      setError('O título é obrigatório')
      return
    }

    try {
      setIsSavingEdit(true)
      setError('')
      const response = await api.put(`/projetos/${ticketId}`, {
        title: editingValues.title.trim(),
        description: editingValues.description?.trim() || '',
      })
      if (response.data) {
        closeEditModal()
        await loadTickets()
      }
    } catch (err) {
      console.error('Erro ao salvar edição:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Não foi possível salvar as alterações.'
      setError(errorMessage)
      setIsSavingEdit(false)
    }
  }

  function logout() {
    localStorage.removeItem('token')
    navigate('/login')
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
          <p>Descreva rapidamente o que precisa ser feito. Ele começa em “Para fazer”.</p>
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
                placeholder="Adicione detalhes, links ou anotações importantes"
                rows={3}
              />
            </div>
            <button type="submit" className="primary-button" disabled={isSubmitting || !formValues.title.trim()}>
              {isSubmitting ? 'Criando...' : 'Criar ticket'}
            </button>
          </form>
        </section>

        {error && <div className="error-banner">{error}</div>}

        <section className="board">
          {STAGES.map((stage) => (
            <div
              key={stage.key}
              className={`ticket-column${activeDropStage === stage.key ? ' ticket-column--droppable' : ''}`}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
              }}
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

                  return (
                    <article
                      key={ticketId}
                      className={`ticket-card ticket-card--${stage.key}${String(ticketId) === draggingTicketId ? ' is-dragging' : ''}`}
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
                          disabled={!canMoveBackward}
                        >
                          ← Voltar
                        </button>
                        <button type="button" className="ghost-button" onClick={() => openEditModal(ticket)}>
                          Detalhes
                        </button>
                        <button type="button" className="danger-button" onClick={() => handleDeleteTicket(ticket)}>
                          Excluir
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={() => handleMoveTicket(ticket, 1)}
                          disabled={!canMoveForward}
                        >
                          Avançar →
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          ))}
        </section>
      </div>

      {editingTicket && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <button type="button" className="modal-close" onClick={closeEditModal} aria-label="Fechar">
              ×
            </button>
            <h2>Editar ticket</h2>
            <form onSubmit={handleEditSubmit} className="modal-form">
              <label htmlFor="edit-title">Título</label>
              <input
                id="edit-title"
                type="text"
                value={editingValues.title}
                onChange={(event) => setEditingValues((state) => ({ ...state, title: event.target.value }))}
                required
              />

              <label htmlFor="edit-description">Descrição</label>
              <textarea
                id="edit-description"
                rows={4}
                value={editingValues.description}
                onChange={(event) => setEditingValues((state) => ({ ...state, description: event.target.value }))}
                placeholder="Descreva o contexto, checklist ou resultados esperados"
              />

              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeEditModal}>
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={isSavingEdit}>
                  {isSavingEdit ? 'Salvando...' : 'Salvar mudanças'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
