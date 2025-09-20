import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Avatar,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  Book as BookIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  History as HistoryIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useApi } from '../../../hooks/useApi';
import { useApp } from '../../../contexts/AppContext';
import { formatDate } from '../../../utils/helpers';
import { BOOK_GENRES } from '../../../utils/constants';
import ReturnForm from '../../transactions/ReturnForm/ReturnForm';


const LibrarianDashboard = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    activeBorrows: 0,
    availableBooks: 0,
    overdueBooks: 0,
    pendingReturns: 0,
    totalUsers: 0,
    pendingFines: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [borrowFormData, setBorrowFormData] = useState({
    user_id: '',
    book_id: '',
    due_date: ''
  });
  const [borrowFormErrors, setBorrowFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookFormData, setBookFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    category: '',
    publication_date: '',
    publisher: '',
    total_copies: 1,
    available_copies: 1,
    description: '',
    language: 'English',
    pages: '',
    cover_image: null
  });
  const [bookFormErrors, setBookFormErrors] = useState({});
  const [coverPreview, setCoverPreview] = useState(null);
  const [borrowSearchTerm, setBorrowSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedBorrowRecord, setSelectedBorrowRecord] = useState(null);

  const { get, post, put, del, loading: apiLoading } = useApi();
  const { showNotification } = useApp();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, transactionsData, booksData, usersData, categoriesData] = await Promise.allSettled([
        get('/dashboard-stats/').catch(() => ({})),
        get('/borrow-records/').catch(() => ({})),
        get('/books/').catch(() => []),
        get('/users/').catch(() => []),
        get('/categories/').catch(() => [])
      ]);

      setStats({
        totalBooks: statsData.status === 'fulfilled' ? (statsData.value.totalBooks || 0) : 0,
        activeBorrows: statsData.status === 'fulfilled' ? (statsData.value.activeBorrows || 0) : 0,
        availableBooks: statsData.status === 'fulfilled' ? (statsData.value.availableBooks || 0) : 0,
        overdueBooks: statsData.status === 'fulfilled' ? (statsData.value.overdueBooks || 0) : 0,
        totalUsers: statsData.status === 'fulfilled' ? (statsData.value.totalUsers || 0) : 0,
        pendingFines: statsData.status === 'fulfilled' ? (statsData.value.pendingFines || 0) : 0,
        pendingReturns: 0
      });

      let transactions = [];
      if (transactionsData.status === 'fulfilled') {
        const data = transactionsData.value;
        if (Array.isArray(data)) {
          transactions = data;
        } else if (data && data.results && Array.isArray(data.results)) {
          transactions = data.results;
        } else if (data && typeof data === 'object') {
          transactions = Object.values(data);
        }
      }
      
      setRecentTransactions(Array.isArray(transactions) ? transactions.slice(0, 10) : []);

      let booksList = [];
      if (booksData.status === 'fulfilled') {
        const data = booksData.value;
        if (Array.isArray(data)) {
          booksList = data;
        } else if (data && data.results && Array.isArray(data.results)) {
          booksList = data.results;
        }
      }
      setBooks(booksList);

      let usersList = [];
      if (usersData.status === 'fulfilled') {
        const data = usersData.value;
        if (Array.isArray(data)) {
          usersList = data;
        } else if (data && data.results && Array.isArray(data.results)) {
          usersList = data.results;
        }
      }
      setUsers(usersList);

      let categoriesList = [];
      if (categoriesData.status === 'fulfilled') {
        const data = categoriesData.value;
        if (Array.isArray(data)) {
          categoriesList = data;
        } else if (data && data.results && Array.isArray(data.results)) {
          categoriesList = data.results;
        }
      }
      setCategories(categoriesList);

    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const validateBookForm = () => {
    const errors = {};
    
    if (!bookFormData.title) errors.title = 'Title is required';
    if (!bookFormData.author) errors.author = 'Author is required';
    if (!bookFormData.isbn) errors.isbn = 'ISBN is required';
    if (bookFormData.isbn && bookFormData.isbn.length > 13) errors.isbn = 'ISBN cannot be longer than 13 characters';
    if (!bookFormData.genre) errors.genre = 'Genre is required';
    if (!bookFormData.publication_date) errors.publication_date = 'Publication date is required';
    if (!bookFormData.publisher) errors.publisher = 'Publisher is required';
    
    if (bookFormData.total_copies < 1) errors.total_copies = 'Must be at least 1';
    if (bookFormData.available_copies < 0) errors.available_copies = 'Cannot be negative';
    if (bookFormData.available_copies > bookFormData.total_copies) {
      errors.available_copies = 'Available copies cannot exceed total copies';
    }
    
    if (bookFormData.pages && (bookFormData.pages < 1 || !Number.isInteger(Number(bookFormData.pages)))) {
      errors.pages = 'Must be a positive integer';
    }
    
    setBookFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateBorrowForm = () => {
    const errors = {};

    if (!borrowFormData.user_id) errors.user_id = 'Please select a user';
    if (!borrowFormData.book_id) errors.book_id = 'Please select a book';
    if (!borrowFormData.due_date) errors.due_date = 'Please select a due date';
    else if (new Date(borrowFormData.due_date) < new Date()) {
      errors.due_date = 'Due date cannot be in the past';
    }

    setBorrowFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBookFormData({...bookFormData, cover_image: file});
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenReturnDialog = (transaction) => {
    setSelectedBorrowRecord(transaction);
    setReturnDialogOpen(true);
  };

  const handleCloseReturnDialog = () => {
    setReturnDialogOpen(false);
    setSelectedBorrowRecord(null);
  };

  const handleReturnSuccess = () => {
    fetchDashboardData();
    showNotification('Book returned successfully', 'success');
  };

  const handleBorrowBook = async () => {
    if (!validateBorrowForm()) return;

    setIsSubmitting(true);
    try {
      await post('/borrow-records/', {
        book: borrowFormData.book_id,
        borrower: borrowFormData.user_id,
        due_date: borrowFormData.due_date
      });
      showNotification('Book borrowed successfully', 'success');
      setBorrowDialogOpen(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Error borrowing book:', error);
      showNotification('Error borrowing book', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenBookDialog = (book = null) => {
    if (book) {
      setSelectedBook(book);
      setBookFormData({
        title: book.title || '',
        author: book.author || '',
        isbn: book.isbn || '',
        genre: book.genre || '',
        category: book.category?.id || '',
        publication_date: book.publication_date || '',
        publisher: book.publisher || '',
        total_copies: book.total_copies || 1,
        available_copies: book.available_copies || 1,
        description: book.description || '',
        language: book.language || 'English',
        pages: book.pages || '',
        cover_image: null
      });
      setCoverPreview(book.cover_image || null);
    } else {
      setSelectedBook(null);
      setBookFormData({
        title: '',
        author: '',
        isbn: '',
        genre: '',
        category: '',
        publication_date: '',
        publisher: '',
        total_copies: 1,
        available_copies: 1,
        description: '',
        language: 'English',
        pages: '',
        cover_image: null
      });
      setCoverPreview(null);
    }
    setBookFormErrors({});
    setBookDialogOpen(true);
  };

  const handleSaveBook = async () => {
    if (!validateBookForm()) return;

    try {
      // Prepare data for API
      const formData = new FormData();
      Object.keys(bookFormData).forEach(key => {
        if (key === 'cover_image' && bookFormData[key]) {
          formData.append(key, bookFormData[key]);
        } else if (bookFormData[key] !== null) {
          formData.append(key, bookFormData[key]);
        }
      });

      if (selectedBook) {
        await put(`/books/${selectedBook.id}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        showNotification('Book updated successfully', 'success');
      } else {
        await post('/books/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        showNotification('Book added successfully', 'success');
      }
      setBookDialogOpen(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Error saving book:', error);
      showNotification('Error saving book', 'error');
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await del(`/books/${bookId}/`);
        showNotification('Book deleted successfully', 'success');
        fetchDashboardData();
        setBorrowDialogOpen(false);
      } catch (error) {
        console.error('Error deleting book:', error);
        showNotification('Error deleting book', 'error');
      }
    }
  };

  const handleOpenBorrowDialog = () => {
    setBorrowFormData({
      user_id: '',
      book_id: '',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 14 days from now
    });
    setBorrowFormErrors({});
    setBorrowDialogOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Filter available books based on search term
  const filteredAvailableBooks = books.filter(book =>
    book && book.available_copies > 0 && (
      (book.title && book.title.toLowerCase().includes(borrowSearchTerm.toLowerCase())) ||
      (book.author && book.author.toLowerCase().includes(borrowSearchTerm.toLowerCase())) ||
      (book.isbn && book.isbn.toLowerCase().includes(borrowSearchTerm.toLowerCase()))
    )
  );

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user && user.user_type === 'student' && (
      (user.username && user.username.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (user.first_name && user.first_name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(userSearchTerm.toLowerCase()))
    )
  );

  if (loading && recentTransactions.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Librarian Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
          disabled={apiLoading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Books
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.totalBooks}
                  </Typography>
                </Box>
                <BookIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Active Borrows
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.activeBorrows}
                  </Typography>
                </Box>
                <ReceiptIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Available Books
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.availableBooks}
                  </Typography>
                </Box>
                <BookIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Overdue Books
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.overdueBooks}
                  </Typography>
                </Box>
                <WarningIcon color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Users
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.totalUsers}
                  </Typography>
                </Box>
                <PersonIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Pending Fines
                  </Typography>
                  <Typography variant="h4" component="div">
                    {formatCurrency(stats.pendingFines)}
                  </Typography>
                </Box>
                <WarningIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different sections */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Transactions" />
          <Tab label="Books Management" />
          <Tab label="Users" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Recent Transactions
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => {
                setTabValue(0);
                handleOpenBorrowDialog();
              }}
            >
              New Borrow Transaction
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Book</TableCell>
                  <TableCell>Borrower</TableCell>
                  <TableCell>Borrow Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.book_title || 'Unknown Book'}</TableCell>
                      <TableCell>{transaction.borrower_name || 'Unknown User'}</TableCell>
                      <TableCell>{formatDate(transaction.borrow_date)}</TableCell>
                      <TableCell>{formatDate(transaction.due_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.is_returned ? 'Returned' : 'Active'}
                          color={transaction.is_returned ? 'success' : 'primary'}
                          size="small"
                        />
                        {transaction.is_overdue && !transaction.is_returned && (
                          <Chip
                            label="Overdue"
                            color="error"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {!transaction.is_returned && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenReturnDialog(transaction)}
                          >
                            Process Return
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No recent transactions found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Books Management
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => {
                setTabValue(1);
                handleOpenBookDialog();
              }}
            >
              Add New Book
            </Button>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Cover</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>ISBN</TableCell>
                  <TableCell>Available</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      <Avatar 
                        src={book.cover_image} 
                        variant="square" 
                        sx={{ width: 40, height: 60 }}
                      >
                        <BookIcon />
                      </Avatar>
                    </TableCell>
                    <TableCell>{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>{book.isbn}</TableCell>
                    <TableCell>
                      <Chip
                        label={book.available_copies > 0 ? 'Available' : 'Out of Stock'}
                        color={book.available_copies > 0 ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenBookDialog(book)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteBook(book.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Users List
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.first_name} {user.last_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.user_type}
                        color={user.user_type === 'admin' ? 'error' : user.user_type === 'librarian' ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? 'Active' : 'Inactive'}
                        color={user.is_active ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button 
                variant="outlined" 
                startIcon={<BookIcon />} 
                fullWidth 
                sx={{ justifyContent: 'flex-start' }}
                onClick={() => {
                  setTabValue(1);
                  handleOpenBookDialog();
                }}
              >
                Add New Book
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<PersonIcon />} 
                fullWidth 
                sx={{ justifyContent: 'flex-start' }}
                onClick={() => setTabValue(2)}
              >
                Manage Users
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<ReceiptIcon />} 
                fullWidth 
                sx={{ justifyContent: 'flex-start' }}
                onClick={() => {
                  setTabValue(0);
                  handleOpenBorrowDialog();
                }}
              >
                Borrow Book for Student
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<WarningIcon />} 
                fullWidth 
                sx={{ justifyContent: 'flex-start' }}
                onClick={() => navigate('/reports')}
              >
                Overdue Reports
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Book Dialog */}
      <Dialog open={bookDialogOpen} onClose={() => setBookDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedBook ? 'Edit Book' : 'Add New Book'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  label="Title *"
                  value={bookFormData.title}
                  onChange={(e) => setBookFormData({...bookFormData, title: e.target.value})}
                  fullWidth
                  error={!!bookFormErrors.title}
                  helperText={bookFormErrors.title}
                />
              </Box>
              <Box>
                {coverPreview && (
                  <Avatar 
                    src={coverPreview} 
                    variant="square" 
                    sx={{ width: 60, height: 90 }}
                  />
                )}
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ mt: 1 }}
                >
                  Upload Cover
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleCoverImageChange}
                  />
                </Button>
              </Box>
            </Box>
            <TextField
              label="Author *"
              value={bookFormData.author}
              onChange={(e) => setBookFormData({...bookFormData, author: e.target.value})}
              fullWidth
              error={!!bookFormErrors.author}
              helperText={bookFormErrors.author}
            />
            <TextField
              label="ISBN *"
              value={bookFormData.isbn}
              onChange={(e) => setBookFormData({...bookFormData, isbn: e.target.value})}
              fullWidth
              inputProps={{ maxLength: 13 }}
              error={!!bookFormErrors.isbn}
              helperText={bookFormErrors.isbn || "Maximum 13 characters"}
            />
            <FormControl fullWidth error={!!bookFormErrors.genre}>
              <InputLabel>Genre *</InputLabel>
              <Select
                value={bookFormData.genre}
                label="Genre *"
                onChange={(e) => setBookFormData({...bookFormData, genre: e.target.value})}
              >
                {Object.entries(BOOK_GENRES).map(([key, value]) => (
                  <MenuItem key={key} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
              {bookFormErrors.genre && <Typography variant="caption" color="error">{bookFormErrors.genre}</Typography>}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={bookFormData.category}
                label="Category"
                onChange={(e) => setBookFormData({...bookFormData, category: e.target.value})}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Publication Date *"
              type="date"
              value={bookFormData.publication_date}
              onChange={(e) => setBookFormData({...bookFormData, publication_date: e.target.value})}
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!bookFormErrors.publication_date}
              helperText={bookFormErrors.publication_date}
            />
            <TextField
              label="Publisher *"
              value={bookFormData.publisher}
              onChange={(e) => setBookFormData({...bookFormData, publisher: e.target.value})}
              fullWidth
              error={!!bookFormErrors.publisher}
              helperText={bookFormErrors.publisher}
            />
            <TextField
              label="Total Copies *"
              type="number"
              value={bookFormData.total_copies}
              onChange={(e) => setBookFormData({...bookFormData, total_copies: parseInt(e.target.value) || 0})}
              fullWidth
              inputProps={{ min: 1 }}
              error={!!bookFormErrors.total_copies}
              helperText={bookFormErrors.total_copies}
            />
            <TextField
              label="Available Copies *"
              type="number"
              value={bookFormData.available_copies}
              onChange={(e) => setBookFormData({...bookFormData, available_copies: parseInt(e.target.value) || 0})}
              fullWidth
              inputProps={{ min: 0, max: bookFormData.total_copies }}
              error={!!bookFormErrors.available_copies}
              helperText={bookFormErrors.available_copies}
            />
            <TextField
              label="Language"
              value={bookFormData.language}
              onChange={(e) => setBookFormData({...bookFormData, language: e.target.value})}
              fullWidth
            />
            <TextField
              label="Pages"
              type="number"
              value={bookFormData.pages}
              onChange={(e) => setBookFormData({...bookFormData, pages: e.target.value})}
              fullWidth
              inputProps={{ min: 1 }}
              error={!!bookFormErrors.pages}
              helperText={bookFormErrors.pages}
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              value={bookFormData.description}
              onChange={(e) => setBookFormData({...bookFormData, description: e.target.value})}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveBook} variant="contained">
            {selectedBook ? 'Update' : 'Add'} Book
          </Button>
        </DialogActions>
      </Dialog>

      {/* Borrow Dialog */}
      <Dialog open={borrowDialogOpen} onClose={() => setBorrowDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Borrow Book for Student
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* User Selection */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Select Student
              </Typography>
              <TextField
                fullWidth
                placeholder="Search students..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl fullWidth error={!!borrowFormErrors.user_id}>
                <InputLabel>Student *</InputLabel>
                <Select
                  value={borrowFormData.user_id}
                  label="Student *"
                  onChange={(e) => setBorrowFormData({...borrowFormData, user_id: e.target.value})}
                >
                  {filteredUsers.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.username}) - {user.email}
                    </MenuItem>
                  ))}
                </Select>
                {borrowFormErrors.user_id && (
                  <Typography variant="caption" color="error">
                    {borrowFormErrors.user_id}
                  </Typography>
                )}
              </FormControl>
            </Box>

            {/* Book Selection */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Select Book
              </Typography>
              <TextField
                fullWidth
                placeholder="Search available books..."
                value={borrowSearchTerm}
                onChange={(e) => setBorrowSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl fullWidth error={!!borrowFormErrors.book_id}>
                <InputLabel>Book *</InputLabel>
                <Select
                  value={borrowFormData.book_id}
                  label="Book *"
                  onChange={(e) => setBorrowFormData({...borrowFormData, book_id: e.target.value})}
                >
                  {filteredAvailableBooks.map((book) => (
                    <MenuItem key={book.id} value={book.id}>
                      {book.title} by {book.author} (Available: {book.available_copies}, ISBN: {book.isbn})
                    </MenuItem>
                  ))}
                </Select>
                {borrowFormErrors.book_id && (
                  <Typography variant="caption" color="error">
                    {borrowFormErrors.book_id}
                  </Typography>
                )}
              </FormControl>
            </Box>

            {/* Due Date Selection */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Due Date
              </Typography>
              <TextField
                label="Due Date *"
                type="date"
                value={borrowFormData.due_date}
                onChange={(e) => setBorrowFormData({...borrowFormData, due_date: e.target.value})}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                error={!!borrowFormErrors.due_date}
                helperText={borrowFormErrors.due_date}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBorrowDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleBorrowBook} 
            variant="contained" 
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Borrow Book'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Return Form Dialog */}
      <ReturnForm
        open={returnDialogOpen}
        onClose={handleCloseReturnDialog}
        borrowRecord={selectedBorrowRecord}
        onSuccess={handleReturnSuccess}
      />
    </Box>
  );
};

export default LibrarianDashboard;