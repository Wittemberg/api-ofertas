import { useState, useRef } from 'react'
import api from '../api/axios'

export default function ImportCSV() {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const inputRef = useRef()

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.csv')) setFile(f)
  }

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f?.name.endsWith('.csv')) setFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post('/imports/csv', formData)
      setResult({ type: 'success', data: res.data })
    } catch (err) {
      setResult({ type: 'error', data: err.response?.data || { error: 'Erro ao importar' } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Importar CSV</h1>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition
            ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400'}`}
        >
          <input ref={inputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          {file ? (
            <div>
              <p className="text-lg font-medium text-blue-600">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <button onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="text-red-500 text-sm mt-2 hover:underline">
                Remover
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 text-lg mb-2">
                Arraste o CSV aqui ou clique para selecionar
              </p>
              <p className="text-gray-400 text-sm">
                Formatos aceitos: .csv
              </p>
            </div>
          )}
        </div>

        {file && (
          <button onClick={handleUpload} disabled={loading}
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Importando...' : 'Importar Arquivo'}
          </button>
        )}

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${
            result.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {result.type === 'success' ? (
              <div>
                <p className="text-green-700 font-medium">Importação concluída!</p>
                <p className="text-sm text-green-600 mt-1">
                  {result.data.valid_rows} linhas importadas
                  {result.data.warnings?.length > 0 && `, ${result.data.warnings.length} avisos`}
                  {result.data.errors?.length > 0 && `, ${result.data.errors.length} erros`}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-red-700 font-medium">Erro na importação</p>
                <p className="text-sm text-red-600 mt-1">{result.data.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg p-6">
          <h2 className="font-semibold mb-3">Formato esperado do CSV</h2>
          <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
internal_code,barcode,name,category,price_from,price_to,unit,store_slug,starts_at,ends_at,is_featured{'\n'}
ARZ001,7891234567890,Arroz 5kg,Mercearia,25.90,19.90,UN,campo-grande,2026-05-13,2026-05-20,true
          </pre>
        </div>
      </div>
    </div>
  )
}