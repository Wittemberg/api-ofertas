import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getProducts } from '../api/products'
import { getStores } from '../api/stores'
import { getOffers } from '../api/offers'

export default function Dashboard() {
  const { user, setUser } = useAuth()
  const [stats, setStats] = useState({ products: 0, stores: 0, offers: 0 })

  useEffect(() => {
    Promise.all([
      getProducts({ limit: 1 }),
      getStores(),
      getOffers({ limit: 1 })
    ]).then(([products, stores, offers]) => {
      setStats({
        products: products.data.total,
        stores: stores.data.length,
        offers: offers.data.total
      })
    })
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const cards = [
    { label: 'Produtos', value: stats.products, color: 'bg-blue-500' },
    { label: 'Lojas', value: stats.stores, color: 'bg-green-500' },
    { label: 'Ofertas', value: stats.offers, color: 'bg-purple-500' }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Admin Ofertas</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {cards.map(card => (
            <div key={card.label} className="bg-white rounded-lg shadow-md p-6">
              <div className={`w-12 h-12 ${card.color} rounded-lg mb-4`} />
              <h2 className="text-gray-600 text-sm">{card.label}</h2>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Links rápidos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/importar"
              className="bg-blue-50 text-blue-700 p-4 rounded-lg hover:bg-blue-100 text-center font-medium">
              Importar CSV
            </a>
            <a href="/ofertas"
              className="bg-purple-50 text-purple-700 p-4 rounded-lg hover:bg-purple-100 text-center font-medium">
              Gerenciar Ofertas
            </a>
            <a href="/produtos"
              className="bg-green-50 text-green-700 p-4 rounded-lg hover:bg-green-100 text-center font-medium">
              Ver Produtos
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}