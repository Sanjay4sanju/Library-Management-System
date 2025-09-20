import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
  Avatar,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  People as PeopleIcon,
  Book as BookIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  AttachMoney as AttachMoneyIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useApi } from '../../../hooks/useApi';
import { useApp } from '../../../contexts/AppContext';
import { formatDate, formatCurrency } from '../../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { BOOK_GENRES } from '../../../utils/constants';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    activeBorrows: 0,
    availableBooks: 0,
    overdueBooks: 0,
    totalUsers: 0,
    pendingFines: 0,
    totalFines: 0,
    collectedFines: 0,
    totalReservations: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    reservedBooks: 0
  });
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [fines, setFines] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [fineDialogOpen, setFineDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Updated book form data to match LibrarianDashboard
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

  const [userFormData, setUserFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    user_type: 'student',
    phone_number: '',
    address: '',
    date_of_birth: '',
    password: '',
    confirm_password: '',
    is_active: true
  });

  // Remove the reason field from the state
  const [fineFormData, setFineFormData] = useState({
    user: '',
    borrow_record: '',
    amount: '',
    is_paid: false
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });

  const navigate = useNavigate();
  const { get, post, put, del, loading: apiLoading } = useApi();
  const { showNotification } = useApp();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [
        statsData, 
        borrowData, 
        booksData, 
        finesData, 
        reservationsData, 
        usersData,
        categoriesData
      ] = await Promise.allSettled([
        get('/dashboard-stats/'),
        get('/borrow-records/'),
        get('/books/'),
        get('/fines/'),
        get('/reservations/'),
        get('/users/'),
        get('/categories/')
      ]);

      // Calculate statistics
      let totalFinesAmount = 0;
      let pendingFinesAmount = 0;
      let collectedFinesAmount = 0;
      let activeUsersCount = 0;
      let inactiveUsersCount = 0;
      let reservedBooksCount = 0;

      if (finesData.status === 'fulfilled') {
        const finesList = Array.isArray(finesData.value) ? finesData.value : 
                         (finesData.value.results || []);
        
        // Calculate all fines amounts safely
        finesList.forEach(fine => {
          const amount = parseFloat(fine.amount) || 0;
          totalFinesAmount += amount;
          
          if (fine.is_paid) {
            collectedFinesAmount += amount;
          } else {
            pendingFinesAmount += amount;
          }
        });
      }

      if (usersData.status === 'fulfilled') {
        const usersList = Array.isArray(usersData.value) ? usersData.value : 
                         (usersData.value.results || []);
        
        activeUsersCount = usersList.filter(user => user.is_active).length;
        inactiveUsersCount = usersList.length - activeUsersCount;
      }

      if (reservationsData.status === 'fulfilled') {
        const reservationsList = Array.isArray(reservationsData.value) ? reservationsData.value : 
                               (reservationsData.value.results || []);
        
        reservedBooksCount = reservationsList.filter(res => res.status === 'pending').length;
      }

      // Set stats with fallback values
      setStats({
        totalBooks: statsData.status === 'fulfilled' ? (statsData.value.totalBooks || 0) : 0,
        activeBorrows: statsData.status === 'fulfilled' ? (statsData.value.activeBorrows || 0) : 0,
        availableBooks: statsData.status === 'fulfilled' ? (statsData.value.availableBooks || 0) : 0,
        overdueBooks: statsData.status === 'fulfilled' ? (statsData.value.overdueBooks || 0) : 0,
        totalUsers: statsData.status === 'fulfilled' ? (statsData.value.totalUsers || 0) : 0,
        pendingFines: pendingFinesAmount,
        totalFines: totalFinesAmount,
        collectedFines: collectedFinesAmount,
        activeUsers: activeUsersCount,
        inactiveUsers: inactiveUsersCount,
        reservedBooks: reservedBooksCount,
        totalReservations: reservationsData.status === 'fulfilled' ? 
          (Array.isArray(reservationsData.value) ? reservationsData.value.length : 
          reservationsData.value.count || 0) : 0
      });
      
      // Handle data responses
      const borrowRecordsList = borrowData.status === 'fulfilled' ? 
        (Array.isArray(borrowData.value) ? borrowData.value : borrowData.value.results || []) : [];
      setBorrowRecords(borrowRecordsList.slice(0, 10));

      const booksList = booksData.status === 'fulfilled' ? 
        (Array.isArray(booksData.value) ? booksData.value : booksData.value.results || []) : [];
      setBooks(booksList);

      const finesList = finesData.status === 'fulfilled' ? 
        (Array.isArray(finesData.value) ? finesData.value : finesData.value.results || []) : [];
      setFines(finesList);

      const reservationsList = reservationsData.status === 'fulfilled' ? 
        (Array.isArray(reservationsData.value) ? reservationsData.value : reservationsData.value.results || []) : [];
      setReservations(reservationsList);

      const usersList = usersData.status === 'fulfilled' ? 
        (Array.isArray(usersData.value) ? usersData.value : usersData.value.results || []) : [];
      setUsers(usersList);

      const categoriesList = categoriesData.status === 'fulfilled' ? 
        (Array.isArray(categoriesData.value) ? categoriesData.value : categoriesData.value.results || []) : [];
      setCategories(categoriesList);

    } catch (error) {
      setError('Failed to load dashboard data. Some endpoints might not be available yet.');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Book form validation function from LibrarianDashboard
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

  // Cover image handler from LibrarianDashboard
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

  const handleToggleUserStatus = async (user) => {
    try {
      const updatedUser = { ...user, is_active: !user.is_active };
      await put(`/users/${user.id}/`, updatedUser);
      showNotification(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`, 'success');
      fetchDashboardData();
    } catch (error) {
      console.error('Error toggling user status:', error);
      showNotification('Error updating user status', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await del(`/users/${userId}/`);
        showNotification('User deleted successfully', 'success');
        fetchDashboardData();
      } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Error deleting user', 'error');
      }
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await del(`/books/${bookId}/`);
        showNotification('Book deleted successfully', 'success');
        fetchDashboardData();
      } catch (error) {
        console.error('Error deleting book:', error);
        showNotification('Error deleting book', 'error');
      }
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await del(`/categories/${categoryId}/`);
        showNotification('Category deleted successfully', 'success');
        fetchDashboardData();
      } catch (error) {
        console.error('Error deleting category:', error);
        showNotification('Error deleting category', 'error');
      }
    }
  };

  // Updated book dialog handler to match LibrarianDashboard
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

  const handleOpenUserDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setUserFormData({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        user_type: user.user_type || 'student',
        phone_number: user.phone_number || '',
        address: user.address || '',
        date_of_birth: user.date_of_birth || '',
        password: '',
        confirm_password: '',
        is_active: user.is_active
      });
    } else {
      setSelectedUser(null);
      setUserFormData({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        user_type: 'student',
        phone_number: '',
        address: '',
        date_of_birth: '',
        password: '',
        confirm_password: '',
        is_active: true
      });
    }
    setUserDialogOpen(true);
  };

  const handleOpenFineDialog = () => {
    setFineFormData({
      user: '',
      borrow_record: '',
      amount: '',
      is_paid: false
    });
    setFineDialogOpen(true);
  };

  const handleOpenCategoryDialog = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setCategoryFormData({
        name: category.name || '',
        description: category.description || ''
      });
    } else {
      setSelectedCategory(null);
      setCategoryFormData({
        name: '',
        description: ''
      });
    }
    setCategoryDialogOpen(true);
  };

  // Updated book save handler to match LibrarianDashboard
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

  const handleSaveUser = async () => {
    try {
      if (userFormData.password !== userFormData.confirm_password) {
        showNotification('Passwords do not match', 'error');
        return;
      }

      const userData = { ...userFormData };
      delete userData.confirm_password;

      if (selectedUser) {
        if (!userData.password) {
          delete userData.password;
        }
        await put(`/users/${selectedUser.id}/`, userData);
        showNotification('User updated successfully', 'success');
      } else {
        await post('/users/', userData);
        showNotification('User added successfully', 'success');
      }
      setUserDialogOpen(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Error saving user:', error);
      showNotification('Error saving user', 'error');
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (selectedCategory) {
        await put(`/categories/${selectedCategory.id}/`, categoryFormData);
        showNotification('Category updated successfully', 'success');
      } else {
        await post('/categories/', categoryFormData);
        showNotification('Category added successfully', 'success');
      }
      setCategoryDialogOpen(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Error saving category:', error);
      showNotification('Error saving category', 'error');
    }
  };

  // Update the handleImposeFine function
  const handleImposeFine = async () => {
    try {
      const fineData = {
        user: parseInt(fineFormData.user),
        borrow_record: fineFormData.borrow_record 
          ? parseInt(fineFormData.borrow_record)
          : null,
        amount: parseFloat(fineFormData.amount),
        is_paid: fineFormData.is_paid === true  // ensure it's boolean, defaults to false
      };

      await post('/fines/', fineData);
      showNotification('Fine imposed successfully', 'success');
      setFineDialogOpen(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Error imposing fine:', error.response?.data || error);
      showNotification('Error imposing fine', 'error');
    }
  };

  const handlePayFine = async (fineId) => {
    try {
      await post(`/fines/${fineId}/pay/`);
      showNotification('Fine paid successfully', 'success');
      fetchDashboardData();
    } catch (error) {
      console.error('Error paying fine:', error);
      showNotification('Error paying fine', 'error');
    }
  };

  const handleReturnBook = async (recordId) => {
    try {
      await post(`/borrow-records/${recordId}/return_book/`);
      showNotification('Book returned successfully', 'success');
      fetchDashboardData();
    } catch (error) {
      console.error('Error returning book:', error);
      showNotification('Error returning book', 'error');
    }
  };

  const handleManageBooks = () => {
    setTabValue(0);
  };

  const handleBorrowRecords = () => {
    setTabValue(1);
  };

  const handleManageFines = () => {
    setTabValue(2);
  };

  const handleManageReservations = () => {
    setTabValue(3);
  };

  const handleManageUsers = () => {
    setTabValue(4);
  };

  const handleManageCategories = () => {
    setTabValue(5);
  };

  const getUserTypeColor = (type) => {
    switch (type) {
      case 'admin': return 'error';
      case 'librarian': return 'warning';
      case 'student': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'fulfilled': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
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
          Admin Dashboard
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
        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} sm={6} md={3}>
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
                <PeopleIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Active Users
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.activeUsers}
                  </Typography>
                </Box>
                <EventAvailableIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Inactive Users
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.inactiveUsers}
                  </Typography>
                </Box>
                <EventBusyIcon color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Fines
                  </Typography>
                  <Typography variant="h4" component="div">
                    {formatCurrency(stats.totalFines)}
                  </Typography>
                </Box>
                <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
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

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Collected Fines
                  </Typography>
                  <Typography variant="h4" component="div">
                    {formatCurrency(stats.collectedFines)}
                  </Typography>
                </Box>
                <ReceiptIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Active Reservations
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.reservedBooks}
                  </Typography>
                </Box>
                <BookIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm{...6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Reservations
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.totalReservations}
                  </Typography>
                </Box>
                <BookIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Books Inventory" />
          <Tab label="Borrow Records" />
          <Tab label="Fines Management" />
          <Tab label="Reservations" />
          <Tab label="Users" />
          <Tab label="Categories" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Books Inventory ({books.length})
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => handleOpenBookDialog()}
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
                  <TableCell>Available Copies</TableCell>
                  <TableCell>Total Copies</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {books.length > 0 ? (
                  books.map((book) => (
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
                      <TableCell>{book.available_copies}</TableCell>
                      <TableCell>{book.total_copies}</TableCell>
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No books found
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
          <Typography variant="h6" gutterBottom>
            Recent Borrow Activity ({borrowRecords.length})
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Book</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Borrow Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {borrowRecords.length > 0 ? (
                  borrowRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.book_title || 'Unknown Book'}</TableCell>
                      <TableCell>{record.borrower_name || 'Unknown User'}</TableCell>
                      <TableCell>{formatDate(record.borrow_date)}</TableCell>
                      <TableCell>{formatDate(record.due_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.is_returned ? 'Returned' : 'Active'}
                          color={record.is_returned ? 'success' : 'primary'}
                          size="small"
                        />
                        {record.is_overdue && !record.is_returned && (
                          <Chip
                            label="Overdue"
                            color="error"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {!record.is_returned && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleReturnBook(record.id)}
                          >
                            Mark Returned
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No borrow records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Fines Management ({fines.length})
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AttachMoneyIcon />}
              onClick={handleOpenFineDialog}
            >
              Impose Fine
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fines.length > 0 ? (
                  fines.map((fine) => (
                    <TableRow key={fine.id}>
                      <TableCell>{fine.user_name || 'Unknown User'}</TableCell>
                      <TableCell>{formatCurrency(fine.amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={fine.is_paid ? 'Paid' : 'Unpaid'}
                          color={fine.is_paid ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(fine.created_at)}</TableCell>
                      <TableCell>
                        {!fine.is_paid && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handlePayFine(fine.id)}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No fines found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Reservations ({reservations.length})
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Book</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Reservation Date</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reservations.length > 0 ? (
                  reservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell>{reservation.book_title || 'Unknown Book'}</TableCell>
                      <TableCell>{reservation.user_name || 'Unknown User'}</TableCell>
                      <TableCell>{formatDate(reservation.reservation_date)}</TableCell>
                      <TableCell>{formatDate(reservation.expiry_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={reservation.status || 'Pending'}
                          color={getStatusColor(reservation.status)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No reservations found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 4 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Users Management ({users.length})
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => handleOpenUserDialog()}
            >
              Add New User
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.first_name} {user.last_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.user_type}
                          color={getUserTypeColor(user.user_type)}
                          size="small"
                          sx={{ minWidth: '80px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_active ? 'Active' : 'Inactive'}
                          color={user.is_active ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenUserDialog(user)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleUserStatus(user)}
                          color={user.is_active ? 'warning' : 'success'}
                        >
                          {user.is_active ? <EventBusyIcon /> : <EventAvailableIcon />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabValue === 5 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Categories ({categories.length})
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => handleOpenCategoryDialog()}
            >
              Add New Category
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenCategoryDialog(category)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteCategory(category.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No categories found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button 
                variant="outlined" 
                startIcon={<BookIcon />} 
                fullWidth 
                sx={{ justifyContent: 'flex-start' }}
                onClick={handleManageBooks}
              >
                Manage Books
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<ReceiptIcon />} 
                fullWidth 
                sx={{ justifyContent: 'flex-start' }}
                onClick={handleBorrowRecords}
              >
                View Borrow Records
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<WarningIcon />} 
                fullWidth 
                sx={{ justifyContent: 'flex-start' }}
                onClick={handleManageFines}
              >
                Manage Fines
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<BookIcon />} 
                fullWidth 
                sx={{ justifyContent: 'flex-start' }}
                onClick={handleManageReservations}
              >
                Manage Reservations
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<PeopleIcon />} 
                fullWidth 
                sx={{ justifyContent: 'flex-start' }}
                onClick={handleManageUsers}
              >
                Manage Users
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DashboardIcon />} 
                fullWidth 
                sx={{ justifyContent: 'flex-start' }}
                onClick={handleManageCategories}
              >
                Manage Categories
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Book Dialog - Updated to match LibrarianDashboard */}
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

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Username"
              value={userFormData.username}
              onChange={(e) => setUserFormData({...userFormData, username: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="First Name"
              value={userFormData.first_name}
              onChange={(e) => setUserFormData({...userFormData, first_name: e.target.value})}
              fullWidth
            />
            <TextField
              label="Last Name"
              value={userFormData.last_name}
              onChange={(e) => setUserFormData({...userFormData, last_name: e.target.value})}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={userFormData.email}
              onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>User Type</InputLabel>
              <Select
                value={userFormData.user_type}
                label="User Type"
                onChange={(e) => setUserFormData({...userFormData, user_type: e.target.value})}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="librarian">Librarian</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Phone Number"
              value={userFormData.phone_number}
              onChange={(e) => setUserFormData({...userFormData, phone_number: e.target.value})}
              fullWidth
            />
            <TextField
              label="Address"
              multiline
              rows={2}
              value={userFormData.address}
              onChange={(e) => setUserFormData({...userFormData, address: e.target.value})}
              fullWidth
            />
            <TextField
              label="Date of Birth"
              type="date"
              value={userFormData.date_of_birth}
              onChange={(e) => setUserFormData({...userFormData, date_of_birth: e.target.value})}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Password"
              type="password"
              value={userFormData.password}
              onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
              fullWidth
              required={!selectedUser}
            />
            <TextField
              label="Confirm Password"
              type="password"
              value={userFormData.confirm_password}
              onChange={(e) => setUserFormData({...userFormData, confirm_password: e.target.value})}
              fullWidth
              required={!selectedUser}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={userFormData.is_active}
                  onChange={(e) => setUserFormData({...userFormData, is_active: e.target.checked})}
                />
              }
              label="Active User"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">
            {selectedUser ? 'Update' : 'Add'} User
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={fineDialogOpen} onClose={() => setFineDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Impose Fine
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>User *</InputLabel>
              <Select
                value={fineFormData.user}
                label="User *"
                onChange={(e) => setFineFormData({...fineFormData, user: e.target.value})}
                required
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Book (Optional)</InputLabel>
              <Select
                value={fineFormData.book || ''}
                label="Book (Optional)"
                onChange={(e) => setFineFormData({...fineFormData, book: e.target.value})}
              >
                <MenuItem value="">None</MenuItem>
                {books.map((book) => (
                  <MenuItem key={book.id} value={book.id}>
                    {book.title} by {book.author}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Amount *"
              type="number"
              value={fineFormData.amount}
              onChange={(e) => setFineFormData({...fineFormData, amount: e.target.value})}
              fullWidth
              required
            />
        
            <FormControlLabel
              control={
                <Switch
                  checked={fineFormData.is_paid}
                  onChange={(e) => setFineFormData({...fineFormData, is_paid: e.target.checked})}
                />
              }
              label="Mark as Paid"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFineDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleImposeFine} variant="contained">
            Impose Fine
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={categoryFormData.name}
              onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              value={categoryFormData.description}
              onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCategory} variant="contained">
            {selectedCategory ? 'Update' : 'Add'} Category
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;