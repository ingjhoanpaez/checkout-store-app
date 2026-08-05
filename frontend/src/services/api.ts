import axios from 'axios';

// VITE_API_URL se define por entorno (dev/docker/prod). Fallback a
// localhost:3000 para desarrollo local sin Docker.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
});
