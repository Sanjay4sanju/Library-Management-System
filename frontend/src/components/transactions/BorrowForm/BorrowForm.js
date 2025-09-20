import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useApi } from '../../../hooks/useApi';
import { useApp } from '../../../contexts/AppContext';

const BorrowForm = ({ open, onClose, book, onSuccess }) => {
  const [formData, setFormData] = useState({
    user: '',
    due_date: null,
  });
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { get, post } = useApi();
  const { showNotification } = useApp();

  useEffect(() => {
    if (open) {
      fetchUsers();
      setFormData({
        user: '',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      });
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      const data = await get('/users/');
      setUsers(data.filter(user => user.user_type === 'student'));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleChange = (field) => (value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.user) {
      newErrors.user = 'Please select a user';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Please select a due date';
    } else if (formData.due_date < new Date()) {
      newErrors.due_date = 'Due date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await post('/borrow-records/', {
        book: book.id,
        borrower: formData.user,
        due_date: formData.due_date.toISOString().split('T')[0],
      });

      showNotification('Book borrowed successfully', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error borrowing book', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Borrow Book: {book?.title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Available copies: {book?.available_copies}
          </Typography>

          <TextField
            select
            fullWidth
            label="Select User"
            value={formData.user}
            onChange={(e) => handleChange('user')(e.target.value)}
            error={!!errors.user}
            helperText={errors.user}
            sx={{ mt: 2 }}
          >
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.username} - {user.first_name} {user.last_name}
              </MenuItem>
            ))}
          </TextField>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Due Date"
              value={formData.due_date}
              onChange={handleChange('due_date')}
              minDate={new Date()}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  sx={{ mt: 2 }}
                  error={!!errors.due_date}
                  helperText={errors.due_date}
                />
              )}
            />
          </LocalizationProvider>

          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Please fix the errors in the form.
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <CircularProgress size={24} />
          ) : (
            'Borrow Book'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BorrowForm;