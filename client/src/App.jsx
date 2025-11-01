import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import ProjectDashboard from './pages/ProjectDashboard'
import ProjectDetails from './pages/ProjectDetails'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/projects" element={<ProjectDashboard />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
    </BrowserRouter>
  )
}

export default App
