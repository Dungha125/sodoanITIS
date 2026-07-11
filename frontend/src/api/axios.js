import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

let isRedirecting = false;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    if (status === 403 && typeof detail === 'string' && detail.includes('chặn')) {
      toast.error(detail, { autoClose: false });
      if (!isRedirecting) {
        isRedirecting = true;
        localStorage.clear();
        setTimeout(() => { window.location.href = '/login'; }, 2000);
      }
      return Promise.reject(error);
    }

    if (status === 429) {
      toast.warning('Quá nhiều request. Vui lòng thử lại sau.');
      return Promise.reject(error);
    }

    if (status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refresh });
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
