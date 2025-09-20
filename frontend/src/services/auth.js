import api from './api';

export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login/', credentials);
      if (response.data.access) {
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data);
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData);
      if (response.data.access) {
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
      }
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      throw error;
    }
  },
  
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile/');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error.response?.data);
      throw error;
    }
  },
  
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/auth/profile/update/', userData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error.response?.data);
      throw error;
    }
  },
  
logout: async () => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      await api.post('/auth/logout/', { refresh: refreshToken });
    }
  } catch (error) {
    // Non-critical: maybe the refresh token was already invalid/expired
    console.warn('Logout warning:', error.response?.data || error.message);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
  }
},

  
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post('/auth/token/refresh/', {
        refresh: refreshToken
      });
      
      if (response.data.access) {
        localStorage.setItem('token', response.data.access);
        return response.data.access;
      }
    } catch (error) {
      console.error('Refresh token error:', error.response?.data);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      throw error;
    }
  }
};