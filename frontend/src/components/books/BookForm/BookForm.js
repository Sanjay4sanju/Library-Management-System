import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useApi } from '../../../hooks/useApi';
import { useApp } from '../../../contexts/AppContext';
import {
  validateRequired,
  validateISBN,
  validatePositiveNumber,
  validateDate,
} from '../../../utils/validators';
import { BOOK_GENRES } from '../../../utils/constants';

const BookForm = ({ book, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    publication_date: '',
    publisher: '',
    total_copies: 1,
    available_copies: 1,
    description: '',
    language: 'English',
    pages: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  const { post, put, get } = useApi();
  const { showNotification } = useApp();

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        isbn: book.isbn || '',
        genre: book.genre || '',
        publication_date: book.publication_date || '',
        publisher: book.publisher || '',
        total_copies: book.total_copies || 1,
        available_copies: book.available_copies || 1,
        description: book.description || '',
        language: book.language || 'English',
        pages: book.pages || '',
        category: book.category || '',
      });
    }
    fetchCategories();
  }, [book]);

  const fetchCategories = async () => {
    try {
      const data = await get('/categories/');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }

    // Auto-set available copies when total copies changes
    if (field === 'total_copies') {
      const total = parseInt(value) || 0;
      const available = parseInt(formData.available_copies) || 0;
      if (available > total) {
        setFormData(prev => ({
          ...prev,
          available_copies: total,
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    newErrors.title = validateRequired(formData.title, 'Title');
    newErrors.author = validateRequired(formData.author, 'Author');
    newErrors.isbn = validateISBN(formData.isbn);
    newErrors.genre = validateRequired(formData.genre, 'Genre');
    newErrors.publication_date = validateDate(formData.publication_date);
    newErrors.publisher = validateRequired(formData.publisher, 'Publisher');
    newErrors.total_copies = validatePositiveNumber(formData.total_copies, 'Total copies');
    newErrors.available_copies = validatePositiveNumber(
      formData.available_copies,
      'Available copies'
    );

    if (formData.available_copies > formData.total_copies) {
      newErrors.available_copies = 'Available copies cannot exceed total copies';
    }

    // Remove null errors
    Object.keys(newErrors).forEach(key => {
      if (newErrors[key] === null) {
        delete newErrors[key];
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (book) {
        await put(`/books/${book.id}/`, formData);
        showNotification('Book updated successfully', 'success');
      } else {
        await post('/books/', formData);
        showNotification('Book added successfully', 'success');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving book:', error);
      showNotification('Error saving book', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Title"
            value={formData.title}
            onChange={handleChange('title')}
            error={!!errors.title}
            helperText={errors.title}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Author"
            value={formData.author}
            onChange={handleChange('author')}
            error={!!errors.author}
            helperText={errors.author}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="ISBN"
            value={formData.isbn}
            onChange={handleChange('isbn')}
            error={!!errors.isbn}
            helperText={errors.isbn}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            select
            label="Genre"
            value={formData.genre}
            onChange={handleChange('genre')}
            error={!!errors.genre}
            helperText={errors.genre}
          >
            {Object.entries(BOOK_GENRES).map(([key, value]) => (
              <MenuItem key={key} value={value}>
                {value}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category || ''}
              onChange={handleChange('category')}
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Publication Date"
            type="date"
            value={formData.publication_date}
            onChange={handleChange('publication_date')}
            error={!!errors.publication_date}
            helperText={errors.publication_date}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Publisher"
            value={formData.publisher}
            onChange={handleChange('publisher')}
            error={!!errors.publisher}
            helperText={errors.publisher}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Total Copies"
            type="number"
            value={formData.total_copies}
            onChange={handleChange('total_copies')}
            error={!!errors.total_copies}
            helperText={errors.total_copies}
            inputProps={{ min: 1 }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Available Copies"
            type="number"
            value={formData.available_copies}
            onChange={handleChange('available_copies')}
            error={!!errors.available_copies}
            helperText={errors.available_copies}
            inputProps={{ 
              min: 0, 
              max: formData.total_copies 
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Language"
            value={formData.language}
            onChange={handleChange('language')}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Pages"
            type="number"
            value={formData.pages}
            onChange={handleChange('pages')}
            inputProps={{ min: 1 }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description"
            value={formData.description}
            onChange={handleChange('description')}
          />
        </Grid>
      </Grid>

      {Object.keys(errors).length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Please fix the errors in the form.
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <CircularProgress size={24} />
          ) : (
            book ? 'Update Book' : 'Add Book'
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default BookForm;