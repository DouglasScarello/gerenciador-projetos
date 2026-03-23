import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../services/api'

export default function ProtectedRoute({ children }) {
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        async function verifyAuth() {
            try {
                await api.get('/auth/me')
                setIsAuthenticated(true)
            } catch (err) {
                setIsAuthenticated(false)
            } finally {
                setLoading(false)
            }
        }
        verifyAuth()
    }, [])

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return children
}
