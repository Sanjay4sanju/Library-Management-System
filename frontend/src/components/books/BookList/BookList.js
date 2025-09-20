import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Pagination,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Book as BookIcon,
  Person as PersonIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { useFetch } from '../../../hooks/useFetch';
import { useAuth } from '../../../contexts/AuthContext';
import { useApi } from '../../../hooks/useApi';
import BookDetails from '../BookDetails/BookDetails';

const BookList = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [selectedBook, setSelectedBook] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const { currentUser } = useAuth();
  const { post } = useApi();

  const { data: books, loading, error, refetch } = useFetch('/books/');
  const { data: categories } = useFetch('/categories/');

  // Ensure books is always an array
  const safeBooks = Array.isArray(books) ? books : [];

  // Get unique genres from books
  const genres = useMemo(() => {
    const uniqueGenres = [...new Set(safeBooks.map(book => book.genre))].filter(Boolean);
    return ['all', ...uniqueGenres].sort();
  }, [safeBooks]);

  // Filter books based on search and filters
  const filteredBooks = useMemo(() => {
    let filtered = safeBooks;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(book =>
        book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by genre
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(book => book.genre === selectedGenre);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(book => book.category?.id?.toString() === selectedCategory);
    }

    // Filter by availability
    if (availabilityFilter !== 'all') {
      if (availabilityFilter === 'available') {
        filtered = filtered.filter(book => book.available_copies > 0);
      } else if (availabilityFilter === 'unavailable') {
        filtered = filtered.filter(book => book.available_copies === 0);
      }
    }

    return filtered;
  }, [safeBooks, searchTerm, selectedGenre, selectedCategory, availabilityFilter]);

  // Pagination
  const booksPerPage = 12;
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  
  // Ensure filteredBooks is an array before slicing
  const paginatedBooks = Array.isArray(filteredBooks) 
    ? filteredBooks.slice((page - 1) * booksPerPage, page * booksPerPage)
    : [];

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo(0, 0);
  };

  const handleBorrow = async (bookId) => {
    try {
      await post('/borrow-records/', {
        book: bookId,
        borrower: currentUser.id
      });
      alert('Book borrowed successfully!');
      refetch();
    } catch (err) {
      console.error('Error borrowing book:', err);
      alert('Error borrowing book. Please try again.');
    }
  };

  const handleReserve = async (bookId) => {
    try {
      await post(`/books/${bookId}/reserve/`);
      alert('Book reserved successfully!');
      refetch();
    } catch (err) {
      console.error('Error reserving book:', err);
      alert('Error reserving book. Please try again.');
    }
  };

  const handleViewDetails = (book) => {
    setSelectedBook(book);
    setDetailDialogOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Error loading books: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          <BookIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Library Catalog
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {safeBooks.length} books available
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Box mb={4} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search books, authors, ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Genre</InputLabel>
              <Select
                value={selectedGenre}
                label="Genre"
                onChange={(e) => setSelectedGenre(e.target.value)}
              >
                <MenuItem value="all">All Genres</MenuItem>
                {genres.filter(genre => genre !== 'all').map((genre) => (
                  <MenuItem key={genre} value={genre}>
                    {genre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {Array.isArray(categories) && categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Availability</InputLabel>
              <Select
                value={availabilityFilter}
                label="Availability"
                onChange={(e) => setAvailabilityFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="unavailable">Unavailable</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setSelectedGenre('all');
                setSelectedCategory('all');
                setAvailabilityFilter('all');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" mb={2}>
        Showing {filteredBooks.length} of {safeBooks.length} books
        {searchTerm && ` for "${searchTerm}"`}
      </Typography>

      {/* Books Grid */}
      {paginatedBooks.length > 0 ? (
        <>
          <Grid container spacing={3} mb={4}>
            {paginatedBooks.map((book) => (
              <Grid item key={book.id} xs={12} sm={6} md={4} lg={3}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {book.cover_image ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={book.cover_image}
                      alt={book.title}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      height={200}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bgcolor='grey.100'
                    >
                      <BookIcon sx={{ fontSize: 64, color: 'grey.400' }} />
                    </Box>
                  )}
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom noWrap>
                      {book.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                      by {book.author}
                    </Typography>

                    {book.category && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <CategoryIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                        {book.category.name}
                      </Typography>
                    )}

                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Chip
                        label={book.genre}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={book.available_copies > 0 ? 'Available' : 'Out of Stock'}
                        size="small"
                        color={book.available_copies > 0 ? 'success' : 'error'}
                      />
                    </Box>

                    <Typography variant="body2" gutterBottom>
                      ISBN: {book.isbn}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {book.available_copies} of {book.total_copies} copies available
                    </Typography>
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleViewDetails(book)}
                      sx={{ mb: 1 }}
                    >
                      View Details
                    </Button>
                    
                    {book.available_copies > 0 ? (
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => handleBorrow(book.id)}
                        disabled={!currentUser}
                      >
                        {currentUser ? 'Borrow Book' : 'Login to Borrow'}
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => handleReserve(book.id)}
                        disabled={!currentUser}
                      >
                        {currentUser ? 'Reserve Book' : 'Login to Reserve'}
                      </Button>
                    )}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      ) : (
        <Box textAlign="center" py={8}>
          <BookIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No books found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria or filters
          </Typography>
        </Box>
      )}

      {/* Book Details Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Book Details</DialogTitle>
        <DialogContent>
          {selectedBook && (
            <BookDetails 
              book={selectedBook} 
              onClose={() => setDetailDialogOpen(false)} 
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookList;