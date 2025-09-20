import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useApp } from '../../../contexts/AppContext';

const Notification = () => {
  const { notification, clearNotification } = useApp();

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    clearNotification();
  };

  if (!notification) return null;

  return (
    <Snackbar
      open={notification.open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={handleClose}
        severity={notification.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export default Notification;