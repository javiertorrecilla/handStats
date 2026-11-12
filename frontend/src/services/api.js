import axios from 'axios';
import { captureError } from './errorTrackingService';

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const reqUrl = String(error?.config?.url || '');
    const status = error?.response?.status;
    const isCanceled = axios.isCancel?.(error) || error?.code === 'ERR_CANCELED';
    if (!isCanceled && !reqUrl.includes('/telemetry/errors') && (!status || status >= 500)) {
      captureError(error, {
        source: 'api_interceptor',
        route: reqUrl,
        fatal: false,
      });
    }
    return Promise.reject(error);
  }
);

export default api;