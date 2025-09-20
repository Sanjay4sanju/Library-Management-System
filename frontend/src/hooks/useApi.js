import { useState, useCallback } from 'react';
import api from '../services/api';
import { useApp } from '../contexts/AppContext';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { authToken, logout } = useApp();

  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Add authorization header if token exists
      const headers = {
        ...config.headers,
        'Authorization': `Bearer ${authToken}`,
      };

      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await api.get(url, { ...config, headers });
          break;
        case 'post':
          response = await api.post(url, data, { ...config, headers });
          break;
        case 'put':
          response = await api.put(url, data, { ...config, headers });
          break;
        case 'delete':
          response = await api.delete(url, { ...config, headers });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      
      // If token is invalid, log out the user
      if (err.response?.status === 401) {
        logout();
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [authToken, logout]);

  const get = useCallback((url, config) => request('get', url, null, config), [request]);
  const post = useCallback((url, data, config) => request('post', url, data, config), [request]);
  const put = useCallback((url, data, config) => request('put', url, data, config), [request]);
  const del = useCallback((url, config) => request('delete', url, null, config), [request]);

  return {
    loading,
    error,
    get,
    post,
    put,
    del,
    clearError: () => setError(null),
  };
};