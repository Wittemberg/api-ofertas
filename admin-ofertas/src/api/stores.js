import api from './axios'

export const getStores = () => api.get('/stores')