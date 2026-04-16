import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxied to 5000 via vite.config.js
});

export const getParkingLots = () => api.get('/parking');
export const getParkingLotById = (id) => api.get(`/parking/${id}`);
export const bookSlot = (id, data) => api.put(`/parking/${id}/book`, data);
export const releaseSlot = (id, data) => api.put(`/parking/${id}/release`, data);