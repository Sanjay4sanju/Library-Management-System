import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  CardMedia,
  Divider
} from '@mui/material';
import {
  Book as BookIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Search as SearchIcon,
  LibraryBooks as LibraryBooksIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useApi } from '../../../hooks/useApi';
import { useAuth } from '../../../contexts/AuthContext';
import { useApp } from '../../../contexts/AppContext';

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const { showNotification } = useApp();
  const { get, post, loading, error } = useApi();
  const [dashboardData, setDashboardData] = useState({
    personalStats: null,
    borrows: [],
    readingHistory: [],
    fines: [],
    reservations: []
  });
  const [reserveDialogOpen, setReserveDialogOpen] = useState(false);
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [booksToReserve, setBooksToReserve] = useState([]);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [reserveSearchTerm, setReserveSearchTerm] = useState('');
  const [dialogTab, setDialogTab] = useState(0);
  const [booksLoading, setBooksLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [personalStats, borrowsData, readingHistory, finesData, reservationsData] = await Promise.all([
        get('/personal-stats/').catch(() => ({})),
        get('/borrow-records/').catch(() => []),
        get('/reading-history/').catch(() => []),
        get('/fines/').catch(() => []),
        get('/reservations/').catch(() => [])
      ]);

      const safeBorrowsData = Array.isArray(borrowsData) ? borrowsData : [];
      const safeFinesData = Array.isArray(finesData) ? finesData : [];
      const safeReservationsData = Array.isArray(reservationsData) ? reservationsData : [];
      
      setDashboardData({
        personalStats: personalStats || {},
        borrows: safeBorrowsData,
        readingHistory: Array.isArray(readingHistory) ? readingHistory : [],
        fines: safeFinesData,
        reservations: safeReservationsData
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setDashboardData({
        personalStats: {},
        borrows: [],
        readingHistory: [],
        fines: [],
        reservations: []
      });
    }
  };

  const fetchAvailableBooks = async () => {
    try {
      setBooksLoading(true);
      const booksData = await get('/books/');
      
      let booksList = [];
      if (Array.isArray(booksData)) {
        booksList = booksData;
      } else if (booksData && booksData.results && Array.isArray(booksData.results)) {
        booksList = booksData.results;
      } else if (booksData && typeof booksData === 'object') {
        booksList = Object.values(booksData);
      }

      const availableBooksList = booksList.filter(book => book && book.available_copies > 0);
      setAvailableBooks(availableBooksList);
    } catch (err) {
      console.error('Error fetching available books:', err);
      showNotification('Error fetching available books', 'error');
      setAvailableBooks([]);
    } finally {
      setBooksLoading(false);
    }
  };

  const fetchReservableBooks = async () => {
    try {
      setBooksLoading(true);
      const booksData = await get('/books/');
      
      let booksList = [];
      if (Array.isArray(booksData)) {
        booksList = booksData;
      } else if (booksData && booksData.results && Array.isArray(booksData.results)) {
        booksList = booksData.results;
      } else if (booksData && typeof booksData === 'object') {
        booksList = Object.values(booksData);
      }

      const reservableBooksList = booksList.filter(book => book && book.available_copies === 0);
      setBooksToReserve(reservableBooksList);
    } catch (err) {
      console.error('Error fetching reservable books:', err);
      showNotification('Error fetching reservable books', 'error');
      setBooksToReserve([]);
    } finally {
      setBooksLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
      fetchAvailableBooks();
    }
  }, [currentUser]);

  const activeBorrows = Array.isArray(dashboardData.borrows) 
    ? dashboardData.borrows.filter(borrow => !borrow.is_returned)
    : [];

  const overdueBorrows = Array.isArray(activeBorrows)
    ? activeBorrows.filter(borrow => borrow.is_overdue)
    : [];

  const recentHistory = Array.isArray(dashboardData.readingHistory)
    ? dashboardData.readingHistory.slice(0, 5)
    : [];

  const unpaidFines = Array.isArray(dashboardData.fines)
    ? dashboardData.fines.filter(fine => !fine.is_paid)
    : [];

  const activeReservations = Array.isArray(dashboardData.reservations)
    ? dashboardData.reservations.filter(reservation => reservation.status === 'pending')
    : [];

  // Filter available books based on search term
  const filteredAvailableBooks = availableBooks.filter(book =>
    book && (
      (book.title && book.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (book.genre && book.genre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (book.isbn && book.isbn.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  // Filter reservable books based on search term
  const filteredReservableBooks = booksToReserve.filter(book =>
    book && (
      (book.title && book.title.toLowerCase().includes(reserveSearchTerm.toLowerCase())) ||
      (book.author && book.author.toLowerCase().includes(reserveSearchTerm.toLowerCase())) ||
      (book.genre && book.genre.toLowerCase().includes(reserveSearchTerm.toLowerCase()))
    )
  );

  const handleReserveBook = async (bookId) => {
    try {
      await post(`/books/${bookId}/reserve/`);
      showNotification('Book reserved successfully', 'success');
      setReserveDialogOpen(false);
      fetchDashboardData();
      fetchReservableBooks();
      fetchAvailableBooks();
    } catch (err) {
      console.error('Error reserving book:', err);
      showNotification(err.response?.data?.error || 'Error reserving book', 'error');
    }
  };

const handleBorrowBook = async (bookId) => {
  try {
    await post('/borrow-records/', {
      book: bookId  
      
    });
    showNotification('Book borrowed successfully', 'success');
    setBorrowDialogOpen(false);
    fetchDashboardData();
    fetchAvailableBooks();
    fetchReservableBooks();
  } catch (err) {
    console.error('Error borrowing book:', err.response?.data);
    showNotification(
      err.response?.data?.error || 'Error borrowing book',
      'error'
    );
  }
};


  const handleCancelReservation = async (reservationId) => {
    try {
      await post(`/reservations/${reservationId}/cancel/`);
      showNotification('Reservation cancelled successfully', 'success');
      fetchDashboardData();
      fetchReservableBooks();
      fetchAvailableBooks();
    } catch (err) {
      console.error('Error cancelling reservation:', err);
      showNotification(err.response?.data?.error || 'Error cancelling reservation', 'error');
    }
  };

  const handlePayFine = async (fineId) => {
    try {
      await post(`/fines/${fineId}/pay/`);
      showNotification('Fine paid successfully', 'success');
      fetchDashboardData();
    } catch (err) {
      console.error('Error paying fine:', err);
      showNotification(err.response?.data?.error || 'Error paying fine', 'error');
    }
  };

  const handleOpenBorrowDialog = () => {
    fetchAvailableBooks();
    setSearchTerm('');
    setBorrowDialogOpen(true);
    setDialogTab(0);
  };

  const handleOpenReserveDialog = () => {
    fetchReservableBooks();
    setReserveSearchTerm('');
    setReserveDialogOpen(true);
    setDialogTab(0);
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
        Error loading dashboard: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {currentUser?.first_name || currentUser?.username}!
        </Typography>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <BookIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                {dashboardData.personalStats?.total_borrowed || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Books Borrowed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <HistoryIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                {activeBorrows.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently Borrowed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                {overdueBorrows.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overdue Books
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                {dashboardData.personalStats?.books_per_month || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Books/Month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Statistics */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <LibraryBooksIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                {availableBooks.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Books Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                {activeReservations.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Reservations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={4}>
        {/* Current Borrows */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <BookIcon sx={{ mr: 1 }} />
              Current Borrows ({activeBorrows.length})
            </Typography>
            
            {activeBorrows.length > 0 ? (
              <Box>
                {activeBorrows.map((borrow) => (
                  <Card key={borrow.id} sx={{ mb: 2, p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {borrow.book_title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Due: {new Date(borrow.due_date).toLocaleDateString()}
                        </Typography>
                        {borrow.is_overdue && (
                          <Chip
                            label="OVERDUE"
                            color="error"
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                      {borrow.is_overdue && (
                        <Chip
                          label={`Fine: $${borrow.fine_amount || 0}`}
                          color="error"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No active borrows. Start exploring our collection!
              </Typography>
            )}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenBorrowDialog}
              sx={{ mt: 2 }}
              fullWidth
            >
              Borrow New Book
            </Button>
          </Paper>
        </Grid>

        {/* Fines and Reservations */}
        <Grid item xs={12} md={6}>
          {/* Fines Section */}
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PaymentIcon sx={{ mr: 1 }} />
              Fines ({unpaidFines.length})
            </Typography>
            
            {unpaidFines.length > 0 ? (
              <List>
                {unpaidFines.map((fine) => (
                  <ListItem key={fine.id} divider>
                    <ListItemText
                      primary={`$${fine.amount} - ${fine.book_title || 'Imposed'}`}
                      secondary={`Due: ${new Date(fine.created_at).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handlePayFine(fine.id)}
                      >
                        
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No outstanding fines. Great job!
              </Typography>
            )}
          </Paper>

          {/* Reservations Section */}
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon sx={{ mr: 1 }} />
              Reservations ({activeReservations.length})
            </Typography>
            
            {activeReservations.length > 0 ? (
              <List>
                {activeReservations.map((reservation) => (
                  <ListItem key={reservation.id} divider>
                    <ListItemText
                      primary={reservation.book_title}
                      secondary={`Reserved: ${new Date(reservation.reservation_date).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => handleCancelReservation(reservation.id)}
                        color="error"
                      >
                        <CancelIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No active reservations
              </Typography>
            )}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenReserveDialog}
              sx={{ mt: 2 }}
              fullWidth
            >
              Make Reservation
            </Button>
          </Paper>
        </Grid>

        {/* Reading History */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Reading History
            </Typography>
            
            {recentHistory.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Book Title</TableCell>
                      <TableCell>Author</TableCell>
                      <TableCell>Borrow Date</TableCell>
                      <TableCell>Return Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.book_title}</TableCell>
                        <TableCell>{item.book_author}</TableCell>
                        <TableCell>{new Date(item.borrow_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {item.return_date ? new Date(item.return_date).toLocaleDateString() : 'Not returned'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.is_returned ? 'Returned' : 'Active'}
                            color={item.is_returned ? 'success' : 'primary'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No reading history yet. Start borrowing books to see your history here!
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Borrow Book Dialog */}
      <Dialog
        open={borrowDialogOpen}
        onClose={() => setBorrowDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{ '& .MuiDialog-paper': { minHeight: '600px' } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BookIcon sx={{ mr: 1 }} />
            Borrow Available Books
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search books by title, author, genre, or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {filteredAvailableBooks.length} book(s) available for borrowing
          </Typography>

          {booksLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredAvailableBooks.map((book) => (
                <Grid item xs={12} md={6} key={book.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {book.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        by {book.author}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Genre: {book.genre || 'N/A'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        ISBN: {book.isbn || 'N/A'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Available copies: {book.available_copies || 0}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleBorrowBook(book.id)}
                          disabled={(book.available_copies || 0) <= 0}
                        >
                          {(book.available_copies || 0) > 0 ? 'Borrow Book' : 'Out of Stock'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {!booksLoading && filteredAvailableBooks.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <BookIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No books available for borrowing
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm ? 'Try a different search term' : 'Check back later for new arrivals'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBorrowDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reserve Book Dialog */}
      <Dialog
        open={reserveDialogOpen}
        onClose={() => setReserveDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{ '& .MuiDialog-paper': { minHeight: '600px' } }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ScheduleIcon sx={{ mr: 1 }} />
            Reserve Books
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search books to reserve..."
            value={reserveSearchTerm}
            onChange={(e) => setReserveSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {filteredReservableBooks.length} book(s) available for reservation
          </Typography>

          {booksLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredReservableBooks.map((book) => (
                <Grid item xs={12} md={6} key={book.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {book.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        by {book.author}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Genre: {book.genre || 'N/A'}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        Status: Currently Borrowed
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleReserveBook(book.id)}
                          color="secondary"
                        >
                          Reserve Book
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {!booksLoading && filteredReservableBooks.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <ScheduleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No books available for reservation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {reserveSearchTerm ? 'Try a different search term' : 'All books are currently available for borrowing'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReserveDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentDashboard;