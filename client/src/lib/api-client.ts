import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const userProfileStr = localStorage.getItem('user_profile');
    if (userProfileStr) {
      try {
        const u = JSON.parse(userProfileStr);
        if (u.id) config.headers['x-user-id'] = u.id;
        if (u.email) config.headers['x-user-email'] = u.email;
      } catch (e) {}
    }
  }
  return config;
});
