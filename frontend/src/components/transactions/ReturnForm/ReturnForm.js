import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import { useApi } from '../../../hooks/useApi';
import { useApp } from '../../../contexts/AppContext';
import { formatCurrency } from '../../../utils/helpers';

const ReturnForm = ({ open, onClose, borrowRecord, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  const { post } = useApi();
  const { showNotification } = useApp();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
     await post(`/borrow-records/${borrowRecord.id}/return_book/`, {
        notes: notes.trim() || undefined,
      });

      showNotification('Book returned successfully', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error returning book', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateFine = () => {
  if (!borrowRecord || !borrowRecord.is_overdue) return 0;
  
  const dueDate = new Date(borrowRecord.due_date);
  const today = new Date();
  const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
  return daysOverdue * 1.0; // $1 per day
};


  const fineAmount = calculateFine();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Return Book: {borrowRecord?.book_title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Typography variant="body1" gutterBottom>
            Borrower: {borrowRecord?.borrower_name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Borrowed on: {new Date(borrowRecord?.borrow_date).toLocaleDateString()}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Due date: {new Date(borrowRecord?.due_date).toLocaleDateString()}
          </Typography>

          {borrowRecord?.is_overdue && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This book is overdue. Fine amount: {formatCurrency(fineAmount)}
            </Alert>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Add any notes about the book's condition or other details..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={fineAmount > 0 ? 'warning' : 'primary'}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <CircularProgress size={24} />
          ) : (
            fineAmount > 0 ? `Return with Fine` : 'Return Book'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReturnForm;