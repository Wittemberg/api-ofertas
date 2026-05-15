import { useState, useEffect } from 'react'
import { getOffers, deleteOffer } from '../api/offers'

export default function Offers() {
  const [offers, setOffers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const limit = 10

  useEffect(() => {
    getOffers({ page, limit, search: search || undefined })
      .then(res => {
        setOffers(res.data.offers)
        setTotal(res.data.total)
      })
  }, [page, search])

  const handleDelete = (id) => {
    if (confirm('Excluir esta oferta?')) {
      deleteOffer(id).then(() => {
        setOffers(prev => prev.filter(o => o.id !== id))
        setTotal(prev => prev - 1)
      })
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Ofertas ({total})</h1>

        <input
          type="text" placeholder="Buscar por produto..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full p-3 border rounded-lg mb-4"
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Produto</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Loja</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">De</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Por</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Destaque</th>
                <th className="text-left p-3 text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(offer => (
                <tr key={offer.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{offer.product?.name}</td>
                  <td className="p-3 text-gray-600">{offer.store?.name || '-'}</td>
                  <td className="p-3">
                    {offer.price_from ? `R$ ${Number(offer.price_from).toFixed(2)}` : '-'}
                  </td>
                  <td className="p-3 font-semibold text-green-600">
                    R$ {Number(offer.price_to).toFixed(2)}
                  </td>
                  <td className="p-3">
                    {offer.is_featured
                      ? <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Sim</span>
                      : '-'}
                  </td>
                  <td className="p-3">
                    <button onClick={() => handleDelete(offer.id)}
                      className="text-red-600 hover:text-red-800 text-sm">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {offers.length === 0 && (
                <tr><td colSpan="6" className="p-6 text-center text-gray-400">Nenhuma oferta encontrada</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50">
              Anterior
            </button>
            <span className="px-4 py-2 text-gray-600">
              {page} de {totalPages}
            </span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50">
              Próximo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}