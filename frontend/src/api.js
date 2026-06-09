import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('vito_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || '';

    if (status === 401 && url.includes('/auth/')) {
      sessionStorage.removeItem('vito_token');
      window.location.href = '/login';
    }

    return Promise.reject(err);
  }
);

export default api;
