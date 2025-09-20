import InventoryIcon from '@mui/icons-material/Inventory';
import FilterList from '@mui/icons-material/FilterList';
import WarningIcon from '@mui/icons-material/Warning';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CircularProgress from '@mui/material/CircularProgress';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import React from 'react';
import {
  Typography,
  Chip,
  Rating,
  Divider,
  Button,
  Grid,
  Paper,
  Avatar,
} from '@mui/material';
import {
  Book as BookIcon,
  Person as AuthorIcon,
  Inventory as StockIcon,
  CalendarToday as DateIcon,
  Language as LanguageIcon,
  Numbers as PagesIcon,
  Business as PublisherIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';
import { useApi } from '../../../hooks/useApi';
import { formatDate } from '../../../utils/helpers';

const BookDetails = ({ book, onClose }) => {
  const { isLibrarian, isAdmin } = useAuth();
  const { showNotification } = useApp();
  const { post } = useApi();

  const handleBorrow = async () => {
    try {
      await post(`/books/${book.id}/borrow/`);
      showNotification('Book borrowed successfully', 'success');
      if (onClose) onClose();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Error borrowing book', 'error');
    }
  };

  const handleReserve = async () => {
    try {
      await post(`/books/${book.id}/reserve/`);
      showNotification('Book reserved successfully', 'success');
      if (onClose) onClose();
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

  if (!book) return null;

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              height: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'grey.100',
              mb: 2,
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
          </Paper>

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Chip
              label={getStatusText()}
              color={getStatusColor()}
              sx={{ mb: 2 }}
            />
            
            {book.available_copies > 0 ? (
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleBorrow}
                sx={{ mb: 1 }}
              >
                Borrow Book
              </Button>
            ) : (
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={handleReserve}
                color="secondary"
                sx={{ mb: 1 }}
              >
                Reserve Book
              </Button>
            )}
            
            <Button variant="outlined" fullWidth onClick={onClose}>
              Close
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={8}>
          <Typography variant="h4" component="h1" gutterBottom>
            {book.title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AuthorIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary">
              by {book.author}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
           
            <Typography variant="body2" color="text.secondary">
            
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InventoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  <strong>Available:</strong> {book.available_copies} / {book.total_copies}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DateIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  <strong>Published:</strong> {formatDate(book.publication_date)}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LanguageIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  <strong>Language:</strong> {book.language || 'English'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PagesIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  <strong>Pages:</strong> {book.pages || 'N/A'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PublisherIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  <strong>Publisher:</strong> {book.publisher}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BookIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>
                  <strong>ISBN:</strong> {book.isbn}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Chip label={book.genre} variant="outlined" sx={{ mr: 1 }} />
              {book.category && (
                <Chip label={book.category.name} variant="outlined" color="secondary" />
              )}
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {book.description || 'No description available.'}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BookDetails;