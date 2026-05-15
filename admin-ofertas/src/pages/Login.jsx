import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await login(email, password)
      localStorage.setItem('token', res.data.token)
      setUser(res.data.user)
      navigate('/')
    } catch {
      setError('Email ou senha inválidos')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Acesso ao Painel
        </h1>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <input type="email" placeholder="Email"
          className="w-full p-3 border rounded mb-4"
          value={email} onChange={e => setEmail(e.target.value)} required />

        <input type="password" placeholder="Senha"
          className="w-full p-3 border rounded mb-6"
          value={password} onChange={e => setPassword(e.target.value)} required />

        <button type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700">
          Entrar
        </button>
      </form>
    </div>
  )
}