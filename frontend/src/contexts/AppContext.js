import React, { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };
    case 'SET_AUTH_TOKEN':
      return { ...state, authToken: action.payload };
    default:
      return state;
  }
};

const initialState = {
  loading: false,
  notification: null,
  sidebarOpen: false,
  authToken: localStorage.getItem('authToken'),
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const showNotification = (message, severity = 'info') => {
    dispatch({ 
      type: 'SET_NOTIFICATION', 
      payload: { message, severity, open: true } 
    });
  };

  const clearNotification = () => {
    dispatch({ type: 'CLEAR_NOTIFICATION' });
  };

  const setSidebarOpen = (open) => {
    dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open });
  };

  const setAuthToken = (token) => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
    dispatch({ type: 'SET_AUTH_TOKEN', payload: token });
  };

  const value = {
    ...state,
    setLoading,
    showNotification,
    clearNotification,
    setSidebarOpen,
    setAuthToken,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};