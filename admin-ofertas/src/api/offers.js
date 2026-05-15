import api from './axios'

export const getOffers = (params) => api.get('/offers', { params })
export const createOffer = (data) => api.post('/offers', data)
export const deleteOffer = (id) => api.delete(`/offers/${id}`)