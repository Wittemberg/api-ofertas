import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ImportCSV from './pages/ImportCSV'
import Offers from './pages/Offers'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="p-8 text-center">Carregando...</div>
  return user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/importar" element={<ProtectedRoute><ImportCSV /></ProtectedRoute>} />
          <Route path="/ofertas" element={<ProtectedRoute><Offers /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App