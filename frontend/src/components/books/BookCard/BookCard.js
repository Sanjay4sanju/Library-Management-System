import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
} from '@mui/material';
import {
  Book as BookIcon,
  Person as AuthorIcon,
  Inventory as StockIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import { useApi } from '../../../hooks/useApi';

const BookCard = ({ book, onEdit, onView, onDelete, onBorrow, onReserve }) => {
  const { isLibrarian, isAdmin } = useAuth();
  const { showNotification } = useApp();
  const { post } = useApi();

  const handleBorrow = async () => {
    try {
      await post(`/books/${book.id}/borrow/`);
      showNotification('Book borrowed successfully', 'success');
      if (onBorrow) onBorrow();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error borrowing book', 'error');
    }
  };

  const handleReserve = async () => {
    try {
      await post(`/books/${book.id}/reserve/`);
      showNotification('Book reserved successfully', 'success');
      if (onReserve) onReserve();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error reserving book', 'error');
    }
  };

  const getStatusColor = () => {
    if (book.available_copies === 0) return 'error';
    if (book.available_copies < book.total_copies / 2) return 'warning';
    return 'success';
  };

  const getStatusText = () => {
    if (book.available_copies === 0) return 'Out of Stock';
    if (book.available_copies < book.total_copies / 2) return 'Low Stock';
    return 'Available';
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="div"
        sx={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'grey.100',
        }}
      >
        {book.cover_image ? (
          <img
            src={book.cover_image}
            alt={book.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <BookIcon sx={{ fontSize: 64, color: 'grey.400' }} />
        )}
      </CardMedia>

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          {book.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <AuthorIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {book.author}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <StockIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {book.available_copies} / {book.total_copies} available
          </Typography>
        </Box>

        <Chip
          label={book.genre}
          size="small"
          variant="outlined"
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            ISBN: {book.isbn}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Published: {new Date(book.publication_date).toLocaleDateString()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Chip
            label={getStatusText()}
            color={getStatusColor()}
            size="small"
          />
        </Box>
      </CardContent>

      <Box sx={{ p: 2, pt: 0 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            onClick={() => onView(book)}
          >
            View Details
          </Button>
          
          {isLibrarian && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => onEdit(book)}
            >
              Edit
            </Button>
          )}
        </Box>

        {book.available_copies > 0 ? (
          <Button
            variant="contained"
            size="small"
            fullWidth
            onClick={handleBorrow}
          >
            Borrow Book
          </Button>
        ) : (
          <Button
            variant="outlined"
            size="small"
            fullWidth
            onClick={handleReserve}
            color="secondary"
          >
            Reserve Book
          </Button>
        )}
      </Box>
    </Card>
  );
};

export default BookCard;