import axios from 'axios';

// En desarrollo local apunta a http://localhost:8000 por defecto.
// En producción (Vercel) utiliza '/api' (mismo dominio serverless) o la variable VITE_API_BASE_URL si se define.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;