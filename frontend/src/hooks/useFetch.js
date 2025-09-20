import { useState, useEffect } from 'react';
import api from '../services/api';

export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

// C:\Users\johnii\Downloads\library-management-system\frontend\src\hooks\useFetch.js

const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    console.log(`[FETCH] GET ${url}`); // 👈 log URL being requested

    const response = await api.get(url, options);

    let responseData = response.data;
    if (responseData && typeof responseData === 'object') {
      if (responseData.results !== undefined) {
        responseData = responseData.results;
      }
    }
    setData(responseData);
  } catch (err) {
    console.error(`[FETCH ERROR] GET ${url}`, err.response?.data || err.message);
    setError(err.response?.data || err.message);
    setData(null);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchData();
  }, [url]);

  const refetch = () => {
    fetchData();
  };

  return { data, loading, error, refetch };
};