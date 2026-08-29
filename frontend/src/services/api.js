import axios from 'axios';

const TOKEN_KEY = 'aip_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function getHealth() {
  const { data } = await api.get('/health');
  return data;
}

export async function registerUser({ name, email, password }) {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
}

export async function loginUser({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function logoutUser() {
  const { data } = await api.post('/auth/logout');
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function getProfile() {
  const { data } = await api.get('/profile');
  return data;
}

export async function updateProfile(payload) {
  const { data } = await api.put('/profile', payload);
  return data;
}

export { TOKEN_KEY };
export default api;
